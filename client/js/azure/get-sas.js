/* globals qq */
/**
 * Sends a GET request to the integrator's server, which should return a Shared Access Signature URI used to
 * make a specific request on a Blob via the Azure REST API.
 */
qq.azure.GetSas = function(o) {
    "use strict";

    var requester,
        options = {
            cors: {
                expected: false,
                sendCredentials: false
            },
            customHeaders: {},
            restRequestVerb: "PUT",
            endpointStore: null,
            log: function(str, level) {}
        },
        requestPromises = {};

    qq.extend(options, o);

    function sasResponseReceived(id, xhr, isError) {
        var promise = requestPromises[id];

        if (isError) {
            promise.failure("Received response code " + xhr.status, xhr);
        }
        else {
            if (xhr.responseText.length) {
                promise.success(xhr.responseText);
            }
            else {
                promise.failure("Empty response.", xhr);
            }
        }

        delete requestPromises[id];
    }

    requester = qq.extend(this, new qq.AjaxRequester({
        acceptHeader: "application/json",
        validMethods: ["GET"],
        method: "GET",
        successfulResponseCodes: {
            GET: [200]
        },
        contentType: null,
        customHeaders: options.customHeaders,
        endpointStore: options.endpointStore,
        cors: options.cors,
        log: options.log,
        onComplete: sasResponseReceived
    }));

    qq.extend(this, {
        request: function(id, blobUri) {
            var requestPromise = new qq.Promise(),
                restVerb = options.restRequestVerb;

            options.log(qq.format("Submitting GET SAS request for a {} REST request related to file ID {}.", restVerb, id));

            requestPromises[id] = requestPromise;

            requester.initTransport(id)
                .withParams({
                    bloburi: blobUri,
                    _method: restVerb
                })
                .withCacheBuster()
                .send();

            return requestPromise;
        }
    });
};
