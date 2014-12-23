/* jshint node: true */
var sharedConfig = require("./karma.conf");

module.exports = function(config, options) {
    "use strict";
    if (options == null) {
        options = {};
    }
    sharedConfig(config);
    return config.set({
        testName: "[local] FineUploader: tests",
        logFile: "fineuploader.log",
        autoWatch: true
    });
};
