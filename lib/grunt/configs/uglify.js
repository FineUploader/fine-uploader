/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        options: {
            mangle: true,
            compress: {
                warnings: false
            },
            report: "min",
            preserveComments: "some"
        },
        core: {
            src: ["<%= concat.core.dest %>"],
            dest: "" + paths.build + "/<%= pkg.name %>.min.js"
        },
        jquery: {
            src: ["<%= concat.jquery.dest %>"],
            dest: "" + paths.build + "/jquery.<%= pkg.name %>.min.js"
        },
        coreAzure: {
            src: ["<%= concat.coreAzure.dest %>"],
            dest: "" + paths.build + "/azure.<%= pkg.name %>.min.js"
        },
        jqueryAzure: {
            src: ["<%= concat.jqueryAzure.dest %>"],
            dest: "" + paths.build + "/azure.jquery.<%= pkg.name %>.min.js"
        },
        coreS3: {
            src: ["<%= concat.coreS3.dest %>"],
            dest: "" + paths.build + "/s3.<%= pkg.name %>.min.js"
        },
        jqueryS3: {
            src: ["<%= concat.jqueryS3.dest %>"],
            dest: "" + paths.build + "/s3.jquery.<%= pkg.name %>.min.js"
        },
        all: {
            src: ["<%= concat.all.dest %>"],
            dest: "" + paths.build + "/all.<%= pkg.name %>.min.js"
        }
    };
};
