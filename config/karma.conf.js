/* jshint node: true */
var path = require("path");

module.exports = function(config, options) {
    "use strict";

    return config.set({
        browsers: ["Firefox"],
        captureTimeout: 60000,
        files: [
            path.resolve("_build/all.fine-uploader.js"),
            path.resolve("test/static/third-party/assert/assert.js"),
            path.resolve("test/static/third-party/jquery/jquery.js"),
            path.resolve("test/static/third-party/jquery.simulate/jquery.simulate.js"),
            path.resolve("test/static/third-party/purl/purl.js"),
            path.resolve("test/static/third-party/sinon/sinon.js"),
            path.resolve("test/static/third-party/sinon/event.js"),
            path.resolve("test/static/third-party/sinon/fake_xml_http_request.js"),
            path.resolve("test/static/local/formdata.js"),
            path.resolve("test/static/local/karma-runner.js"),
            path.resolve("test/static/local/blob-maker.js"),
            path.resolve("test/static/third-party/q/q-1.0.1.js"),
            path.resolve("node_modules/pica/dist/pica.js"),
            path.resolve("test/static/local/helpme.js"),
            path.resolve("test/unit/**/*.js")
        ],
        logLevel: config.LOG_INFO,
        logColors: true,
        frameworks: ["mocha"],
        reporters: ["spec"],
        singleRun: true
    });
};
