/* globals qq, CryptoJS */
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
                credentialsProvider: {},
                endpoint: null,
                customHeaders: {}
            },
            maxConnections: 3,
            paramsStore: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {}
        },
        credentialsProvider;

    qq.extend(options, o, true);
    credentialsProvider = options.signatureSpec.credentialsProvider;

    function handleSignatureReceived(id, xhrOrXdr, isError) {
        var responseJson = xhrOrXdr.responseText,
            pendingSignatureData = pendingSignatures[id],
            promise = pendingSignatureData.promise,
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
        else {
            promise.success(response);
        }
    }

    function getToSignAndEndOfUrl(type, bucket, key, contentType, headers, uploadId, partNum) {
        var method = "POST",
            headerNames = [],
            headersAsString = "",
            endOfUrl;

        /*jshint indent:false */
        switch(type) {
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_ABORT:
                method = "DELETE";
                endOfUrl = qq.format("uploadId={}", uploadId);
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_INITIATE:
                endOfUrl = "uploads";
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_COMPLETE:
                endOfUrl = qq.format("uploadId={}", uploadId);
                break;
            case thisSignatureRequester.REQUEST_TYPE.MULTIPART_UPLOAD:
                method = "PUT";
                endOfUrl = qq.format("partNumber={}&uploadId={}", partNum, uploadId);
                break;
        }

        endOfUrl = key + "?" + endOfUrl;

        qq.each(headers, function(name) {
            headerNames.push(name);
        });
        headerNames.sort();

        qq.each(headerNames, function(idx, name) {
            headersAsString += name + ":" + headers[name] + "\n";
        });

        return {
            toSign: qq.format("{}\n\n{}\n\n{}/{}/{}",
                        method, contentType || "", headersAsString || "\n", bucket, endOfUrl),
            endOfUrl: endOfUrl
        };
    }

    function determineSignatureClientSide(toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken) {
        var updatedHeaders;

        // REST API request
        if (toBeSigned.signatureConstructor) {
            if (updatedSessionToken) {
                updatedHeaders = toBeSigned.signatureConstructor.getHeaders();
                updatedHeaders[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = updatedSessionToken;
                toBeSigned.signatureConstructor.withHeaders(updatedHeaders);
            }

            signApiRequest(toBeSigned.signatureConstructor.getToSign().stringToSign, signatureEffort);
        }
        // Form upload (w/ policy document)
        else {
            updatedSessionToken && qq.s3.util.refreshPolicyCredentials(toBeSigned, updatedSessionToken);
            signPolicy(toBeSigned, signatureEffort, updatedAccessKey, updatedSessionToken);
        }
    }

    function signPolicy(policy, signatureEffort, updatedAccessKey, updatedSessionToken) {
        var policyStr = JSON.stringify(policy),
            policyWordArray = CryptoJS.enc.Utf8.parse(policyStr),
            base64Policy = CryptoJS.enc.Base64.stringify(policyWordArray),
            policyHmacSha1 = CryptoJS.HmacSHA1(base64Policy, credentialsProvider.get().secretKey),
            policyHmacSha1Base64 = CryptoJS.enc.Base64.stringify(policyHmacSha1);

        signatureEffort.success({
            policy: base64Policy,
            signature: policyHmacSha1Base64
        }, updatedAccessKey, updatedSessionToken);
    }

    function signApiRequest(headersStr, signatureEffort) {
        var headersWordArray = CryptoJS.enc.Utf8.parse(headersStr),
            headersHmacSha1 = CryptoJS.HmacSHA1(headersWordArray, credentialsProvider.get().secretKey),
            headersHmacSha1Base64 = CryptoJS.enc.Base64.stringify(headersHmacSha1);

        signatureEffort.success({signature: headersHmacSha1Base64});
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
        cors: options.cors,
        successfulResponseCodes: {
            POST: [200]
        }
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
                signatureEffort = new qq.Promise();

            if (credentialsProvider.get().secretKey && window.CryptoJS) {
                if (credentialsProvider.get().expiration.getTime() > Date.now()) {
                    determineSignatureClientSide(toBeSigned, signatureEffort);
                }
                // If credentials are expired, ask for new ones before attempting to sign request
                else {
                    credentialsProvider.onExpired().then(function() {
                        determineSignatureClientSide(toBeSigned,
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

                if (params.signatureConstructor) {
                    params = {headers: params.signatureConstructor.getToSign().stringToSign};
                }

                requester.initTransport(id)
                    .withParams(params)
                    .send();

                pendingSignatures[id] = {
                    promise: signatureEffort
                };
            }

            return signatureEffort;
        },

        constructStringToSign: function(type, bucket, key) {
            var headers = {},
                uploadId, contentType, partNum, toSignAndEndOfUrl;

            return {
                withHeaders: function(theHeaders) {
                    headers = theHeaders;
                    return this;
                },

                withUploadId: function(theUploadId) {
                    uploadId = theUploadId;
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

                getToSign: function() {
                    var sessionToken = credentialsProvider.get().sessionToken;

                    headers["x-amz-date"] = new Date().toUTCString();

                    if (sessionToken) {
                        headers[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
                    }

                    toSignAndEndOfUrl = getToSignAndEndOfUrl(type, bucket, key, contentType, headers, uploadId, partNum);

                    return {
                        headers: (function() {
                            if (contentType) {
                                headers["Content-Type"] = contentType;
                            }

                            return headers;
                        }()),
                        endOfUrl: toSignAndEndOfUrl.endOfUrl,
                        stringToSign: toSignAndEndOfUrl.toSign
                    };
                },

                getHeaders: function() {
                    return qq.extend({}, headers);
                },

                getEndOfUrl: function() {
                    return toSignAndEndOfUrl && toSignAndEndOfUrl.endOfUrl;
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
