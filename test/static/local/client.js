/* globals mocha */
function FancyJSON(runner) {
    "use strict";

    var root = null;
    var result = {};

    function recurse(suite, result) {

        result.durationSec = 0;
        result.passed = true;

        if(suite.title) {
            result.description = suite.title;
        }

        if(suite.tests.length) {
            result.specs = [];
            var i = 0;
            for (i; i < suite.tests.length; i++) {

                if (!suite.tests[i].pending) {
                    result.specs.push({
                        "description": suite.tests[i].title,
                        "durationSec": (suite.tests[i].duration / 1000) || 0, // duration of spec run in seconds
                        "passed": suite.tests[i].state === "passed" // did the spec pass?
                        //"passedCount": 1, // passed assertions in spec
                        //"failedCount": 0, // failed assertions in spec
                        //"totalCount": 1 // total assertions in spec
                    });

                    result.durationSec += (suite.tests[i].duration / 1000) || 0;

                    if(suite.tests[i].state !== "passed") {
                        result.passed = false;
                    }
                }

            }
        }

        if(suite.suites.length) {

            result.suites = [];

            var sub = null;
            var j = 0;
            for (j; j < suite.suites.length; j++) {

                sub = {};
                recurse(suite.suites[j], sub);
                result.suites.push(sub);

                result.durationSec += sub.durationSec || 0;

                if(!sub.passed) {
                    result.passed = false;
                }

            }

        }

    }

    runner.on("suite", function(suite) {
        if(suite.parent.root) { root = suite.parent; }
    });

    runner.on("end", function() {
        recurse(root, result);
        window.jsonReport = result;
    });

}


function mochaSaucePlease(fn) {
    "use strict";

    (function(runner) {

        // execute optional callback to give user access to the runner
        if(fn) {
            fn(runner);
        }

        // in a PhantomJS environment, things are different
        if(!runner.on) {
            return;
        }

        // Generate JSON coverage
        mocha.reporter(FancyJSON);
        var m = new mocha._reporter(runner);

        // Generate XUnit coverage
        //window.xUnitReport = '';
        //(function() {
        //    var log = console && console.log;
        //    console.log = function() {
        //        window.xUnitReport += arguments[0] + "\n"; // TODO: handle complex console.log
        //        if(log) log.apply(console, arguments);
        //    };
        //})();
        //mocha.reporter("xunit");
        //new mocha._reporter(runner);

        // The Grid view needs more info about failures
        var failed = [];
        runner.on("fail", function(test, err) {
            failed.push({
                title: test.title,
                fullTitle: test.fullTitle(),
                error: {
                    message: err.message,
                    stack: err.stack
                }
            });
        });

        // implement custom reporter for console to read back from Sauce
        runner.on("end", function() {
            runner.stats.failed = failed;
            //runner.stats.xUnitReport = xUnitReport;
            runner.stats.jsonReport = window.jsonReport;
            window.mochaResults = runner.stats;
            window.chocoReady = true;
        });

    }(mocha.run()));
    //})(window.mochaPhantomJS ? mochaPhantomJS.run() : mocha.run());

}
