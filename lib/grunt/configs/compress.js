/* jshint node: true */
module.exports = function(paths, customBuildDest) {
    "use strict";

    return {
        jquery: {
            options: {
                archive: "" + paths.dist + "/jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./jquery.<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        jqueryS3: {
            options: {
                archive: "" + paths.dist + "/s3.jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./s3.jquery.<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        jqueryAzure: {
            options: {
                archive: "" + paths.dist + "/azure.jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./azure.jquery.<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        core: {
            options: {
                archive: "" + paths.dist + "/<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        coreS3: {
            options: {
                archive: "" + paths.dist + "/s3.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./s3.<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        coreAzure: {
            options: {
                archive: "" + paths.dist + "/azure.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./azure.<%= pkg.name %>-<%= pkg.version %>/*"
                }
            ]
        },
        custom: {
            options: {
                archive: "" + customBuildDest + "/custom.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: customBuildDest + "/src/",
                    src: "**/*"
                }
            ]
        }
    };
};
