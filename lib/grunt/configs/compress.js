/* jshint node: true */
module.exports = function(paths) {
    "use strict";

    return {
        all: {
            options: {
                archive: "" + paths.dist + "/all.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./all.<%= pkg.name %>/**/*"
                }
            ]
        },
        jquery: {
            options: {
                archive: "" + paths.dist + "/jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
            },
            files: [
                {
                    expand: true,
                    cwd: paths.dist,
                    src: "./jquery.<%= pkg.name %>/**/*"
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
                    src: "./s3.jquery.<%= pkg.name %>/**/*"
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
                    src: "./azure.jquery.<%= pkg.name %>/**/*"
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
                    src: "./<%= pkg.name %>/**/*"
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
                    src: "./s3.<%= pkg.name %>/**/*"
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
                    src: "./azure.<%= pkg.name %>/**/*"
                }
            ]
        }
    };
};
