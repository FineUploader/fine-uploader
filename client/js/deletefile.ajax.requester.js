/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.DeleteFileAjaxRequestor = function(o) {
    "use strict";

    var requestor,
        validMethods = ["POST", "DELETE"],
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

    if (qq.indexOf(validMethods, getNormalizedMethod()) < 0) {
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for delete file requests!");
    }

    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    function getMandatedParams() {
        if (getNormalizedMethod() === "POST") {
            return {
                "_method": "DELETE"
            };
        }

        return {};
    }

    requestor = new qq.AjaxRequestor({
        method: getNormalizedMethod(),
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
        sendDelete: function(id, uuid) {
            var additionalOptions = {};

            options.log("Submitting delete file request for " + id);

            if (getNormalizedMethod() === "DELETE") {
                requestor.send(id, uuid);
            }
            else {
                additionalOptions[options.uuidParamName] = uuid;
                requestor.send(id, null, additionalOptions);
            }
        }
    };
};
