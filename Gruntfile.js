/* jshint node: true */
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/*
        Fine Uploader
        -------------

        Gruntfile
 */
module.exports = function(grunt) {
    "use strict";

    require("time-grunt")(grunt);

    var allBrowsers, async, browsers, configs, fineUploaderModules, fs, name, path, paths, pkg, spawn, tasks, utils, uuid;

    fs = require("fs");
    uuid = require("uuid");
    async = require("async");
    path = require("path");
    spawn = require("child_process").spawn;
    utils = require("./lib/grunt/utils");
    configs = require("./lib/grunt/configs");
    tasks = "./lib/grunt/tasks";
    path = require("path");
    pkg = require("./package.json");
    paths = {
        dist: path.join("./_dist", pkg.version),
        build: "./_build",
        src: "./client",
        html: "./client/html/templates",
        docs: "./docs",
        test: "./test"
    };
    allBrowsers = require("./lib/browsers");
    browsers = allBrowsers.browsers;
    fineUploaderModules = require("./lib/modules");
    grunt.initConfig({
        pkg: pkg,
        paths: paths,
        clean: configs.clean(paths),
        compress: configs.compress(paths),
        concat: configs.concat(paths),
        copy: configs.copy(paths),
        cssmin: configs.cssmin(paths),
        jshint: configs.jshint(paths),
        jscs: configs.jscs(paths),
        nodestatic: configs["static"](paths),
        aws_s3: configs.s3(paths.dist, paths.build, pkg.version),
        shell: configs.shell(paths),
        strip_code: configs.stripcode(paths),
        uglify: configs.uglify(paths),
        usebanner: configs.banner(paths),
        version: configs.version(pkg),
        watch: configs.watch(paths),
        tests: {
            local: "./lib/karma/karma-local.conf.js",
            travis: "./lib/karma/karma-travis.conf.js"
        }
    });

    for (name in pkg.devDependencies) {
        if (name.substring(0, 6) === "grunt-") {
            grunt.loadNpmTasks(name);
        }
    }

    grunt.loadTasks(tasks);

};
