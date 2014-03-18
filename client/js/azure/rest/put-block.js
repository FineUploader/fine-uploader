/* globals qq */
/**
 * Implements the Put Block Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd135726.aspx.
 */
qq.azure.PutBlock = function(o) {
    "use strict";

    var requester,
        method = "PUT",
        blockIdEntries = {},
        promises = {},
        options = {
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
        onComplete: function(id, xhr, isError) {
            var promise = promises[id],
                blockIdEntry = blockIdEntries[id];

            delete endpoints[id];
            delete promises[id];
            delete blockIdEntries[id];

            if (isError) {
                promise.failure();
            }
            else {
                promise.success(blockIdEntry);
            }
        }
    }));

    function createBlockId(partNum) {
        var digits = 5,
            zeros = new Array(digits + 1).join("0"),
            paddedPartNum = (zeros + partNum).slice(-digits);

        return btoa(paddedPartNum);
    }

    qq.extend(this, {
        method: method,
        upload: function(id, xhr, sasUri, partNum, blob) {
            var promise = new qq.Promise(),
                blockId = createBlockId(partNum);

            promises[id] = promise;

            options.log(qq.format("Submitting Put Block request for {} = part {}", id, partNum));

            endpoints[id] = qq.format("{}&comp=block&blockid={}", sasUri, encodeURIComponent(blockId));
            blockIdEntries[id] = {part: partNum, id: blockId};

            requester.initTransport(id)
                .withPayload(blob)
                .send(xhr);

            return promise;
        }
    });
};
