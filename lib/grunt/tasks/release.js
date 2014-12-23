/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("release", [
        "package",
        "aws_s3:release"
    ]);

    grunt.registerTask("release-develop", [
        "aws_s3:clean",
        "package",
        "aws_s3:develop"
    ]);

    grunt.registerTask("release-travis", function() {
        if (process.env.TRAVIS_PULL_REQUEST === "false") {
            if (process.env.TRAVIS_BRANCH === "master") {
                grunt.task.run("release");
            }
            else if (process.env.TRAVIS_BRANCH === "develop") {
                grunt.task.run("release-develop");
            }
        }
    });

};
