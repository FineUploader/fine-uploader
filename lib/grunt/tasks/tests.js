/* jshint node: true */
var spawn = require("child_process").spawn;

module.exports = function(grunt) {
    "use strict";

    grunt.registerMultiTask("tests", "** Use ` grunt-test` instead **", function() {
        return startKarma.call(this, this.data, this.async());
    });

    function startKarma(config, done) {
        var args, autoWatch, browsers, p, port, reporters, singleRun;
        browsers = grunt.option("browsers");
        reporters = grunt.option("reporters");
        port = grunt.option("port");
        autoWatch = grunt.option("autoWatch");
        singleRun = grunt.option("singleRun");
        args = ["node_modules/karma/bin/karma", "start", config, singleRun ? "--single-run" : "", autoWatch ? "--auto-watch" : "", reporters ? "--reporters=" + reporters : "", browsers ? "--browsers=" + browsers : "", port ? "--port=" + port : ""];
        console.log(args);
        p = spawn("node", args);
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
        return p.on("exit", function(code) {
            if (code !== 0) {
                grunt.fail.warn("Karma test(s) failed. Exit code: " + code);
            }
            return done();
        });
    }

};
