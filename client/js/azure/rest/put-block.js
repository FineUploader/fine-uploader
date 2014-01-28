/* globals qq */
/**
 * Implements the Put Block Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd135726.aspx.
 */
qq.azure.PutBlock = function(o) {
    "use strict";

    var requester,
        method = "PUT",
        blockIds = {},
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
        endpointStore: endpointHandler,
        allowXRequestedWithAndCacheControl: false,
        cors: {
            expected: true
        },
        log: options.log,
        onSend: options.onUpload,
        onComplete: function(id, xhr, isError) {
            delete endpoints[id];

            options.onComplete.call(this, id, xhr, isError, blockIds[id]);

            delete blockIds[id];
        },
        onProgress: options.onProgress
    }));

    function createBlockId(partNum) {
        var digits = 5,
            zeros = new Array(digits + 1).join("0"),
            paddedPartNum = (zeros + partNum).slice(-digits);

        return btoa(paddedPartNum);
    }

    qq.extend(this, {
        method: method,
        upload: function(id, sasUri, partNum, blob) {
            var blockId = createBlockId(partNum);

            options.log(qq.format("Submitting Put Block request for {} = part {}", id, partNum));

            endpoints[id] = qq.format("{}&comp=block&blockid={}", sasUri, encodeURIComponent(blockId));
            blockIds[id] = blockId;

            return requester.initTransport(id)
                .withPayload(blob)
                .send();
        }
    });
};
