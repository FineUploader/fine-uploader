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
        }
    };
}());
