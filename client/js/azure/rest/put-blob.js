/* globals qq */
/**
 * Implements the Put Blob Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd179451.aspx.
 */
qq.azure.PutBlob = function(o) {
    "use strict";

    var requester,
        method = "PUT",
        options = {
            getBlobMetadata: function(id) {},
            log: function(str, level) {}
        },
        endpoints = {},
        promises = {},
        endpointHandler = {
            get: function(id) {
                return endpoints[id];
            }
        };

    qq.extend(options, o);

    requester = qq.extend(this, new qq.AjaxRequester({
        validMethods: [method],
        method: method,
        successfulResponseCodes: (function() {
            var codes = {};
            codes[method] = [201];
            return codes;
        }()),
        contentType: null,
        customHeaders: function(id) {
            var params = options.getBlobMetadata(id),
                headers = qq.azure.util.getParamsAsHeaders(params);

            headers["x-ms-blob-type"] = "BlockBlob";

            return headers;
        },
        endpointStore: endpointHandler,
        allowXRequestedWithAndCacheControl: false,
        cors: {
            expected: true
        },
        log: options.log,
        onComplete: function(id, xhr, isError) {
            var promise = promises[id];

            delete endpoints[id];
            delete promises[id];

            if (isError) {
                promise.failure();
            }
            else {
                promise.success();
            }
        }
    }));


    qq.extend(this, {
        method: method,
        upload: function(id, xhr, url, file) {
            var promise = new qq.Promise();

            options.log("Submitting Put Blob request for " + id);

            promises[id] = promise;
            endpoints[id] = url;

            requester.initTransport(id)
                .withPayload(file)
                .withHeaders({"Content-Type": file.type})
                .send(xhr);

            return promise;
        }
    });
};
