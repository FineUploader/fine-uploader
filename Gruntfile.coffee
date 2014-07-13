###
    Fine Uploader
    -------------

    Gruntfile

###


module.exports = (grunt) ->

    fs = require 'fs'
    uuid = require 'uuid'
    async = require 'async'
    path = require 'path'
    spawn = require('child_process').spawn
    utils = require './lib/grunt/utils'

    configs = require('./lib/grunt/configs')
    tasks = './lib/grunt/tasks'

    # Utilities
    # ==========
    path = require 'path'

    # Package
    # ==========
    pkg = require './package.json'

    # Paths
    # ==========
    paths =
        'dist': './_dist'
        'build': './_build'
        'src': './client'
        'html': './client/html/templates'
        'docs': './docs'
        'test': './test'
        'custom': './_custom'

    # Desitnation for custom builds. Appended with a uuid to make builds unique
    # and not overwrite each other (if, say, two builds were being generated in parallel

    customBuildDest = path.join paths.custom, uuid.v1(1), "custom.#{pkg.name}-#{pkg.version}"
    #customBuildDest = path.join paths.custom, "custom.#{pkg.name}-#{pkg.version}"

    # Browsers
    # ==========
    allBrowsers = require("./lib/browsers")
    browsers = allBrowsers.browsers

    # Modules
    # ==========
    fineUploaderModules = require './lib/modules'

    # Configuration
    # ==========
    grunt.initConfig


        pkg: pkg

        bower: configs.bower(paths)
        clean: configs.clean(paths)
        compress: configs.compress(paths, customBuildDest)
        concat: configs.concat(paths)
        copy: configs.copy(paths)
        cssmin: configs.cssmin(paths, customBuildDest)
        jshint: configs.jshint(paths)
        nodestatic: configs.static(paths)
        shell: configs.shell(paths, customBuildDest)
        strip_code: configs.stripcode(paths, customBuildDest)
        uglify: configs.uglify(paths, customBuildDest)
        usebanner: configs.banner(paths, customBuildDest)
        version: configs.version(pkg)
        watch: configs.watch(paths)

        custom:
            options:
                dest: customBuildDest

        tests:
            local: 'karma-local.conf.coffee'
            travis: 'karma-travis.conf.coffee'


    # Dependencies
    # ==========
    for name of pkg.dependencies when name.substring(0, 6) is 'grunt-'
        grunt.loadNpmTasks name

    grunt.registerTask 'build_details', ->
        grunt.log.writeln "\n##########"
        grunt.log.writeln "Custom Build Generated: "
        grunt.log.write "### " + customBuildDest + " ###"
        grunt.log.writeln "\n##########\n"

    grunt.loadTasks(tasks)

    # Tasks
    # ==========
    grunt.registerTask 'custom', 'Build a custom version', (modules) ->
        dest = customBuildDest
        if (modules?)
            utils.build.call utils, dest, modules.split(',')
        else
            utils.build.call utils, dest, []
        grunt.task.run(['uglify:custom', 'cssmin:custom', 'strip_code:custom', 'shell:version_custom_templates', 'usebanner:customhead', 'usebanner:customfoot', 'compress:custom', 'build_details'])
