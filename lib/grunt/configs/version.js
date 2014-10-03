/* jshint node: true */
var fineUploaderModules = require("../../modules");

module.exports = function(pkg) {
    "use strict";
    return {
        options: {
            pkg: pkg,
            // jscs:disable validateQuoteMarks
            // jshint quotmark:false
            prefix: '[^\\-][Vv]ersion[\'"]?\\s*[:=]\\s*[\'"]?'
        },
        major: {
            options: {
                release: "major"
            },
            src: fineUploaderModules.modules.versioned
        },
        minor: {
            options: {
                release: "minor"
            },
            src: fineUploaderModules.modules.versioned
        },
        hotfix: {
            options: {
                release: "patch"
            },
            src: fineUploaderModules.modules.versioned
        },
        build: {
            options: {
                release: "build"
            },
            src: fineUploaderModules.modules.versioned
        },
        release: {
            options: {
                release: pkg.version.replace(/-\d+$/, "")
            },
            src: fineUploaderModules.modules.versioned
        }
    };
};
