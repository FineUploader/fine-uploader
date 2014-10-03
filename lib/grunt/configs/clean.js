/* jshint node:true */
/* globals module */
var path = require("path");

module.exports = function(paths) {
    "use strict";
    return {
        build: {
            // ./{build}
            files: { src: paths.build }
        },

        dist: {
            // ./{dist}
            files: { src: paths.dist }
        },

        test: {
            // ./{test}/{vendor}
            files: { src: path.join(paths.test, "_temp*") }

        },

        custom: {
            // ./{custom}
            files: { src: paths.custom }

        }
    };
};
