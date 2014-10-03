/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("validate_pull_request", "", function() {
        if (process.env.TRAVIS_BRANCH === "master" && process.env.TRAVIS_PULL_REQUEST !== "false") {
            return grunt.fail.fatal(
                "Woah there, buddy! " +
                "Pull requests should be\nbranched from develop!\n\n" +
                "Details on contributing pull requests found here: \n\n" +
                "https://github.com/Widen/fine-uploader/blob/master/CONTRIBUTING.md\n"
            );
        }
    });
};
