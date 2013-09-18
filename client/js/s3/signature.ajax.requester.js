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
qq.s3.SignatureAjaxRequestor = function(o) {
    "use strict";

    var requester,
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
                options.log('Error attempting to parse signature response: ' + error, "error");
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

    requester = new qq.AjaxRequestor({
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


    return {
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

            requester.send(id, null, params);
            pendingSignatures[id] = {
                promise: promise,
                expectingPolicy: options.expectingPolicy
            };

            return promise;
        }
    };
};
