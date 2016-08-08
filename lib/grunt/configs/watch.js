/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        options: {
            interrupt: true,
            debounceDelay: 250
        },
        js: {
            files: ["" + paths.src + "/js/*.js", "" + paths.src + "/js/s3/*.js"],
            tasks: ["dev", "tests:local"]
        },
        test: {
            files: ["" + paths.test + "/unit/*.js", "" + paths.test + "/unit/s3/*.js"],
            tasks: ["jshint:tests", "tests:local"]
        },
        images: {
            files: ["" + paths.src + "/*.gif", "" + paths.src + "/placeholders/*.png"],
            tasks: ["copy:images"]
        }
    };
};
