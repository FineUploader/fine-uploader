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
            files: {
                src: "" + paths.build + "/**/*.js"
            }
        },
        custom: {
            files: {
                src: "" + customBuildDest + "/**/*.js"
            }
        }
    };
};
