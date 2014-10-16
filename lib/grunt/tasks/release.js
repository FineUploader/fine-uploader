/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("release", function(branch) {
        grunt.task.run("package", "s3:" + branch);
    });

    grunt.registerTask("release-travis", function() {
        if (process.env.TRAVIS_BRANCH === "master" && process.env.TRAVIS_PULL_REQUEST === "false") {
            grunt.task.run("release:master");
        }
        else if (process.env.TRAVIS_BRANCH === "develop" && process.env.TRAVIS_PULL_REQUEST === "false") {
            grunt.task.run("release:develop");
        }
    });

};
