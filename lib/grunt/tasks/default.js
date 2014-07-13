/* jshint node: true */
var utils = require("../utils");

module.exports = function(grunt){
    "use strict";

    grunt.registerTask(
        "default",
        "Default task: clean, bower, lint, build, & test",
        ["package"]
    );

};
