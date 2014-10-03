/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
    "minify",
    "Minify the source javascript and css",
    [
        "cssmin:all",
        "uglify:core",
        "uglify:jquery",
        "uglify:coreS3",
        "uglify:jqueryS3",
        "uglify:jqueryAzure",
        "uglify:coreAzure",
        "uglify:all"
    ]);
};
