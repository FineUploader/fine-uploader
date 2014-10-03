/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        source: ["" + paths.src + "/js/**/*.js"],
        tests: ["" + paths.test + "/unit/**/*.js", "" + paths.test + "/static/local/*.js"],
        options: {
            jshintrc: true,
            ignores: ["" + paths.src + "/js/third-party/**/*.js"]
        }
    };
};
