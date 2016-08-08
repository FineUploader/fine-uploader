/* jshint node:true */
/* globals module */
var path = require("path");

module.exports = function(paths) {
    "use strict";
    return {
        build: {
            files: { src: paths.build }
        },

        dist: {
            files: { src: paths.dist }
        },

        test: {
            files: { src: path.join(paths.test, "_temp*") }

        }
    };
};
