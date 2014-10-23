/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "travis",
        "Test with Travis CI",
        [
            "validate_pull_request",
            "dev",
            "test:travis",
            "release-travis"
        ]);

};
