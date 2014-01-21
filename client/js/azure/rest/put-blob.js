/* globals qq */
/**
 * Implements the Put Blob Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd179451.aspx.
 */
qq.azure.PutBlob = function(o) {
    "use strict";

    var requester,
        options = {
            onProgress: function(id, loaded, total) {},
            onUpload: function(id) {},
            onComplete: function(id, xhr, isError) {},
            log: function(str, level) {}
        },
        endpoints = [],
        endpointHandler = {
            get: function(id) {
                return endpoints[id];
            }
        };

    qq.extend(options, o);

    requester = new qq.AjaxRequester({
        validMethods: ["PUT"],
        method: "PUT",
        successfulResponseCodes: {
            "PUT": [201]
        },
        contentType: null,
        customHeaders: {
            "x-ms-blob-type": "BlockBlob"
        },
        endpointStore: endpointHandler,
        allowXRequestedWithAndCacheControl: false,
        cors: {
            expected: true
        },
        log: options.log,
        onSend: options.onUpload,
        onComplete: options.onComplete,
        onProgress: options.onProgress
    });


    qq.extend(this, {
        upload: function(id, url, headers, file) {
            options.log("Submitting Put Blob request for " + id);

            endpoints[id] = url;

            return requester.initTransport(id)
                .withPayload(file)
                .send();
        }
    });
};
