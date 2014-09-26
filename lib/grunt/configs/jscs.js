/* jshint node: true */
module.exports = function(paths) {
  "use strict";

  return {
    src: [paths.src + "/js/**/*.js", "!" + paths.src + "/js/third-party/**/*.js"],
    tests: [paths.test + "/unit/**/*.js", paths.test + "/static/local/*.js"],
    options: {
      config: ".jscsrc"
    }
  };
};
