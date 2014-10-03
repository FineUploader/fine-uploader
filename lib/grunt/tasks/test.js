/* jshint node: true */
// To run this task:
//   % grunt test:<args>
//
// Where <args> is either:
//   * 'travis', 'server', 'headless', 'ie', 'ios', or 'all'
//   * a comma-delimited list of browsers.
//
// Example:
//   % grunt test:server
//   % grunt test:headless
//   % grunt test:PhantomJS --no-single-run
//   % grunt test:Firefox,Chrome,Opera,Safari
//   % grunt test:ie
//   % grunt test:Firefox,Chrome,Opera,Safari --autoWatch=true --singleRun=true
//   etc...

module.exports = function(grunt) {
    "use strict";

    grunt.registerTask("test", "Run unit tests. Allows: 'travis', 'server', 'headless', 'ie', and 'all'. Can also take browser names: 'PhantomJS', 'Firefox', 'Chrome', 'Safari', etc.. Comma-delimited.", function(testType) {
        var setDefaultOption, taskList;
        taskList = ["server"];
        setDefaultOption = function(name, def) {
            if (grunt.option(name) == null) {
                return grunt.option(name, def);
            }
        };
        switch (testType) {
            case "travis":
                (function() {
                    setDefaultOption("singleRun", true);
                    setDefaultOption("autoWatch", true);
                    return taskList.push("tests:travis");
                })();
                break;
            case "server":
                (function() {
                    setDefaultOption("singleRun", false);
                    setDefaultOption("autoWatch", false);
                    grunt.option("browsers", []);
                    return taskList.push("tests:local");
                })();
                break;
            case "headless":
                (function() {
                    setDefaultOption("singleRun", true);
                    setDefaultOption("autoWatch", true);
                    grunt.option("browsers", ["PhantomJS"]);
                    return taskList.push("tests:local");
                })();
                break;
            case "ie":
                (function() {
                    setDefaultOption("singleRun", true);
                    setDefaultOption("autoWatch", true);
                    taskList.push("tests:local");
                    return grunt.option("browsers", ["IE7 - WinXP", "IE8 - WinXP", "IE9 - Win7", "IE10 - Win7", "IE11 - Win7"]);
                })();
                break;
            case "ios":
                (function() {
                    setDefaultOption("singleRun", true);
                    setDefaultOption("autoWatch", true);
                    grunt.option("browsers", ["iOS"]);
                    return taskList.push("tests:local");
                })();
                break;
            case "all":
                (function() {
                    setDefaultOption("singleRun", true);
                    setDefaultOption("autoWatch", true);
                    grunt.option("browsers", ["PhantomJS", "Firefox", "Chrome", "Safari", "Opera", "IE7 - WinXP", "IE8 - WinXP", "IE9 - Win7", "IE10 - Win7", "IE11 - Win7"]);
                    return taskList.push("tests:local");
                })();
                break;
            default:
                (function() {
                    var tests;
                    if ((testType != null)) {
                        setDefaultOption("singleRun", true);
                        setDefaultOption("autoWatch", true);
                        if (tests.indexOf(testType, ",") >= 0) {
                            tests = testType.split(",");
                            grunt.option("browsers", tests);
                        } else {
                            grunt.option("browsers", [testType]);
                        }
                    } else {
                        grunt.option("browsers") || ["Chrome"];
                    }
                    return taskList.push("tests:local");
                })();
        }
        return grunt.task.run(taskList);
    });

};
