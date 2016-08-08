/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "travis",
        "Test with Travis CI",
        [
            "dev",
            "test:travis",
            "release-travis"
        ]);

};
