/*globals qq, XMLHttpRequest*/
/**
 * Sends a POST request to the server to notify it of a successful upload to S3.  The server is expected to indicate success
 * or failure via the response status.  Specific information about the failure can be passed from the server via an `error`
 * property (by default) in an "application/json" response.
 *
 * @param o Options associated with all requests.
 * @returns {{sendSuccessRequest: Function}} API method used to initiate the request.
 * @constructor
 */
qq.s3.UploadSuccessAjaxRequester = function(o) {
    "use strict";

    var requester,
        validMethods = ["POST"],
        pendingRequests = [],
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
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for S3 Upload Success requests!");
    }

    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    function handleSuccessResponse(id, xhrOrXdr, isError) {
        var promise = pendingRequests[id],
            responseJson = xhrOrXdr.responseText,
            parsedResponse;

        delete pendingRequests[id];

        options.log(qq.format("Received the following response body to an AWS upload success request for id {}: {}", id, responseJson));

        try {
            parsedResponse = qq.parseJson(responseJson);

            if (isError) {
                options.log('Upload success request was rejected by the server.', 'error');
                promise.failure(parsedResponse);
            }
            else {
                options.log('Upload success was acknowledged by the server.');
                promise.success(parsedResponse);
            }
        }
        catch (error) {
            // This will be executed if a JSON response is not present.  This is not mandatory, so account for this properly.
            if (isError) {
                options.log(qq.format('Your server indicated failure in its AWS upload success request response for id {}!', id), 'error');
                promise.failure({success: false});
            }
            else {
                options.log('Upload success was acknowledged by the server.');
                promise.success({success: true});
            }
        }
    }

    requester = new qq.AjaxRequestor({
        method: getNormalizedMethod(),
        endpointStore: {
            getEndpoint: function() {
                return options.endpoint;
            }
        },
        paramsStore: options.paramsStore,
        maxConnections: options.maxConnections,
        customHeaders: options.customHeaders,
        log: options.log,
        onComplete: handleSuccessResponse,
        cors: options.cors,
        successfulResponseCodes: {
            POST: [200]
        }
    });


    return {
        /**
         * Sends a request to the server, notifying it that a recently submitted file was successfully sent to S3.
         *
         * @param id ID of the associated file
         * @param spec `Object` with the properties that correspond to important values that we want to
         * send to the server with this request.
         * @returns {qq.Promise} A promise to be fulfilled when the response has been received and parsed.  The parsed
         * payload of the response will be passed into the `failure` or `success` promise method.
         */
        sendSuccessRequest: function(id, spec) {
            var promise = new qq.Promise();

            options.log("Submitting upload success request/notification for " + id);
            requester.send(id, null, spec);
            pendingRequests[id] = promise;

            return promise;
        }
    };
};
