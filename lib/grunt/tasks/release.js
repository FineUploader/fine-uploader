/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("release", [
        "package",
        "s3:release"
    ]);

    grunt.registerTask("release-travis", function() {
        if (process.env.TRAVIS_BRANCH === "master" && process.env.TRAVIS_PULL_REQUEST === "false") {
            grunt.task.run("release");
        }
    });

};
