/* globals qq */
/**
 * Implements the Put Blob Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd179451.aspx.
 */
qq.azure.PutBlob = function(o) {
    "use strict";

    var requester,
        method = "PUT",
        options = {
            onProgress: function(id, loaded, total) {},
            onUpload: function(id) {},
            onComplete: function(id, xhr, isError) {},
            log: function(str, level) {}
        },
        endpoints = {},
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
        onComplete: function(id, xhr, isError) {
            delete endpoints[id];
            options.onComplete.apply(this, arguments);
        },
        onProgress: options.onProgress
    }));


    qq.extend(this, {
        method: method,
        upload: function(id, url, headers, file) {
            var dynamicHeaders = qq.extend({}, headers);

            options.log("Submitting Put Blob request for " + id);

            endpoints[id] = url;

            dynamicHeaders["Content-Type"] = file.type;

            return requester.initTransport(id)
                .withPayload(file)
                .withHeaders(dynamicHeaders)
                .send();
        }
    });
};
