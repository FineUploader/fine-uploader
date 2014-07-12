/* jshint node:true */
/* globals module */
var path = require("path");

module.exports = function(paths) {
    "use strict";
    return {
        "test": {
            options: {
                targetDir: paths.test+"/_vendor",
                install: true,
                cleanTargetDir: true,
                cleanBowerDir: true,
                layout: "byComponent",
            }
        }
    };
};

