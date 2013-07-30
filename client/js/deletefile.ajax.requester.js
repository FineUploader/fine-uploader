/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.DeleteFileAjaxRequestor = function(o) {
    "use strict";

    var requestor,
        options = {
            method: "DELETE",
            uuidParamName: "qquuid",
            endpointStore: {},
            maxConnections: 3,
            customHeaders: {},
            paramsStore: {},
            demoMode: false,
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {},
            onDelete: function(id) {},
            onDeleteComplete: function(id, xhrOrXdr, isError) {}
        };

    qq.extend(options, o);

    function getMandatedParams() {
        if (options.method.toUpperCase() === "POST") {
            return {
                "_method": "DELETE"
            };
        }

        return {};
    }

    requestor = new qq.AjaxRequestor({
        validMethods: ["POST", "DELETE"],
        method: options.method,
        endpointStore: options.endpointStore,
        paramsStore: options.paramsStore,
        mandatedParams: getMandatedParams(),
        maxConnections: options.maxConnections,
        customHeaders: options.customHeaders,
        demoMode: options.demoMode,
        log: options.log,
        onSend: options.onDelete,
        onComplete: options.onDeleteComplete,
        cors: options.cors
    });


    return {
        sendDelete: function(id, uuid, additionalMandatedParams) {
            var additionalOptions = additionalMandatedParams || {};

            options.log("Submitting delete file request for " + id);

            if (requestor.getMethod() === "DELETE") {
                requestor.send(id, uuid, additionalOptions);
            }
            else {
                additionalOptions[options.uuidParamName] = uuid;
                requestor.send(id, null, additionalOptions);
            }
        }
    };
};
