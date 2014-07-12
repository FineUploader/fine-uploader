/* jshint node: true */
var utils = require('../utils');


module.exports = function(grunt){
    "use strict";

    grunt.registerMultiTask("tests", "** Use ` grunt-test` instead **", function() {
      return utils.startKarma.call(utils, this.data, this.async());
    });

};
