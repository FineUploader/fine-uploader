/* jshint node: true */
var path = require('path'),
    fs = require("fs");

module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("release", [
        "clean",
        "package",
        "publish-npm",
        "aws_s3:release"
    ]);

    grunt.registerTask("release-develop", [
        "aws_s3:clean",
        "clean",
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

    grunt.registerTask("publish-npm", function() {
        // copy package.json into ./_dist
        // npm publish from that directory
        var paths = grunt.config.get("paths");

        var pkgJsonCopy = JSON.parse(JSON.stringify(grunt.config.get("pkg"))),
            npmIgnore = "*.zip";


        ["devDependencies", "scripts", "directories", "main"].forEach(function(k) {
            delete pkgJsonCopy[k];
        });

        fs.writeFileSync(path.join(paths.dist, "package.json"), JSON.stringify(pkgJsonCopy, null, 2));
        fs.writeFileSync(path.join(paths.dist, ".npmignore"), npmIgnore);

    });

};
