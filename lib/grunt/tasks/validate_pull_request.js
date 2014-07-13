/* jshint node: true */
var utils = require("../utils");

module.exports = function(grunt){
    "use strict";

    grunt.registerTask("validate_pull_request", "", function() {
      return utils.checkPullRequest();
    });

};
