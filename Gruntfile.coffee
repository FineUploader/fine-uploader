###
    Fine Uploader
    -------------

    Gruntfile

###

tasks = require('./lib/grunt/tasks')

module.exports = (grunt) ->

    fs = require 'fs'
    uuid = require 'uuid'
    async = require 'async'

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

        bower: tasks.bower(paths)
        clean: tasks.clean(paths)
        compress: tasks.compress(paths, customBuildDest)
        concat: tasks.concat(paths)
        copy: tasks.copy(paths)
        cssmin: tasks.cssmin(paths, customBuildDest)
        jshint: tasks.jshint(paths)
        strip_code: tasks.stripcode(paths, customBuildDest)
        uglify: tasks.uglify(paths, customBuildDest)
        usebanner: tasks.banner(paths, customBuildDest)
        version: tasks.version(pkg)
        watch: tasks.watch(paths)

        custom:
            options:
                dest: customBuildDest

        tests:
            local: 'karma-local.conf.coffee'
            travis: 'karma-travis.conf.coffee'

        shell:
            version_custom_templates:
                command: "find #{customBuildDest}/ -type f -name '*.html' | xargs sed -i '' 's/{VERSION}/<%= pkg.version %>/'"
                options:
                    cwd: __dirname
                    stderr: true
                    stdout: true
            version_dist_templates:
                command: "find #{paths.dist}/ -type f -name '*.html' | xargs sed -i '' 's/{VERSION}/<%= pkg.version %>/'"
                options:
                    cwd: __dirname
                    stderr: true
                    stdout: true

    # Dependencies
    # ==========
    for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
        grunt.loadNpmTasks name

    grunt.loadTasks './lib/grunt'

    grunt.registerTask 'build_details', ->
        grunt.log.writeln "\n##########"
        grunt.log.writeln "Custom Build Generated: "
        grunt.log.write "### " + customBuildDest + " ###"
        grunt.log.writeln "\n##########\n"

    # Tasks
    # ==========
    grunt.registerTask 'test', "Run unit tests. Allows: 'travis', 'server', 'headless', 'ie', and 'all'. Can also take browser names: 'PhantomJS', 'Firefox', 'Chrome', 'Safari', etc.. Comma-delimited.", (test_type) ->
    # To run this task:
    #   % grunt test:<args>
    #
    # Where <args> is either:
    #   * 'travis', 'server', 'headless', 'ie', 'ios', or 'all'
    #   * a comma-delimited list of browsers.
    #
    # Example:
    #   % grunt test:server
    #   % grunt test:headless
    #   % grunt test:PhantomJS --no-single-run
    #   % grunt test:Firefox,Chrome,Opera,Safari
    #   % grunt test:ie
    #   % grunt test:Firefox,Chrome,Opera,Safari --autoWatch=true --singleRun=true
    #   etc...
        taskList = ["server"]

        setDefaultOption = (name, def) ->
            if not grunt.option(name)?
                grunt.option(name, def)

        switch test_type
            when "travis" then do ->
                setDefaultOption('singleRun', true)
                setDefaultOption('autoWatch', true)
                taskList.push('tests:travis')
            when "server" then do ->
                setDefaultOption('singleRun', false)
                setDefaultOption('autoWatch', false)
                grunt.option('browsers', [])
                taskList.push('tests:local')
            when "headless" then do ->
                setDefaultOption('singleRun', true)
                setDefaultOption('autoWatch', true)
                #grunt.option('autoWatch') || true
                #grunt.option('singleRun') || true
                grunt.option('browsers', ['PhantomJS'])
                taskList.push('tests:local')
            when "ie" then do ->
                setDefaultOption('singleRun', true)
                setDefaultOption('autoWatch', true)
                #grunt.option('autoWatch') || true
                #grunt.option('singleRun') || true
                taskList.push('tests:local')
                grunt.option('browsers', [
                    'IE7 - WinXP',
                    'IE8 - WinXP',
                    'IE9 - Win7',
                    'IE10 - Win7',
                    'IE11 - Win7'
                ])
            when "ios" then do ->
                setDefaultOption('singleRun', true)
                setDefaultOption('autoWatch', true)
                grunt.option('browsers', ['iOS'])
                taskList.push('tests:local')
            when "all" then do ->
                setDefaultOption('singleRun', true)
                setDefaultOption('autoWatch', true)
                grunt.option('browsers', [
                    'PhantomJS',
                    'Firefox',
                    'Chrome',
                    'Safari',
                    'Opera',
                    'IE7 - WinXP',
                    'IE8 - WinXP',
                    'IE9 - Win7',
                    'IE10 - Win7',
                    'IE11 - Win7'
                ])
                taskList.push('tests:local')
            else do ->
                if (test_type?)
                    setDefaultOption('singleRun', true)
                    setDefaultOption('autoWatch', true)
                    if (',' in test_type)
                        tests = test_type.split(',')
                        grunt.option('browsers', tests)
                    else
                        grunt.option('browsers', [test_type])
                else
                    grunt.option('browsers') || ['Chrome']
                taskList.push('tests:local')

        grunt.task.run(taskList)

    grunt.registerTask 'travis', 'Test with Travis CI', ['check_pull_req', 'dev', 'test:travis']

    grunt.registerTask 'dev', 'Prepare code for testing', ['clean', 'bower', 'build', 'copy:test']

    grunt.registerTask 'build', 'Build from latest source', ['jshint:source', 'jshint:tests', 'concat', 'minify', 'usebanner:allhead', 'usebanner:allfoot', 'copy:images']
    grunt.registerTask 'build_stripped', 'Build from latest source w/ test artifacts stripped out', ['concat', 'strip_code:build', 'minify', 'usebanner:allhead', 'usebanner:allfoot', 'copy:images']

    grunt.registerTask 'package', 'Build a zipped distribution-worthy version', ['build_stripped', 'copy:dist', 'shell:version_dist_templates', 'compress:jquery', 'compress:jqueryS3', 'compress:jqueryAzure', 'compress:core', 'compress:coreS3', 'compress:coreAzure' ]

    grunt.registerTask 'custom', 'Build a custom version', (modules) ->
        util = require './lib/grunt/utils'
        dest = customBuildDest
        if (modules?)
            util.build.call util, dest, modules.split(',')
        else
            util.build.call util, dest, []
        grunt.task.run(['uglify:custom', 'cssmin:custom', 'strip_code:custom', 'shell:version_custom_templates', 'usebanner:customhead', 'usebanner:customfoot', 'compress:custom', 'build_details'])

    grunt.registerTask 'default', 'Default task: clean, bower, lint, build, & test', ['package']

    grunt.registerTask "server", ["nodestatic"]
