/*globals qq*/
/**
 * Sends a POST request to the server in an attempt to solicit signatures for various S3-related requests.  This include
 * (but are not limited to) HTML Form Upload requests and Multipart Uploader requests (via the S3 REST API).
 * This module also parses the response and attempts to determine if the effort was successful.
 *
 * @param o Options associated with all such requests
 * @returns {{getSignature: Function}} API method used to initiate the signature request.
 * @constructor
 */
qq.s3.SignatureAjaxRequester = function(o) {
    "use strict";

    var requester,
        thisSignatureRequester = this,
        pendingSignatures = {},
        options = {
            expectingPolicy: false,
            method: "POST",
            signatureSpec: {
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
        };

    qq.extend(options, o, true);

    function handleSignatureReceived(id, xhrOrXdr, isError) {
        var responseJson = xhrOrXdr.responseText,
            pendingSignatureData = pendingSignatures[id],
            expectingPolicy = pendingSignatureData.expectingPolicy,
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
            if (expectingPolicy && !response.policy) {
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

    requester = new qq.AjaxRequester({
        method: options.method,
        contentType: "application/json; charset=utf-8",
        endpointStore: {
            getEndpoint: function() {
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
    });


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
                promise = new qq.Promise();

            options.log("Submitting S3 signature request for " + id);

            requester.initTransport(id)
                .withParams(params)
                .send();

            pendingSignatures[id] = {
                promise: promise,
                expectingPolicy: options.expectingPolicy
            };

            return promise;
        },

        constructStringToSign: function(type, bucket, key) {
            var headers = {},
                uploadId, contentType, partNum;

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
                    headers["x-amz-date"] = new Date().toUTCString();
                    var toSignAndEndOfUrl = getToSignAndEndOfUrl(type, bucket, key, contentType, headers, uploadId, partNum);

                    return {
                        headers: contentType ? qq.extend(headers, {"Content-Type": contentType}) : headers,
                        endOfUrl: toSignAndEndOfUrl.endOfUrl,
                        stringToSign: toSignAndEndOfUrl.toSign
                    };
                }
            };
        }
    });
};

qq.s3.SignatureAjaxRequester.prototype.REQUEST_TYPE = {
    MULTIPART_INITIATE: "multipart_initiate",
    MULTIPART_COMPLETE: "multipart_complete",
    MULTIPART_ABORT: "multipart_abort",
    MULTIPART_UPLOAD: "multipart_upload"
};
