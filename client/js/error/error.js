/* globals qq */
/**
 * Fine Uploader top-level Error container.  Inherits from `Error`.
 */
(function() {
    "use strict";

    qq.Error = function(message) {
        this.message = "[Fine Uploader " + qq.version + "] " + message;
    };

    qq.Error.prototype = new Error();
}());
