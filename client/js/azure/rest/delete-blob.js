/* globals qq */
/**
 * Implements the Delete Blob Azure REST API call.  http://msdn.microsoft.com/en-us/library/windowsazure/dd179413.aspx.
 */
qq.azure.DeleteBlob = function(o) {
    "use strict";

    var requester,
        method = "DELETE",
        options = {
            endpointStore: {},
            onDelete: function(id) {},
            onDeleteComplete: function(id, xhr, isError) {},
            log: function(str, level) {}
        };

    qq.extend(options, o);

    requester = qq.extend(this, new qq.AjaxRequester({
        validMethods: [method],
        method: method,
        successfulResponseCodes: (function() {
            var codes = {};
            codes[method] = [202];
            return codes;
        }()),
        contentType: null,
        endpointStore: options.endpointStore,
        allowXRequestedWithAndCacheControl: false,
        cors: {
            expected: true
        },
        log: options.log,
        onSend: options.onDelete,
        onComplete: options.onDeleteComplete
    }));

    qq.extend(this, {
        method: method,
        send: function(id) {
            options.log("Submitting Delete Blob request for " + id);

            return requester.initTransport(id)
                .send();
        }
    });
};
