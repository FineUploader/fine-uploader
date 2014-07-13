/* jshint node: true */
var utils = require("../utils");

module.exports = function(grunt){
    "use strict";

    grunt.registerTask("dev", "Prepare code for testing", ["clean", "bower", "build", "copy:test"]);

};
