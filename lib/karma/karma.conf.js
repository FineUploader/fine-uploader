/* jshint node: true */
var modules = require("../modules"),
    allBrowsers = require("../browsers");

module.exports = function(config, options) {
    "use strict";

    if (options == null) {
        options = {};
    }
    return config.set({
        files: modules.mergeModules(true, "karmaModules", "fuSrcBuild", "fuIframeXssResponse", "testHelperModules", "fuUnit"),
        basePath: "../..",
        logLevel: config.LOG_INFO,
        logColors: true,
        frameworks: ["mocha"],
        reporters: ["spec"],
        captureTimeout: 60000,
        colors: true
    });
};
