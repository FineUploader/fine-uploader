/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "build",
        "Build from latest source",
        [
            "jshint:source",
            "jshint:tests",
            "jscs:src",
            "jscs:tests",
            "concat",
            "minify",
            "usebanner:allhead",
            "usebanner:allfoot",
            "copy:images"
        ]);

};
