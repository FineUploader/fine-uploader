/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "default",
        "Default task: clean, lint, build, & test",
        ["package"]
    );

};
