/* jshint node: true */
module.exports = function(paths) {
    "use strict";

    return {
        src: [paths.src + "/js/**/*.js",
            "./gruntfile.js",
            "./lib/**/*.js",
            "!" + paths.src + "/js/third-party/**/*.js"
        ],
        tests: [],
        options: {
            config: ".jscsrc"
        }
    };
};
