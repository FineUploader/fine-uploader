/*globals qq */
qq.azure = qq.azure || {};
qq.azure.util = qq.azure.util || (function() {
    "use strict";

    return {
        AZURE_PARAM_PREFIX: "x-ms-meta-",

        getParamsAsHeaders: function(params) {
            var headers = {};

            qq.each(params, function(name, val) {
                var headerName = qq.azure.util.AZURE_PARAM_PREFIX + name;

                if (qq.isFunction(val)) {
                    headers[headerName] = encodeURIComponent(String(val()));
                }
                else if (qq.isObject(val)) {
                    qq.extend(headers, qq.azure.util.getParamsAsHeaders(val));
                }
                else {
                    headers[headerName] = encodeURIComponent(String(val));
                }
            });

            return headers;
        },

        parseAzureError: function(responseText, log) {
            var domParser = new DOMParser(),
                responseDoc = domParser.parseFromString(responseText, "application/xml"),
                errorTag = responseDoc.getElementsByTagName("Error")[0],
                errorDetails = {},
                codeTag, messageTag;

            log("Received error response: " + responseText, "error");

            if (errorTag) {
                messageTag = errorTag.getElementsByTagName("Message")[0];
                if (messageTag) {
                    errorDetails.message = messageTag.textContent;
                }

                codeTag = errorTag.getElementsByTagName("Code")[0];
                if (codeTag) {
                    errorDetails.code = codeTag.textContent;
                }

                log("Parsed Azure error: " + JSON.stringify(errorDetails), "error");

                return errorDetails;
            }
        }
    };
}());
