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
    grunt.registerTask 'travis', 'Test with Travis CI', ['validate_pull_request', 'dev', 'test:travis']

    grunt.registerTask 'dev', 'Prepare code for testing', ['clean', 'bower', 'build', 'copy:test']

    grunt.registerTask 'build', 'Build from latest source', ['jshint:source', 'jshint:tests', 'concat', 'minify', 'usebanner:allhead', 'usebanner:allfoot', 'copy:images']
    grunt.registerTask 'build_stripped', 'Build from latest source w/ test artifacts stripped out', ['concat', 'strip_code:build', 'minify', 'usebanner:allhead', 'usebanner:allfoot', 'copy:images']

    grunt.registerTask 'package', 'Build a zipped distribution-worthy version', ['build_stripped', 'copy:dist', 'shell:version_dist_templates', 'compress:jquery', 'compress:jqueryS3', 'compress:jqueryAzure', 'compress:core', 'compress:coreS3', 'compress:coreAzure' ]

    grunt.registerTask 'custom', 'Build a custom version', (modules) ->
        dest = customBuildDest
        if (modules?)
            utils.build.call utils, dest, modules.split(',')
        else
            utils.build.call utils, dest, []
        grunt.task.run(['uglify:custom', 'cssmin:custom', 'strip_code:custom', 'shell:version_custom_templates', 'usebanner:customhead', 'usebanner:customfoot', 'compress:custom', 'build_details'])

    grunt.registerTask 'default', 'Default task: clean, bower, lint, build, & test', ['package']

    grunt.registerTask "server", ["nodestatic"]
