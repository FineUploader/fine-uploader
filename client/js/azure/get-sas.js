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

    function sasResponseReceived(params, xhr, isError) {
        var promise = requestPromises[params.id];

        if (isError) {
            promise.failure("Received response code " + xhr.status, xhr);
        }
        else {
            if (xhr.responseText.length) {

                var responseJson;

                try {
                    responseJson = JSON.parse(xhr.responseText);
                } catch (error) {
                    options.log(qq.format("Validity period not provided for SAS for file ID {}. SAS request will be sent for each chunk. JSON parse error: '{}'", params.id, error));
                }

                if (responseJson) {
                    var sasData = {
                        sasUrl: responseJson.sasUrl,
                        validFor: responseJson.validFor - 15, // extract 15 seconds from validity time to cater for latency between client and server
                        requestedAtTimestamp: parseInt((new Date().getTime()) / 1000) // current timestamp (in seconds)
                    };
                    
                    localStorage['qqazure_sas_' + params.blobUri] = JSON.stringify(sasData);
                                            
                    promise.success(sasData.sasUrl);
                } else {
                    // fallback; only the sas is returned without expiration time
                    promise.success(xhr.responseText);
                }
            }
            else {
                promise.failure("Empty response.", xhr);
            }
        }

        delete requestPromises[params.id];
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

            requestPromises[id] = requestPromise;

            var cachedSasData = localStorage['qqazure_sas_' + blobUri];
            var sasUrl;

            if (cachedSasData) {
                cachedSasData = JSON.parse(cachedSasData);
                var currentTimestamp = parseInt((new Date().getTime()) / 1000);
                
                // check if sas is valid based on timestamps
                if (cachedSasData.validFor > (currentTimestamp - cachedSasData.requestedAtTimestamp)) {
                    sasUrl = cachedSasData.sasUrl;
                }
            }
            
            if (sasUrl) {
                options.log(qq.format("Ignoring GET SAS request for file ID {} because the previous request is still valid.", id));				
                requestPromise.success(sasUrl);
            } else {	
                options.log(qq.format("Submitting GET SAS request for a {} REST request related to file ID {}.", restVerb, id));				
                var params = { id: id, blobUri: blobUri };
                requester.initTransport(params)
                    .withParams({
                        bloburi: blobUri,
                        _method: restVerb
                    })
                    .withCacheBuster()
                    .send();
            }


            return requestPromise;
        }
    });
};
