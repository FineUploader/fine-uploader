/* jshint node: true */
var sharedConfig = require("./karma.conf");

module.exports = function(config, options) {
    "use strict";

    if (options == null) {
        options = {};
    }
    sharedConfig(config);
    return config.set({
        testName: "[travis] Fine Uploader tests",
        logFile: "fineuploader-travis.log",
        singleRun: true,
        autoWatch: false,
        transports: ["xhr-polling"],
        browsers: ["PhantomJS", "Firefox"]
    });
};
