/* jshint node: true */
/*
        Fine Uploader
        -------------

        Gruntfile
 */
module.exports = function(grunt) {
    "use strict";

    require("time-grunt")(grunt);

    var allBrowsers, async, browsers, configs, customBuildDest, fineUploaderModules, fs, name, path, paths, pkg, spawn, tasks, utils, uuid;
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
        dist: "./_dist",
        build: "./_build",
        src: "./client",
        html: "./client/html/templates",
        docs: "./docs",
        test: "./test",
        custom: "./_custom"
    };
    customBuildDest = path.join(paths.custom, uuid.v1(1), "custom." + pkg.name + "-" + pkg.version);
    allBrowsers = require("./lib/browsers");
    browsers = allBrowsers.browsers;
    fineUploaderModules = require("./lib/modules");
    grunt.initConfig({
        pkg: pkg,
        clean: configs.clean(paths),
        compress: configs.compress(paths, customBuildDest),
        concat: configs.concat(paths),
        copy: configs.copy(paths),
        cssmin: configs.cssmin(paths, customBuildDest),
        jshint: configs.jshint(paths),
        jscs: configs.jscs(paths),
        nodestatic: configs["static"](paths),
        shell: configs.shell(paths, customBuildDest),
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        strip_code: configs.stripcode(paths, customBuildDest),
        uglify: configs.uglify(paths, customBuildDest),
        usebanner: configs.banner(paths, customBuildDest),
        version: configs.version(pkg),
        watch: configs.watch(paths),
        custom: {
            options: {
                dest: customBuildDest
            }
        },
        tests: {
            local: "karma-local.conf.js",
            travis: "karma-travis.conf.js"
        }
    });

    for (name in pkg.dependencies) {
        if (name.substring(0, 6) === "grunt-") {
            grunt.loadNpmTasks(name);
        }
    }

    grunt.loadTasks(tasks);

    grunt.registerTask("build_details", function() {
        grunt.log.writeln("\n##########");
        grunt.log.writeln("Custom Build Generated: ");
        grunt.log.write("### " + customBuildDest + " ###");
        return grunt.log.writeln("\n##########\n");
    });

    grunt.registerTask("custom", "Build a custom version", function(modules) {
        var dest;
        dest = customBuildDest;
        if ((modules != null)) {
            utils.build.call(utils, dest, modules.split(","));
        } else {
            utils.build.call(utils, dest, []);
        }
        return grunt.task.run([
            "uglify:custom",
            "cssmin:custom",
            "strip_code:custom",
            "shell:version_custom_templates",
            "usebanner:customhead",
            "usebanner:customfoot",
            "compress:custom",
            "build_details"
        ]);
    });
};
