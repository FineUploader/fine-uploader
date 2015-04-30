/*globals qq */
qq.azure = qq.azure || {};
qq.azure.util = qq.azure.util || (function() {
    "use strict";

    return {
        AZURE_PARAM_PREFIX: "x-ms-meta-",

        /** Create Prefixed request headers which are appropriate for Azure.
         *
         * If the request header is appropriate for Azure (e.g. Cache-Control) then pass
         * it along without a metadata prefix. For all other request header parameter names,
         * apply qq.azure.util.AZURE_PARAM_PREFIX before the name.
         *
         * @param name Name of the Request Header parameter to construct a (possibly) prefixed name.
         * @returns {String} A valid Request Header parameter name.
         */
        _getPrefixedParamName: function(name) {
            switch (name)
            {
                //
                // Valid request headers (not sent by fine-uploader) which should be returned as-is (case-sensitive)
                // see: https://msdn.microsoft.com/en-us/library/azure/dd179451.aspx
                //
                case "Cache-Control":
                case "Content-Disposition":
                case "Content-Encoding":
                case "Content-MD5":
                case "x-ms-blob-content-encoding":
                case "x-ms-blob-content-disposition":
                case "x-ms-blob-content-md5":
                case "x-ms-blob-cache-control":
                    return name;
                default:
                    return qq.azure.util.AZURE_PARAM_PREFIX + name;
            }
        },

        getParamsAsHeaders: function(params) {
            var headers = {};

            qq.each(params, function(name, val) {
                var headerName = qq.azure.util._getPrefixedParamName(name);

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
