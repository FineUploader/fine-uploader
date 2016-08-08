/*globals qq */
qq.azure = qq.azure || {};
qq.azure.util = qq.azure.util || (function() {
    "use strict";

    return {
        AZURE_PARAM_PREFIX: "x-ms-meta-",

        /** Test if a request header is actually a known Azure parameter. See: https://msdn.microsoft.com/en-us/library/azure/dd179451.aspx
         *
         * @param name Name of the Request Header parameter.
         * @returns {Boolean} Test result.
         */
        _paramNameMatchesAzureParameter: function(name) {
            switch (name) {
                case "Cache-Control":
                case "Content-Disposition":
                case "Content-Encoding":
                case "Content-MD5":
                case "x-ms-blob-content-encoding":
                case "x-ms-blob-content-disposition":
                case "x-ms-blob-content-md5":
                case "x-ms-blob-cache-control":
                    return true;
                default:
                    return false;
            }
        },

        /** Create Prefixed request headers which are appropriate for Azure.
         *
         * If the request header is appropriate for Azure (e.g. Cache-Control) then it should be
         * passed along without a metadata prefix. For all other request header parameter names,
         * qq.azure.util.AZURE_PARAM_PREFIX should be prepended.
         *
         * @param name Name of the Request Header parameter to construct a (possibly) prefixed name.
         * @returns {String} A valid Request Header parameter name.
         */
        _getPrefixedParamName: function(name) {
            if (qq.azure.util._paramNameMatchesAzureParameter(name)) {
                return name;
            }
            else {
                return qq.azure.util.AZURE_PARAM_PREFIX + name;
            }
        },

        getParamsAsHeaders: function(params) {
            var headers = {};

            qq.each(params, function(name, val) {
                var headerName = qq.azure.util._getPrefixedParamName(name),
                    value = null;

                if (qq.isFunction(val)) {
                    value = String(val());
                }
                else if (qq.isObject(val)) {
                    qq.extend(headers, qq.azure.util.getParamsAsHeaders(val));
                }
                else {
                    value = String(val);
                }

                if (value !== null) {
                    if (qq.azure.util._paramNameMatchesAzureParameter(name)) {
                        headers[headerName] = value;
                    } else {
                        headers[headerName] = encodeURIComponent(value);
                    }
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
