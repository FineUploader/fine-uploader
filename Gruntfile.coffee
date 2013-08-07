# Gruntfile
#   for
# fineuploader

# the 'wrapper' function
module.exports = (grunt) ->

    # Utilities
    # ==========
    path = require 'path'
    request = require 'request'

    # Package
    # ==========
    pkg = require './package.json'

    # Modules
    # ==========
    # Core modules
    core = [
        './client/js/util.js',
        './client/js/version.js',
        './client/js/features.js',
        './client/js/promise.js',
        './client/js/button.js',

        # TODO tied to the upload via paste feature and can be omitted or included in the combined file based on integrator prefs (#846)
        './client/js/paste.js',

        './client/js/upload-data.js',
        './client/js/uploader.basic.api.js',
        './client/js/uploader.basic.js',

        # TODO tied to the DnD feature and can be omitted or included in the combined file based on integrator prefs (#846)
        './client/js/dnd.js',

        './client/js/uploader.api.js',
        './client/js/uploader.js',
        './client/js/ajax.requester.js',

        # TODO tied to the delete file feature and can be omitted or included in the combined file based on integrator prefs (#846)
        './client/js/deletefile.ajax.requester.js',

        # TODO tied to the CORS feature and can be omitted or included in the combined file based on integrator prefs (#846)
        './client/js/window.receive.message.js',

        './client/js/handler.base.js',
        './client/js/handler.xhr.api.js',
        './client/js/handler.form.api.js',

        # TODO tied to the edit filename feature and can be omitted or included in the combined file based on integrator prefs (#846)
        './client/js/ui.handler.events.js',
        './client/js/ui.handler.click.drc.js',
        './client/js/ui.handler.edit.filename.js',
        './client/js/ui.handler.click.filename.js',
        './client/js/ui.handler.focusin.filenameinput.js',
        './client/js/ui.handler.focus.filenameinput.js'
    ]

    traditional = [
        './client/js/traditional/handler.form.js',
        './client/js/traditional/handler.xhr.js'
    ]

    s3 = [
        './client/js/s3/util.js',
        './client/js/s3/uploader.basic.js',
        './client/js/s3/uploader.js',
        './client/js/s3/signature.ajax.requester.js',
        './client/js/s3/uploadsuccess.ajax.requester.js',
        './client/js/s3/multipart.initiate.ajax.requester.js',
        './client/js/s3/multipart.complete.ajax.requester.js',
        './client/js/s3/multipart.abort.ajax.requester.js',
        './client/js/s3/handler.xhr.js',
        './client/js/s3/handler.form.js',
        './client/js/s3/jquery-plugin.js'
    ]

    # jQuery plugin modules
    jquery = core.concat './client/js/jquery-plugin.js',

                         # TODO tied to the DnD feature and can be omitted or included in the combined file based on integrator prefs (#846)
                         './client/js/jquery-dnd.js'

    all = jquery.concat (traditional.concat s3)

    extra = [
        './client/js/iframe.xss.response.js'
        './client/loading.gif',
        './client/processing.gif',
        './client/edit.gif',
        './README.md',
        './LICENSE'
    ]

    versioned = [
        'package.json',
        'fineuploader.jquery.json',
        'client/js/version.js',
        'bower.json',
        'README.md'
    ]

    browsers = [
        #{
        #    browserName: 'android'
        #    platform: 'Linux'
        #    version: '4.0'
        #}
        {
            browserName: 'iphone'
            platform: 'OS X 10.8'
            version: '6'
        }
        {
            browserName: 'safari'
            platform: 'OS X 10.8'
            version: '6'
        }
        {
            browserName: 'safari'
            platform: 'OS X 10.6'
            version: '5'
        }
        {
            browserName: 'internet explorer'
            platform: 'Windows 8'
            version: '10'
        }
        {
            browserName: 'internet explorer'
            platform: 'Windows 7'
            version: '9'
        }
        {
            browserName: 'internet explorer'
            platform: 'Windows 7'
            version: '8'
        }
        {
            browserName: 'internet explorer'
            platform: 'Windows XP'
            version: '7'
        }
        {
            browserName: 'chrome'
            platform: 'Windows 7'
        }
        {
            browserName: 'firefox'
            platform: 'Windows 7'
            version: '21'
        }
    ]

    # Configuration
    # ==========
    grunt.initConfig

        # Package
        # --------
        pkg: pkg
        extra: extra

        # Modules
        # ----------
        # works
        bower:
            install:
                options:
                    targetDir: './test/vendor'
                    install: true
                    cleanTargetDir: true
                    cleanBowerDir: true
                    layout: 'byComponent'

        # Clean
        # --------
        clean:
            build:
                files:
                    src: './build'
            dist:
                files:
                    src: './dist'
            test:
                files:
                    src: ['./test/temp*', 'test/coverage']
            vendor:
                files:
                    src: './test/vendor/*'

        # Banner
        # ----------
        usebanner:
            header:
                src: ['./build/*.{js,css}']
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
            footer:
                src: ['./build/*.{js,css}']
                options:
                    position: 'bottom'
                    banner: '/*! <%= grunt.template.today("yyyy-mm-dd") %> */\n'

        # Complexity
        # ----------
        complexity:
                src:
                    files:
                        src: ['./client/js/*.js']
                    options:
                        errorsOnly: false # show only maintainability errors
                        cyclomatic: 5
                        halstead: 8
                        maintainability: 100
                        #jsLintXML: 'report.xml' # create XML JSLint-like report

        # Concatenate
        # --------
        concat:
            core:
                src: core.concat traditional
                dest: './build/<%= pkg.name %>.js'
            coreS3:
                src: core.concat s3
                dest: './build/s3.<%= pkg.name %>.js'
            jquery:
                src: jquery.concat traditional
                dest: './build/jquery.<%= pkg.name %>.js'
            jqueryS3:
                src: jquery.concat s3
                dest: './build/s3.jquery.<%= pkg.name %>.js'
            all:
                src: all
                dest: './build/all.<%= pkg.name %>.js'
            css:
                src: ['./client/*.css']
                dest: './build/<%= pkg.name %>.css'


        # Uglify
        # --------
        uglify:
            options:
                mangle: true
                compress: true
                report: 'min'
                preserveComments: 'some'
            core:
                src: ['<%= concat.core.dest %>']
                dest: './build/<%= pkg.name %>.min.js'
            jquery:
                src: ['<%= concat.jquery.dest %>']
                dest: './build/jquery.<%= pkg.name %>.min.js'
            coreS3:
                src: ['<%= concat.coreS3.dest %>']
                dest: './build/s3.<%= pkg.name %>.min.js'
            jqueryS3:
                src: ['<%= concat.jqueryS3.dest %>']
                dest: './build/s3.jquery.<%= pkg.name %>.min.js'
            all:
                src: ['<%= concat.all.dest %>']
                dest: './build/all.<%= pkg.name %>.min.js'

        # Copy
        # ----------
        # @noworks
        copy:
            dist:
                files: [
                    {
                        expand: true
                        cwd: './build/'
                        src: ['*.js', '!all.*', '!s3.*', '!*.min.js', '!jquery*', '!*iframe*']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './build/'
                        src: [ '!all.*', 's3.*.js', '!*.min.js', '!s3.jquery*', '!*iframe*']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './build/'
                        src: ['*.min.js',  '!all.*', '!s3.*', '!jquery*']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '-<%= pkg.version %>.min.js'
                    }
                    {
                        expand: true
                        cwd: './build/'
                        src: ['s3.*.min.js', '!s3.jquery*']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    }
                    {
                        expand: true
                        cwd: './build/'
                        src: ['jquery*js', '!s3.*', '!*.min.js']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: './build/'
                        src: ['s3.jquery*js', '!*.min.js']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.js'
                    },
                    {
                        expand: true
                        cwd: './build/'
                        src: ['jquery*min.js']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    }
                    {
                        expand: true
                        cwd: './build/'
                        src: ['s3.jquery*min.js']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.min.js'
                    }
                    {
                        expand: true
                        cwd: './client/js/'
                        src: ['iframe.xss.response.js']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.xss.response-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './client/js/'
                        src: ['iframe.xss.response.js']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.xss.response-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './client/js/'
                        src: ['iframe.xss.response.js']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.xss.response-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './client/js/'
                        src: ['iframe.xss.response.js']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/'
                        ext: '.xss.response-<%= pkg.version %>.js'
                    }
                    {
                        expand: true
                        cwd: './client/'
                        src: ['*.gif']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './client/'
                        src: ['*.gif']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './client/'
                        src: ['*.gif']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './client/'
                        src: ['*.gif']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './'
                        src: ['LICENSE']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.min.css']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.min.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.min.css']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.min.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.css', '!*.min.css']
                        dest: './dist/<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.css', '!*.min.css']
                        dest: './dist/s3.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.min.css']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.min.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.min.css']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.min.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.css', '!*.min.css']
                        dest: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.css'
                    }
                    {
                        expand: true
                        cwd: './build'
                        src: ['*.css', '!*.min.css']
                        dest: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>'
                        ext: '-<%= pkg.version %>.css'
                    }
                ]
            build:
                files: [
                    {
                        expand: true
                        cwd: './client/js/'
                        src: ['iframe.xss.response.js']
                        dest: './build/'
                    },
                    {
                        expand: true
                        cwd: './client/'
                        src: ['*.gif']
                        dest: './build/'
                    }
                ]
            test:
                expand: true
                flatten: true
                src: ['./build/*']
                dest: './test/temp'
            images:
                files: [
                    expand: true
                    cwd: './client/'
                    src: ['*.gif']
                    dest: './build/'
                ]


        # Compress
        # ----------
        compress:
            jquery:
                 options:
                     archive: './dist/jquery.<%= pkg.name %>-<%= pkg.version %>.zip'
                 files: [
                     {
                         expand: true
                         cwd: 'dist/'
                         src: './jquery.<%= pkg.name %>-<%= pkg.version %>/*'
                     }
                 ]
             jqueryS3:
                  options:
                      archive: './dist/s3.jquery.<%= pkg.name %>-<%= pkg.version %>.zip'
                  files: [
                      {
                          expand: true
                          cwd: 'dist/'
                          src: './s3.jquery.<%= pkg.name %>-<%= pkg.version %>/*'
                      }
                  ]
            core:
                options:
                    archive: './dist/<%= pkg.name %>-<%= pkg.version %>.zip'
                files: [
                    {
                        expand: true
                        cwd: 'dist/'
                        src: './<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]
            coreS3:
                options:
                    archive: './dist/s3.<%= pkg.name %>-<%= pkg.version %>.zip'
                files: [
                    {
                        expand: true
                        cwd: 'dist/'
                        src: './s3.<%= pkg.name %>-<%= pkg.version %>/*'
                    }
                ]

        # cssmin
        # ---------
        # @works
        cssmin:
            options:
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                report: 'min'
            files:
                src: '<%= concat.css.dest %>'
                dest: './build/<%= pkg.name %>.min.css'

        # Lint
        # --------
        # @nowork
        jshint:
            source: ['./client/js/*.js']
            tests: ['./test/unit/*.js']
            options:
                validthis: true
                laxcomma: true
                laxbreak: true
                browser: true
                eqnull: true
                debug: true
                devel: true
                boss: true
                expr: true
                asi: true

        # Run linter on coffeescript files
        # ----------
        # @works
        coffeelint:
            options:
                indentation:
                    level: 'ignore'
                no_trailing_whitespace:
                    level: 'ignore'
                max_line_length:
                    level: 'ignore'
            grunt: './Gruntfile.coffee'


        # Server to run tests against and host static files
        # ----------
        # @works
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
                    port: 9001

        # Watching for changes
        # ----------
        # @works
        watch:
            options:
                interrupt: true
                debounceDelay: 250
            js:
                files: ['./client/js/*.js', './client/js/s3/*.js']
                tasks: [
                    'build'
                    'copy:test'
                    'connect:test_server'
                    'mocha'
                ]
            test:
                files: ['./test/unit/*.js', './test/unit/s3/*.js']
                tasks: [
                    'jshint:tests'
                    'test'
                ]
            grunt:
                files: ['./Gruntfile.coffee']
                tasks: [
                    'coffeelint:grunt'
                    'build'
                    'test'
                ]
            images:
                files: ['./client/*.gif']
                tasks: [
                    'copy:images'
                ]

        # Increment version with semver
        # ----------
        version:
            options:
                pkg: pkg,
                prefix: '[^\\-][Vv]ersion[\'"]?\\s*[:=]\\s*[\'"]?'
            major:
                options:
                    release: 'major'
                src: versioned
            minor:
                options:
                    release: 'minor'
                src: versioned
            hotfix:
                options:
                    release: 'patch'
                src: versioned
            build:
                options:
                    release: 'build'
                src: versioned

        # Test
        # ----------
        mocha:
            all:
                options:
                    urls: ['http://localhost:9001/index.html']
                    log: true
                    mocha:
                        ignoreLeaks: false
                    reporter: 'Spec'
                    run: false

        # Saucelas + Mocha
        # ---------
        'saucelabs-mocha':
            all:
                options:
                    urls: ['http://localhost:9001/index.html']
                    tunneled: true
                    concurrency: 3
                    identifier: process.env.TRAVIS_JOB_ID || Math.floor((new Date).getTime() / 1000 - 1230768000).toString()
                    tags: [ process.env.SAUCE_USERNAME+"@"+process.env.TRAVIS_BRANCH || process.env.SAUCE_USERNAME+"@local"]
                    testname: 'Unit Tests'
                    detailedError: false
                    build: process.env.TRAVIS_BUILD_ID || Math.floor((new Date).getTime() / 1000 - 1230768000).toString()
                    browsers: browsers
                    ## onTestComplete: (status, page, config, browser) ->
                    ##     done = @async()
                    ##     browser.eval 'JSON.stringify(window.mochaResults)', (err, res) ->
                    ##         done(err) if err

                    ##         res = JSON.parse res
                    ##         res.browser = config

                    ##         grunt.log.debug '[%s] Results: %j', config.prefix, res

                    ##         data =
                    ##             'custom-data':
                    ##                 mocha: res.jsonReport
                    ##             'passed': !res.failures

                    ##         request
                    ##             method: 'PUT'
                    ##             uri: ["https://", process.env.SAUCE_USERNAME, ":", process.env.SAUCE_ACCESS_KEY, "@saucelabs.com/rest", "/v1/", process.env.SAUCE_USERNAME, "/jobs/", browser.sessionID].join('')
                    ##             headers:
                    ##                 'Content-Type': 'application/json'
                    ##             body: JSON.stringify data
                    ##         , (error, response, body) ->
                    ##             done(error) if error
                    ##             done res

    # Dependencies
    # ==========
    for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
        grunt.loadNpmTasks name

    # Tasks
    # ==========

    # Lint
    # ----------
    grunt.registerTask 'lint', 'Lint, in order, the Gruntfile, sources, and tests.', [
        'coffeelint:grunt',
        'jshint:source',
        'jshint:tests'
    ]

    # Minify
    # ----------
    grunt.registerTask 'minify', 'Minify the source javascript and css', [
        'uglify'
        'cssmin'
    ]

    # Docs
    # ----------
    # @todo
    grunt.registerTask 'docs', 'IN THE WORKS: Generate documentation', []


    # Watcher
    # ----------
    grunt.registerTask 'test-watch', 'Run headless unit-tests and re-run on file changes', [
        'rebuild',
        'copy:test'
        'watch'
    ]
    # Coverage
    # ----------
    # @todo
    grunt.registerTask 'coverage', 'IN THE WORKS: Generate a code coverage report', []

    # Travis
    # ---------
    grunt.registerTask 'check_for_pull_request_from_master', 'Fails if we are testing a pull request against master', ->
        if (process.env.TRAVIS_BRANCH == 'master' and process.env.TRAVIS_PULL_REQUEST != 'false')
            grunt.fail.fatal '''Woah there, buddy! Pull requests should be
            branched from develop!\n
            Details on contributing pull requests found here: \n
            https://github.com/Widen/fine-uploader/blob/master/CONTRIBUTING.md\n
            '''

    # Travis' own test
    # ----------
    grunt.registerTask 'travis-sauce', 'Run tests on Saucelabs', [
        'copy:test'
        'connect:test_server'
        'saucelabs-mocha'
    ]

    grunt.registerTask 'travis', [
        'check_for_pull_request_from_master'
        'travis-sauce'
    ]

    # Test
    # ----------
    grunt.registerTask 'test', 'Run headless unit tests', [
        'rebuild'
        'copy:test'
        'connect:test_server'
        'mocha'
    ]

    # Test on Saucelabs
    # ----------
    grunt.registerTask 'test-sauce', 'Run tests on Saucelabs', [
        'rebuild'
        'copy:test'
        'connect:test_server'
        'saucelabs-mocha'
    ]

    # Local tests (indefinite)
    # ----------
    grunt.registerTask 'test-local', 'Run a local server indefinitely for testing', [
        'copy:test'
        'connect:root_server'
    ]


    # Build
    # ----------
    # @verify
    grunt.registerTask 'build', 'build from latest source', [
        'concat'
        'minify'
        'usebanner'
        'copy:images'
    ]

    # Prepare
    # ----------
    # @verify
    grunt.registerTask 'prepare', 'Prepare the environment for FineUploader development', [
        'clean'
        'bower'
    ]

    # Rebuild
    # ----------
    grunt.registerTask 'rebuild', "Rebuild the environment and source", [
        'prepare',
        'build'
    ]

    # Dist
    # ---------
    # @todo
    grunt.registerTask 'dist', 'build a zipped distribution-worthy version', [
        'build'
        'copy:dist'
        'compress'
    ]

    # Default
    # ----------
    grunt.registerTask 'default', 'Default task: clean, bower, lint, build, & test', [
        'clean'
        #'lint'
        'build'
        'test'
    ]
