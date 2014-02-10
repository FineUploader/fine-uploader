###
    Fine Uploader
    -------------

    Gruntfile

###

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

        bower:
            install:
                options:
                    targetDir: "#{paths.test}/_vendor"
                    install: true
                    cleanTargetDir: true
                    cleanBowerDir: true
                    layout: 'byComponent'

        clean:
            build:
                files:
                    src: paths.build
            dist:
                files:
                    src: paths.dist
            test:
                files:
                    src: ["#{paths.test}/_temp*"]
            vendor:
                files:
                    src: "#{paths.test}/_vendor"
            custom:
                files:
                    src: "#{paths.custom}/*"

        coffeelint:
            options:
                indentation:
                    level: 'warn'
                no_trailing_whitespace:
                    level: 'warn'
                no_backticks:
                    level: 'ignore'
                max_line_length:
                    level: 'ignore'
            grunt: ['./Gruntfile.coffee', 'lib/grunt/**/*.coffee']

        compress:
            jquery:
                options:
                    archive: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './jquery.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            jqueryS3:
                options:
                    archive: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './s3.jquery.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            jqueryAzure:
                options:
                    archive: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './azure.jquery.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            core:
                options:
                    archive: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            coreS3:
                options:
                    archive: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './s3.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            coreAzure:
                options:
                    archive: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: paths.dist
                        src: './azure.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            custom:
                options:
                    archive: "#{customBuildDest}/custom.<%= pkg.name %>-<%= pkg.version %>.zip"
                files: [
                    {
                        expand: true
                        cwd: customBuildDest + '/src/'
                        src: "**/*"
                    }
                ]

        concat:
            core:
                src: fineUploaderModules.mergeModules true, 'fuTraditional'
                dest: "#{paths.build}/<%= pkg.name %>.js"
            coreS3:
                src: fineUploaderModules.mergeModules true, 'fuS3'
                dest: "#{paths.build}/s3.<%= pkg.name %>.js"
            coreAzure:
                src: fineUploaderModules.mergeModules true, 'fuAzure'
                dest: "#{paths.build}/azure.<%= pkg.name %>.js"
            jquery:
                src: fineUploaderModules.mergeModules true, 'fuTraditionalJquery'
                dest: "#{paths.build}/jquery.<%= pkg.name %>.js"
            jqueryS3:
                src: fineUploaderModules.mergeModules true, 'fuS3Jquery'
                dest: "#{paths.build}/s3.jquery.<%= pkg.name %>.js"
            jqueryAzure:
                src: fineUploaderModules.mergeModules true, 'fuAzureJquery'
                dest: "#{paths.build}/azure.jquery.<%= pkg.name %>.js"
            all:
                src: fineUploaderModules.mergeModules true, 'fuAll'
                dest: paths.build + "/all.<%= pkg.name %>.js"
            css:
                src: ["#{paths.src}/*.css"]
                dest: "#{paths.build}/<%= pkg.name %>.css"

        concurrent:
            minify: ['cssmin', 'uglify']
            lint: ['jshint', 'coffeelint']
            concat: ['concat']
            clean: ['clean']
            compress: ['compress']

        connect:
            root_server:
                options:
                    base: "."
                    hostname: "0.0.0.0"
                    port: 9000
                    keepalive: true
            test_server:
                options:
                    base: "test"
                    hostname: "0.0.0.0"
                    port: 9000

        copy:
            dist:
                files: [
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.js', '!all.*', '!s3.*', '!azure.*', '!*.min.js', '!jquery*', '!*iframe*']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: [ '!all.*', 's3.*.js', '!*.min.js', '!s3.jquery*', '!azure.jquery*', '!*iframe*']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: [ '!all.*', 'azure.*.js', '!*.min.js', '!azure.jquery*', '!s3.jquery*', '!*iframe*']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.js',  '!all.*', '!s3.*', '!azure.*', '!jquery*']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['s3.*.min.js', '!s3.jquery*']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['azure.*.min.js', '!azure.jquery*']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['jquery*js', '!s3.*', '!azure.*', '!*.min.js']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['s3.jquery*js', '!*.min.js']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['azure.jquery*js', '!*.min.js']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['jquery*min.js']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['s3.jquery*min.js']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['azure.jquery*min.js']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    },
                    {
                        expand: true
                        cwd: "./#{paths.src}/js/"
                        src: ['iframe.xss.response.js']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.xss.response-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: "./#{paths.src}/js/"
                        src: ['iframe.xss.response.js']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.xss.response-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: "./#{paths.src}/js/"
                        src: ['iframe.xss.response.js']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.xss.response-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: "./#{paths.src}/js/"
                        src: ['iframe.xss.response.js']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                        ext: '.xss.response-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>/"
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.min.css']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.min.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.build
                        src: ['*.css', '!*.min.css']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>"
                        ext: '-<%= pkg.version %>.css'
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/templates/"
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/templates/"
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/azure.<%= pkg.name %>-<%= pkg.version %>/templates/"
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/templates/"
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/templates/"
                    },
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: "#{paths.dist}/azure.jquery.<%= pkg.name %>-<%= pkg.version %>/templates/"
                    }
                ]
            build:
                files: [
                    {
                        expand: true
                        cwd: "#{paths.src}/js/"
                        src: ['iframe.xss.response.js']
                        dest: paths.build
                    },
                    {
                        expand: true
                        cwd: paths.src
                        src: ['*.gif', 'placeholders/*.png']
                        dest: paths.build
                    }
                    {
                        expand: true
                        cwd: paths.html
                        src: ['*.html']
                        dest: paths.build
                    }
                ]
            test:
                expand: true
                flatten: true
                src: ["#{paths.build}/*"]
                dest: "#{paths.test}/_temp"
            images:
                files: [
                    expand: true
                    cwd: paths.src
                    src: ['*.gif', 'placeholders/*.png']
                    dest: paths.build
                ]
            templates:
                files: [
                    expand: true
                    cwd: paths.src + '/html'
                    src: ['*.html']
                    dest: paths.build
                ]

        cssmin:
            options:
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                report: 'min'
            all:
                expand: true
                cwd: paths.build
                src: ['*.css', '!*.min.css']
                dest: paths.build
                ext: ".min.css"
            custom:
                expand: true
                cwd: customBuildDest + '/src/'
                src: ['*.css', '!*.min.css']
                dest: customBuildDest + '/src/'
                ext: '.<%= pkg.name %>-<%= pkg.version %>.min.css'
    #src: ["#{customBuildDest}/src/<%= pkg.name %>-<%= pkg.version %>.css"]
    #dest: "#{customBuildDest}/src/<%= pkg.name %>-<%= pkg.version %>.min.css"

        jshint:
            source: ["#{paths.src}/js/**/*.js"]
            tests: ["#{paths.test}/unit/**/*.js","#{paths.test}/static/local/*.js"]
            options:
                jshintrc: true
                ignores: ["#{paths.src}/js/third-party/**/*.js"]

        custom:
            options:
                dest: customBuildDest

        uglify:
            options:
                mangle: true
                compress:
                    warnings: false
                report: 'min'
                preserveComments: 'some'
            core:
                src: ['<%= concat.core.dest %>']
                dest: "#{paths.build}/<%= pkg.name %>.min.js"
            jquery:
                src: ['<%= concat.jquery.dest %>']
                dest: "#{paths.build}/jquery.<%= pkg.name %>.min.js"
            coreAzure:
                src: ['<%= concat.coreAzure.dest %>']
                dest: "#{paths.build}/azure.<%= pkg.name %>.min.js"
            jqueryAzure:
                src: ['<%= concat.jqueryAzure.dest %>']
                dest: "#{paths.build}/azure.jquery.<%= pkg.name %>.min.js"
            coreS3:
                src: ['<%= concat.coreS3.dest %>']
                dest: "#{paths.build}/s3.<%= pkg.name %>.min.js"
            jqueryS3:
                src: ['<%= concat.jqueryS3.dest %>']
                dest: "#{paths.build}/s3.jquery.<%= pkg.name %>.min.js"
            all:
                src: ['<%= concat.all.dest %>']
                dest: "#{paths.build}/all.<%= pkg.name %>.min.js"
            custom:
                src: ["#{customBuildDest}/src/custom.<%= pkg.name %>-<%= pkg.version %>.js"]
                dest: "#{customBuildDest}/src/custom.<%= pkg.name %>-<%= pkg.version %>.min.js"

        usebanner:
            allhead:
                src: ["#{paths.build}/*.{js,css}"]
                options:
                    position: 'top'
                    banner: '''
                            /*!
                            * <%= pkg.title %>
                            *
                            * Copyright 2013, <%= pkg.author %> info@fineuploader.com
                            *
                            * Version: <%= pkg.version %>
                            *
                            * Homepage: http://fineuploader.com
                            *
                            * Repository: <%= pkg.repository.url %>
                            *
                            * Licensed under GNU GPL v3, see LICENSE
                            */ \n\n'''
            allfoot:
                src: ["#{paths.build}/*.{js,css}"]
                options:
                    position: 'bottom'
                    banner: '/*! <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            customhead:
                files:
                    src: ["#{customBuildDest}/src/*.{js,css}"]
                options:
                    position: 'top'
                    banner: '''
                            /*!
                            * <%= pkg.title %>
                            *
                            * Copyright 2013-2014, <%= pkg.author %> info@fineuploader.com
                            *
                            * Version: <%= pkg.version %>
                            *
                            * Homepage: http://fineuploader.com
                            *
                            * Repository: <%= pkg.repository.url %>
                            *
                            * Licensed under GNU GPL v3, see LICENSE
                            *
                            * Third-party credits:
                            *   MegaPixImageModule (MIT)
                            *       https://github.com/stomita/ios-imagefile-megapixel
                            *       Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>
                            *
                            *   CryptoJS
                            *       code.google.com/p/crypto-js/wiki/License
                            *       (c) 2009-2013 by Jeff Mott. All rights reserved.
                            */ \n\n'''
            customfoot:
                files:
                    src: ["#{customBuildDest}/*.{js,css}"]
                options:
                    position: 'bottom'
                    banner: '/*! <%= grunt.template.today("yyyy-mm-dd") %> */\n'

        version:
            options:
                pkg: pkg,
                prefix: '[^\\-][Vv]ersion[\'"]?\\s*[:=]\\s*[\'"]?'
            major:
                options:
                    release: 'major'
                src: fineUploaderModules.modules.versioned
            minor:
                options:
                    release: 'minor'
                src: fineUploaderModules.modules.versioned
            hotfix:
                options:
                    release: 'patch'
                src: fineUploaderModules.modules.versioned
            build:
                options:
                    release: 'build'
                src: fineUploaderModules.modules.versioned
            release:
                options:
                    release: pkg.version.replace /-\d+$/, ""
                src: fineUploaderModules.modules.versioned

        watch:
            options:
                interrupt: true
                debounceDelay: 250
            js:
                files: ["#{paths.src}/js/*.js", "#{paths.src}/js/s3/*.js"]
                tasks: [
                    'dev'
                    'tests:local'
                ]
            test:
                files: ["#{paths.test}/unit/*.js", "#{paths.test}/unit/s3/*.js"]
                tasks: [
                    'jshint:tests'
                    'tests:local'
                ]
            grunt:
                files: ['./Gruntfile.coffee']
                tasks: [
                    'coffeelint:grunt'
                    'build'
                ]
            images:
                files: ["#{paths.src}/*.gif", "#{paths.src}/placeholders/*.png"]
                tasks: [
                    'copy:images'
                ]

        tests:
            local: 'karma-local.conf.coffee'
            travis: 'karma-travis.conf.coffee'

        shell:
            start_saucecon:
                command: './lib/sauce/sauce_connect_setup.sh'
            kill_saucecon:
                command: 'cat /tmp/sauce-connect.pid | xargs kill'
            npm_install:
                command: 'npm install'
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


        strip_code:
            options:
                start_comment: "<testing>"
                end_comment: "</testing>"
            build:
                files:
                    src: "#{paths.build}/**/*.js"
            custom:
                files:
                    src: "#{customBuildDest}/**/*.js"

        nodestatic:
            server:
                options:
                    port: 3000
                    base: "test/unit/resources"
                    headers:
                        "Access-Control-Allow-Origin": "*"

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
