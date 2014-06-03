/*globals qq*/
/**
 * Ajax requester used to send a POST to a traditional endpoint once all chunks for a specific file have uploaded
 * successfully.
 *
 * @param o Options from the caller - will override the defaults.
 * @constructor
 */
qq.traditional.AllChunksDoneAjaxRequester = function(o) {
    "use strict";

    var requester,
        method = "POST",
        options = {
            cors: {
                allowXdr: false,
                expected: false,
                sendCredentials: false
            },
            endpoint: null,
            log: function(str, level) {}
        },
        promises = {},
        endpointHandler = {
            get: function(id) {
                return options.endpoint;
            }
        };

    qq.extend(options, o);

    requester = qq.extend(this, new qq.AjaxRequester({
        acceptHeader: "application/json",
        validMethods: [method],
        method: method,
        successfulResponseCodes: (function() {
            var codes = {};
            codes[method] = [200, 201, 202];
            return codes;
        }()),
        endpointStore: endpointHandler,
        allowXRequestedWithAndCacheControl: false,
        cors: options.cors,
        log: options.log,
        onComplete: function(id, xhr, isError) {
            var promise = promises[id];

            delete promises[id];

            if (isError) {
                promise.failure(xhr);
            }
            else {
                promise.success(xhr);
            }
        }
    }));


    qq.extend(this, {
        complete: function(id, xhr, params, headers) {
            var promise = new qq.Promise();

            options.log("Submitting All Chunks Done request for " + id);

            promises[id] = promise;

            requester.initTransport(id)
                .withParams(params)
                .withHeaders(headers)
                .send(xhr);

            return promise;
        }
    });
};
