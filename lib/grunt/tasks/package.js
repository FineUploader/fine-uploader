/* jshint node: true */
module.exports = function(grunt) {
    "use strict";

    grunt.registerTask(
        "package",
        "Build a zipped distribution-worthy version",
        [
            "build_stripped",
            "copy:dist",
            "shell:version_dist_templates",
            "compress:all",
            "compress:jquery",
            "compress:jqueryS3",
            "compress:jqueryAzure",
            "compress:core",
            "compress:coreS3",
            "compress:coreAzure"
        ]);
};
