/* jshint node: true */
module.exports = function(paths) {
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
        }
    };
};
