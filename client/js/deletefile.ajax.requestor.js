/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.DeleteFileAjaxRequestor = function(o) {
    "use strict";

    var requestor,
        options = {
            endpoint: '/server/upload',
            maxConnections: 3,
            customHeaders: {},
            paramsStore: {},
            log: function(str, level) {},
            onDelete: function(id) {},
            onDeleteComplete: function(id, xhr, isError) {}
        };

    qq.extend(options, o);

    requestor = new qq.AjaxRequestor({
        method: 'DELETE',
        maxConnections: options.maxConnections,
        customHeaders: options.customHeaders,
        log: options.log,
        onSend: options.onDelete,
        onComplete: options.onDeleteComplete
    });

    function createEndpoint(uuid) {
        return options.endpoint + "/" + uuid;
    }


    return {
        sendDelete: function(id, uuid) {
            var endpoint = createEndpoint(uuid);

            requestor.send(id, endpoint, options.paramsStore);
            options.log("Submitted delete file request for " + id);
        }
    };
};
