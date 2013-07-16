/*globals qq, XMLHttpRequest*/
/**
 * Sends a POST request to the server to notify it of a successful upload to S3.
 *
 * @param o Options associated with all requests.
 * @returns {{sendSuccessRequest: Function}} API method used to initiate the request.
 * @constructor
 */
qq.s3.UploadSuccessAjaxRequester = function(o) {
    "use strict";

    var requester,
        validMethods = ["POST"],
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
        if (isError) {
            options.log('Upload success request was rejected by the server.', 'error');
        }
        else {
            options.log('Upload success was acknowledged by the server.');
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
         */
        sendSuccessRequest: function(id, spec) {
            options.log("Submitting upload success request/notification for " + id);
            requester.send(id, null, spec);
        }
    };
};
