/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "build_stripped",
        "Build from latest source w/ test artifacts stripped out",
        [
            "concat",
            "strip_code:build",
            "minify",
            "usebanner:allhead",
            "usebanner:allfoot",
            "copy:images"
        ]);

};
