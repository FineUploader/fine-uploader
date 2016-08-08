/* globals define, module, global, qq */
(function() {
    "use strict";
    if (typeof define === "function" && define.amd) {
        define(function() {
            return qq;
        });
    }
    else if (typeof module !== "undefined" && module.exports) {
        module.exports = qq;
    }
    else {
        global.qq = qq;
    }
}());
