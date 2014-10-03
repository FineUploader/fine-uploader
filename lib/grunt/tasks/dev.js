/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("dev", "Prepare code for testing", ["clean", "build", "copy:test"]);

};
