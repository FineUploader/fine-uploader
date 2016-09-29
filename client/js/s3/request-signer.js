/* globals qq, CryptoJS */

// IE 10 does not support Uint8ClampedArray. We don't need it, but CryptoJS attempts to reference it
// inside a conditional via an instanceof check, which breaks S3 v4 signatures for chunked uploads.
if (!window.Uint8ClampedArray) {
    window.Uint8ClampedArray = function() {};
}
/**
 * Handles signature determination for HTML Form Upload requests and Multipart Uploader requests (via the S3 REST API).
 *
 * If the S3 requests are to be signed server side, this module will send a POST request to the server in an attempt
 * to solicit signatures for various S3-related requests.  This module also parses the response and attempts
 * to determine if the effort was successful.
 *
 * If the S3 requests are to be signed client-side, without the help of a server, this module will utilize CryptoJS to
 * sign the requests directly in the browser and send them off to S3.
 *
 * @param o Options associated with all such requests
 * @returns {{getSignature: Function}} API method used to initiate the signature request.
 * @constructor
 */
qq.s3.RequestSigner = function(o) {
    "use strict";

    var requester,
        thisSignatureRequester = this,
        pendingSignatures = {},
        options = {
            expectingPolicy: false,
            method: "POST",
            signatureSpec: {
                drift: 0,
                credentialsProvider: {},
                endpoint: null,
                customHeaders: {},
                version: 2
            },
            maxConnections: 3,
            endpointStore: {},
            paramsStore: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {}
        },
        credentialsProvider,

        generateHeaders = function(signatureConstructor, signature, promise) {
            var headers = signatureConstructor.getHeaders();

            if (options.signatureSpec.version === 4) {
                headers.Authorization = qq.s3.util.V4_ALGORITHM_PARAM_VALUE +
                    " Credential=" + options.signatureSpec.credentialsProvider.get().accessKey + "/" +
                    qq.s3.util.getCredentialsDate(signatureConstructor.getRequestDate()) + "/" +
                    options.signatureSpec.region + "/" +
                    "s3/aws4_request," +
                    "SignedHeaders=" + signatureConstructor.getSignedHeaders() + "," +
                    "Signature=" + signature;
            }
            else {
                headers.Authorization = "AWS " + options.signatureSpec.credentialsProvider.get().accessKey + ":" + signature;
            }

            promise.success(headers, signatureConstructor.getEndOfUrl());
        },

        v2 = {
            getStringToSign: function(signatureSpec) {
                return qq.format("{}\n{}\n{}\n\n{}/{}/{}",
                    signatureSpec.method,
                    signatureSpec.contentMd5 || "",
                    signatureSpec.contentType || "",
                    signatureSpec.headersStr || "\n",
                    signatureSpec.bucket,
                    signatureSpec.endOfUrl);
            },

            signApiRequest: function(signatureConstructor, headersStr, signatureEffort) {
                var headersWordArray = qq.CryptoJS.enc.Utf8.parse(headersStr),
                    headersHmacSha1 = qq.CryptoJS.HmacSHA1(headersWordArray, credentialsProvider.get().secretKey),
                    headersHmacSha1Base64 = qq.CryptoJS.enc.Base64.stringify(headersHmacSha1);

                generateHeaders(signatureConstructor, headersHmacSha1Base64, signatureEffort);
            },

            signPolicy: function(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
                var policyStr = JSON.stringify(policy),
                    policyWordArray = qq.CryptoJS.enc.Utf8.parse(policyStr),
                    base64Policy = qq.CryptoJS.enc.Base64.stringify(policyWordArray),
                    policyHmacSha1 = qq.CryptoJS.HmacSHA1(base64Policy, credentialsProvider.get().secretKey),
                    policyHmacSha1Base64 = qq.CryptoJS.enc.Base64.stringify(policyHmacSha1);

                signatureEffort.success({
                    policy: base64Policy,
                    signature: policyHmacSha1Base64
                }, updatedAccessKey, updatedSessionToken);
            }
        },

        v4 = {
            getCanonicalQueryString: function(endOfUri) {
                var queryParamIdx = endOfUri.indexOf("?"),
                    canonicalQueryString = "",
                    encodedQueryParams, encodedQueryParamNames, queryStrings;

                if (queryParamIdx >= 0) {
                    encodedQueryParams = {};
                    queryStrings = endOfUri.substr(queryParamIdx + 1).split("&");

                    qq.each(queryStrings, function(idx, queryString) {
                        var nameAndVal = queryString.split("="),
                            paramVal = nameAndVal[1];

                        if (paramVal == null) {
                            paramVal = "";
                        }

                        encodedQueryParams[encodeURIComponent(nameAndVal[0])] = encodeURIComponent(paramVal);
                    });

                    encodedQueryParamNames = Object.keys(encodedQueryParams).sort();
                    encodedQueryParamNames.forEach(function(encodedQueryParamName, idx) {
                        canonicalQueryString += encodedQueryParamName + "=" + encodedQueryParams[encodedQueryParamName];
                        if (idx < encodedQueryParamNames.length - 1) {
                            canonicalQueryString += "&";
                        }
                    });
                }

                return canonicalQueryString;
            },

            getCanonicalRequest: function(signatureSpec) {
                return qq.format("{}\n{}\n{}\n{}\n{}\n{}",
                    signatureSpec.method,
                    v4.getCanonicalUri(signatureSpec.endOfUrl),
                    v4.getCanonicalQueryString(signatureSpec.endOfUrl),
                    signatureSpec.headersStr || "\n",
                    v4.getSignedHeaders(signatureSpec.headerNames),
                    signatureSpec.hashedContent);
            },

            getCanonicalUri: function(endOfUri) {
                var path = endOfUri,
                    queryParamIdx = endOfUri.indexOf("?");

                if (queryParamIdx > 0) {
                    path = endOfUri.substr(0, queryParamIdx);
                }
                return "/" + path;
            },

            getEncodedHashedPayload: function(body) {
                var promise = new qq.Promise(),
                    reader;

                if (qq.isBlob(body)) {
                    // TODO hash blob in webworker if this becomes a notable perf issue
                    reader = new FileReader();
                    reader.onloadend = function(e) {
                        if (e.target.readyState === FileReader.DONE) {
                            if (e.target.error) {
                                promise.failure(e.target.error);
                            }
                            else {
                                var wordArray = qq.CryptoJS.lib.WordArray.create(e.target.result);
                                promise.success(qq.CryptoJS.SHA256(wordArray).toString());
                            }
                        }
                    };
                    reader.readAsArrayBuffer(body);
                }
                else {
                    body = body || "";
                    promise.success(qq.CryptoJS.SHA256(body).toString());
                }

                return promise;
            },

            getScope: function(date, region) {
                return qq.s3.util.getCredentialsDate(date) + "/" +
                    region + "/s3/aws4_request";
            },

            getStringToSign: function(signatureSpec) {
                var canonicalRequest = v4.getCanonicalRequest(signatureSpec),
                    date = qq.s3.util.getV4PolicyDate(signatureSpec.date, signatureSpec.drift),
                    hashedRequest = qq.CryptoJS.SHA256(canonicalRequest).toString(),
                    scope = v4.getScope(signatureSpec.date, options.signatureSpec.region),
                    stringToSignTemplate = "AWS4-HMAC-SHA256\n{}\n{}\n{}";

                return {
                    hashed: qq.format(stringToSignTemplate, date, scope, hashedRequest),
                    raw: qq.format(stringToSignTemplate, date, scope, canonicalRequest)
                };
            },

            getSignedHeaders: function(headerNames) {
                var signedHeaders = "";

                headerNames.forEach(function(headerName, idx) {
                    signedHeaders += headerName.toLowerCase();

                    if (idx < headerNames.length - 1) {
                        signedHeaders += ";";
                    }
                });

                return signedHeaders;
            },

            signApiRequest: function(signatureConstructor, headersStr, signatureEffort) {
                var secretKey = credentialsProvider.get().secretKey,
                    headersPattern = /.+\n.+\n(\d+)\/(.+)\/s3\/.+\n(.+)/,
                    matches = headersPattern.exec(headersStr),
                    dateKey, dateRegionKey, dateRegionServiceKey, signingKey;

                dateKey = qq.CryptoJS.HmacSHA256(matches[1], "AWS4" + secretKey);
                dateRegionKey = qq.CryptoJS.HmacSHA256(matches[2], dateKey);
                dateRegionServiceKey = qq.CryptoJS.HmacSHA256("s3", dateRegionKey);
                signingKey = qq.CryptoJS.HmacSHA256("aws4_request", dateRegionServiceKey);

                generateHeaders(signatureConstructor, qq.CryptoJS.HmacSHA256(headersStr, signingKey), signatureEffort);
            },

            signPolicy: function(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
                var policyStr = JSON.stringify(policy),
                    policyWordArray = qq.CryptoJS.enc.Utf8.parse(policyStr),
                    base64Policy = qq.CryptoJS.enc.Base64.stringify(policyWordArray),
                    secretKey = credentialsProvider.get().secretKey,
                    credentialPattern = /.+\/(.+)\/(.+)\/s3\/aws4_request/,
                    credentialCondition = (function() {
                        var credential = null;
                        qq.each(policy.conditions, function(key, condition) {
                            var val = condition["x-amz-credential"];
                            if (val) {
                                credential = val;
                                return false;
                            }
                        });
                        return credential;
                    }()),
                    matches, dateKey, dateRegionKey, dateRegionServiceKey, signingKey;

                matches = credentialPattern.exec(credentialCondition);
                dateKey = qq.CryptoJS.HmacSHA256(matches[1], "AWS4" + secretKey);
                dateRegionKey = qq.CryptoJS.HmacSHA256(matches[2], dateKey);
                dateRegionServiceKey = qq.CryptoJS.HmacSHA256("s3", dateRegionKey);
                signingKey = qq.CryptoJS.HmacSHA256("aws4_request", dateRegionServiceKey);

                signatureEffort.success({
                    policy: base64Policy,
                    signature: qq.CryptoJS.HmacSHA256(base64Policy, signingKey).toString()
                }, updatedAccessKey, updatedSessionToken);
            }
        };

    qq.extend(options, o, true);
    credentialsProvider = options.signatureSpec.credentialsProvider;

    function handleSignatureReceived(id, xhrOrXdr, isError) {
        var responseJson = xhrOrXdr.responseText,
            pendingSignatureData = pendingSignatures[id],
            promise = pendingSignatureData.promise,
            signatureConstructor = pendingSignatureData.signatureConstructor,
            errorMessage, response;

        delete pendingSignatures[id];

        // Attempt to parse what we would expect to be a JSON response
        if (responseJson) {
            try {
                response = qq.parseJson(responseJson);
            }
            catch (error) {
                options.log("Error attempting to parse signature response: " + error, "error");
            }
        }

        // If we have received a parsable response, and it has an `invalid` property,
        // the policy document or request headers may have been tampered with client-side.
        if (response && response.invalid) {
            isError = true;
            errorMessage = "Invalid policy document or request headers!";
        }
        // Make sure the response contains policy & signature properties
        else if (response) {
            if (options.expectingPolicy && !response.policy) {
                isError = true;
                errorMessage = "Response does not include the base64 encoded policy!";
            }
            else if (!response.signature) {
                isError = true;
                errorMessage = "Response does not include the signature!";
            }
        }
        // Something unknown went wrong
        else {
            isError = true;
            errorMessage = "Received an empty or invalid response from the server!";
        }

        if (isError) {
            if (errorMessage) {
                options.log(errorMessage, "error");
            }

            promise.failure(errorMessage);
        }
        else if (signatureConstructor) {
            generateHeaders(signatureConstructor, response.signature, promise);
        }
        else {
            promise.success(response);
        }
    }

    function getStringToSignArtifacts(id, version, requestInfo) {
        var promise = new qq.Promise(),
            method = "POST",
            headerNames = [],
            headersStr = "",
            now = new Date(),
            endOfUrl, signatureSpec, toSign,

            generateStringToSign = function(requestInfo) {
                var contentMd5,
                    headerIndexesToRemove = [];

                qq.each(requestInfo.headers, function(name) {
                    headerNames.push(name);
                });
                headerNames.sort();

                qq.each(headerNames, function(idx, headerName) {
                    if (qq.indexOf(qq.s3.util.UNSIGNABLE_REST_HEADER_NAMES, headerName) < 0) {
                        headersStr += headerName.toLowerCase() + ":" + requestInfo.headers[headerName].trim() + "\n";
                    }
                    else if (headerName === "Content-MD5") {
                        contentMd5 = requestInfo.headers[headerName];
                    }
                    else {
                        headerIndexesToRemove.unshift(idx);
                    }
                });

                qq.each(headerIndexesToRemove, function(idx, headerIdx) {
                    headerNames.splice(headerIdx, 1);
                });

                signatureSpec = {
                    bucket: requestInfo.bucket,
                    contentMd5: contentMd5,
                    contentType: requestInfo.contentType,
                    date: now,
                    drift: options.signatureSpec.drift,
                    endOfUrl: endOfUrl,
                    hashedContent: requestInfo.hashedContent,
                    headerNames: headerNames,
                    headersStr: headersStr,
                    method: method
                };

                toSign = version === 2 ? v2.getStringToSign(signatureSpec) : v4.getStringToSign(signatureSpec);

                return {
                    date: now,
                    endOfUrl: endOfUrl,
                    signedHeaders: version === 4 ? v4.getSignedHeaders(signatureSpec.headerNames) : null,
                    toSign: version === 4 ? toSign.hashed : toSign,
                    toSignRaw: version === 4 ? toSign.raw : toSign
                };
            };

        /*jshint indent:false */
        switch (requestInfo.type) {
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_ABORT:
                method = "DELETE";
                endOfUrl = qq.format("uploadId={}", requestInfo.uploadId);
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_INITIATE:
                endOfUrl = "uploads";
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_COMPLETE:
                endOfUrl = qq.format("uploadId={}", requestInfo.uploadId);
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_UPLOAD:
                method = "PUT";
                endOfUrl = qq.format("partNumber={}&uploadId={}", requestInfo.partNum, requestInfo.uploadId);
                break;
        }

        endOfUrl = requestInfo.key + "?" + endOfUrl;

        if (version === 4) {
            v4.getEncodedHashedPayload(requestInfo.content).then(function(hashedContent) {
                requestInfo.headers["x-amz-content-sha256"] = hashedContent;
                requestInfo.headers.Host = requestInfo.host;
                requestInfo.headers["x-amz-date"] = qq.s3.util.getV4PolicyDate(now, options.signatureSpec.drift);
                requestInfo.hashedContent = hashedContent;

                promise.success(generateStringToSign(requestInfo));
            }, function (err) {
                promise.failure(err);
            });
        }
        else {
            promise.success(generateStringToSign(requestInfo));
        }

        return promise;
    }

    function determineSignatureClientSide(id, toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken) {
        var updatedHeaders;

        // REST API request
        if (toBeSigned.signatureConstructor) {
            if (updatedSessionToken) {
                updatedHeaders = toBeSigned.signatureConstructor.getHeaders();
                updatedHeaders[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = updatedSessionToken;
                toBeSigned.signatureConstructor.withHeaders(updatedHeaders);
            }

            toBeSigned.signatureConstructor.getToSign(id).then(function(signatureArtifacts) {
                signApiRequest(toBeSigned.signatureConstructor, signatureArtifacts.stringToSign, signatureEffort);
            }, function (err) {
                signatureEffort.failure(err);
            });
        }
        // Form upload (w/ policy document)
        else {
            updatedSessionToken && qq.s3.util.refreshPolicyCredentials(toBeSigned, updatedSessionToken);
            signPolicy(toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken);
        }
    }

    function signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
        if (options.signatureSpec.version === 4) {
            v4.signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken);
        }
        else {
            v2.signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken);
        }
    }

    function signApiRequest(signatureConstructor, headersStr, signatureEffort) {
        if (options.signatureSpec.version === 4) {
            v4.signApiRequest(signatureConstructor, headersStr, signatureEffort);
        }
        else {
            v2.signApiRequest(signatureConstructor, headersStr, signatureEffort);
        }
    }

    requester = qq.extend(this, new qq.AjaxRequester({
        acceptHeader: "application/json",
        method: options.method,
        contentType: "application/json; charset=utf-8",
        endpointStore: {
            get: function() {
                return options.signatureSpec.endpoint;
            }
        },
        paramsStore: options.paramsStore,
        maxConnections: options.maxConnections,
        customHeaders: options.signatureSpec.customHeaders,
        log: options.log,
        onComplete: handleSignatureReceived,
        cors: options.cors
    }));

    qq.extend(this, {
        /**
         * On success, an object containing the parsed JSON response will be passed into the success handler if the
         * request succeeds.  Otherwise an error message will be passed into the failure method.
         *
         * @param id File ID.
         * @param toBeSigned an Object that holds the item(s) to be signed
         * @returns {qq.Promise} A promise that is fulfilled when the response has been received.
         */
        getSignature: function(id, toBeSigned) {
            var params = toBeSigned,
                signatureConstructor = toBeSigned.signatureConstructor,
                signatureEffort = new qq.Promise(),
                queryParams;

            if (options.signatureSpec.version === 4) {
                queryParams = {v4: true};
            }

            if (credentialsProvider.get().secretKey && qq.CryptoJS) {
                if (credentialsProvider.get().expiration.getTime() > Date.now()) {
                    determineSignatureClientSide(id, toBeSigned, signatureEffort);
                }
                // If credentials are expired, ask for new ones before attempting to sign request
                else {
                    credentialsProvider.onExpired().then(function() {
                        determineSignatureClientSide(id, toBeSigned,
                            signatureEffort,
                            credentialsProvider.get().accessKey,
                            credentialsProvider.get().sessionToken);
                    }, function(errorMsg) {
                        options.log("Attempt to update expired credentials apparently failed! Unable to sign request.  ", "error");
                        signatureEffort.failure("Unable to sign request - expired credentials.");
                    });
                }
            }
            else {
                options.log("Submitting S3 signature request for " + id);

                if (signatureConstructor) {
                    signatureConstructor.getToSign(id).then(function(signatureArtifacts) {
                        params = {headers: signatureArtifacts.stringToSignRaw};
                        requester.initTransport(id)
                            .withParams(params)
                            .withQueryParams(queryParams)
                            .send();
                    }, function (err) {
                        options.log("Failed to construct signature. ", "error");
                        signatureEffort.failure("Failed to construct signature.");
                    });
                }
                else {
                    requester.initTransport(id)
                        .withParams(params)
                        .withQueryParams(queryParams)
                        .send();
                }

                pendingSignatures[id] = {
                    promise: signatureEffort,
                    signatureConstructor: signatureConstructor
                };
            }

            return signatureEffort;
        },

        constructStringToSign: function(type, bucket, host, key) {
            var headers = {},
                uploadId, content, contentType, partNum, artifacts;

            return {
                withHeaders: function(theHeaders) {
                    headers = theHeaders;
                    return this;
                },

                withUploadId: function(theUploadId) {
                    uploadId = theUploadId;
                    return this;
                },

                withContent: function(theContent) {
                    content = theContent;
                    return this;
                },

                withContentType: function(theContentType) {
                    contentType = theContentType;
                    return this;
                },

                withPartNum: function(thePartNum) {
                    partNum = thePartNum;
                    return this;
                },

                getToSign: function(id) {
                    var sessionToken = credentialsProvider.get().sessionToken,
                        promise = new qq.Promise(),
                        adjustedDate = new Date(Date.now() + options.signatureSpec.drift);

                    headers["x-amz-date"] = adjustedDate.toUTCString();

                    if (sessionToken) {
                        headers[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
                    }

                    getStringToSignArtifacts(id, options.signatureSpec.version, {
                        bucket: bucket,
                        content: content,
                        contentType: contentType,
                        headers: headers,
                        host: host,
                        key: key,
                        partNum: partNum,
                        type: type,
                        uploadId: uploadId
                    }).then(function(_artifacts_) {
                        artifacts = _artifacts_;
                        promise.success({
                            headers: (function() {
                                if (contentType) {
                                    headers["Content-Type"] = contentType;
                                }

                                delete headers.Host; // we don't want this to be set on the XHR-initiated request
                                return headers;
                            }()),
                            date: artifacts.date,
                            endOfUrl: artifacts.endOfUrl,
                            signedHeaders: artifacts.signedHeaders,
                            stringToSign: artifacts.toSign,
                            stringToSignRaw: artifacts.toSignRaw
                        });
                    }, function (err) {
                        promise.failure(err);
                    });

                    return promise;
                },

                getHeaders: function() {
                    return qq.extend({}, headers);
                },

                getEndOfUrl: function() {
                    return artifacts && artifacts.endOfUrl;
                },

                getRequestDate: function() {
                    return artifacts && artifacts.date;
                },

                getSignedHeaders: function() {
                    return artifacts && artifacts.signedHeaders;
                }
            };
        }
    });
};

qq.s3.RequestSigner.prototype.REQUEST_TYPE = {
    MULTIPART_INITIATE: "multipart_initiate",
    MULTIPART_COMPLETE: "multipart_complete",
    MULTIPART_ABORT: "multipart_abort",
    MULTIPART_UPLOAD: "multipart_upload"
};
