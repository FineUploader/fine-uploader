/* jshint node: true */
var path = require("path"),
    npm = require("npm"),
    fs = require("fs");

module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("release", [
        "clean",
        "package",
        "prepare-npm",
        //"publish-npm",
        "aws_s3:release"
    ]);

    grunt.registerTask("release-develop", [
        "aws_s3:clean",
        "clean",
        "package",
        "prepare-npm",
        "aws_s3:develop"
    ]);

    grunt.registerTask("prepublish", [
        "clean",
        "package",
        "prepare-npm"
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

    grunt.registerTask("prepare-npm", function() {
        // copy package.json into ./_dist
        // npm publish from that directory
        var paths = grunt.config.get("paths"),
            pkgJsonCopy = JSON.parse(JSON.stringify(grunt.config.get("pkg"))),
            readme = fs.readFileSync("README.md"),
            license = fs.readFileSync("LICENSE"),
            npmIgnore = "*.zip";

        ["devDependencies", "scripts", "directories", "main"].forEach(function(k) {
            delete pkgJsonCopy[k];
        });

        fs.writeFileSync(path.join(paths.dist, "package.json"), JSON.stringify(pkgJsonCopy, null, 2));
        fs.writeFileSync(path.join(paths.dist, ".npmignore"), npmIgnore);
        fs.writeFileSync(path.join(paths.dist, "README.md"), readme);
        fs.writeFileSync(path.join(paths.dist, "LICENSE"), license);

    });

    grunt.registerTask("publish-npm", function() {
        var paths = grunt.config.get("paths"),
            pkg = grunt.config.get("pkg"),
            done = this.async();

        npm.load({}, function(err) {
            if (err) {
                console.log(err);
                return done(err);
            }
            npm.registry.adduser(process.env.NPM_USERNAME, process.env.NPM_PASSWORD, process.env.NPM_EMAIL, function(err) {
                if (err) {
                    console.log(err);
                    return done(err);
                }

                npm.config.set("email", process.env.NPM_EMAIL, "user");
                npm.commands.publish([paths.dist], function(err) {
                    if (err) {
                        console.log(err);
                        return done(err);
                    }
                    console.log(paths.dist + " v" + pkg.verison + " Published to registry");
                    return done();

                });

            });

        });
    });

};
