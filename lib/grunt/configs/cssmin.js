/* jshint node: true */
module.exports = function(paths, customBuildDest) {
    "use strict";
    return {
        options: {
            banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n",
            report: "min"
        },
        all: {
            expand: true,
            cwd: paths.build,
            src: ["*.css", "!*.min.css"],
            dest: paths.build,
            ext: ".min.css"
        },
        custom: {
            expand: true,
            cwd: customBuildDest + "/src/",
            src: ["*.css", "!*.min.css"],
            dest: customBuildDest + "/src/",
            ext: ".<%= pkg.name %>-<%= pkg.version %>.min.css"
        }
    };
};
