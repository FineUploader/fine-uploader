/**
QUnit.begin = function () {
    console.log("Starting test suite");
    console.log("================================================\n")
}

QUnit.moduleDone = function (opts) {
  if (opts.failed === 0) {
    console.log("\u2714 All tests passed in '" + opts.name + "' module")
  } else {
    console.log("\u2716 " + opts.failed + " tests failed in '" + opts.name + "' module")
  }
}

// not exactly working...
QUnit.testSkip = function( testName, callback ) {
    QUnit.test(testName + ' (SKIPPED)', function() {
        var li = document.getElementById(QUnit.config.current.id);
        QUnit.done(function() {
            li.style.background = '#FFFF99';
        });
    });
};

QUnit.done = function (opts) {
  console.log("\n================================================")
  console.log("Tests completed in " + opts.runtime + " milliseconds")
  console.log(opts.passed + " tests of " + opts.total + " passed, " + opts.failed + " failed.")
}
*/
