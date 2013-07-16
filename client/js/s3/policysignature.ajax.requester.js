/*globals qq, XMLHttpRequest*/
/**
 * Sends a POST request to the server in an attempt to solicit a signature for the S3 upload request policy document.
 * This module also parses the response and attempts to determine if the effort was successful.
 *
 * @param o Options associated with all such requests
 * @returns {{getSignature: Function}} API method used to initiate the signature request.
 * @constructor
 */
qq.s3.PolicySignatureAjaxRequestor = function(o) {
    "use strict";

    var requester,
        validMethods = ["POST"],
        pendingSignatures = [],
        options = {
            method: "POST",
            endpoint: null,
            maxConnections: 3,
            customHeaders: {},
            paramsStore: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {}
        };

    qq.extend(options, o);

    if (qq.indexOf(validMethods, getNormalizedMethod()) < 0) {
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for S3 signature requests!");
    }

    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    function handleSignatureReceived(id, xhrOrXdr, isError) {
        var responseJson = xhrOrXdr.responseText,
            promise = pendingSignatures[id],
            errorMessage, response;

        delete pendingSignatures[id];

        // Attempt to parse what we would expect to be a JSON response
        if (responseJson) {
            response = qq.parseJson(responseJson);
        }

        // If we have received a parsable response, and it has a `badPolicy` property,
        // the policy document may have been tampered with client-side.
        if (response && response.badPolicy) {
            isError = true;
            errorMessage = "Invalid policy document!";
        }
        // Make sure the response contains policy & signature properties
        else if (response) {
            if (!response.policy) {
                isError = true;
                errorMessage = "Response does not include the base64 encoded policy!";
            }
            else if (!response.signature) {
                isError = true;
                errorMessage = "Response does not include the base64 encoded signed policy!";
            }
        }
        // Something unknown went wrong
        else {
            isError = true;
            errorMessage = "Received an empty or invalid response from the server!";
        }


        if (isError) {
            options.log(errorMessage, "error");
            promise.failure(errorMessage);
        }
        else {
            promise.success(response);
        }
    }

    requester = new qq.AjaxRequestor({
        method: getNormalizedMethod(),
        contentType: "application/json; charset=utf-8",
        endpointStore: {
            getEndpoint: function() {
                return options.endpoint;
            }
        },
        paramsStore: options.paramsStore,
        maxConnections: options.maxConnections,
        customHeaders: options.customHeaders,
        log: options.log,
        onComplete: handleSignatureReceived,
        cors: options.cors,
        successfulResponseCodes: {
            POST: [200]
        }
    });


    return {
        /**
         * On success, an object containing the parsed JSON response (w/ policy and signature properties)
         * will be passed into the associated handler.
         *
         * @param id File ID.
         * @param policy Object containing the AWS policy associated with the file to be uploaded.
         * @returns {qq.Promise} A promise that is fulfilled when the response has been received.
         */
        getSignature: function(id, policy) {
            var params = policy,
                promise = new qq.Promise();

            options.log("Submitting S3 signature request for " + id);

            requester.send(id, null, params);
            pendingSignatures[id] = promise;

            return promise;
        }
    };
};
