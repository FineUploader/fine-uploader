/* jshint node: true */
module.exports = function(paths, customBuildDest) {
    "use strict";
    return {
        options: {
            // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
            start_comment: "<testing>",
            end_comment: "</testing>"
        },
        build: {
            src: "" + paths.build + "/**/*.js"
        },
        custom: {
            src: "" + customBuildDest + "/**/*.js"
        }
    };
};
