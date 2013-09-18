###
  ______ _              _    _       _                 _
 |  ____(_)            | |  | |     | |               | |
 | |__   _ _ __   ___  | |  | |_ __ | | ___   __ _  __| | ___ _ __
 |  __| | | '_ \ / _ \ | |  | | '_ \| |/ _ \ / _` |/ _` |/ _ \ '__|
 | |    | | | | |  __/ | |__| | |_) | | (_) | (_| | (_| |  __/ |
 |_|    |_|_| |_|\___|  \____/| .__/|_|\___/ \__,_|\__,_|\___|_|
                              | |
                              |_|

 Gruntfile
###

module.exports = (grunt) ->

  fs = require 'fs'

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
    'docs': './docs'
    'test': './test'

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

    coffeelint:
      options:
        indentation:
          level: 'ignore'
        no_trailing_whitespace:
          level: 'ignore'
        max_line_length:
          level: 'ignore'
      grunt: './Gruntfile.coffee'

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

    concat:
      core:
        src: fineUploaderModules.mergeModules 'fuSrcTraditional', 'fuSrcModules', 'fuUiModules'
        dest: "#{paths.build}/<%= pkg.name %>.js"
      coreS3:
        src: fineUploaderModules.mergeModules 'fuSrcS3', 'fuSrcModules', 'fuUiModules'
        dest: "#{paths.build}/s3.<%= pkg.name %>.js"
      jquery:
        src: fineUploaderModules.mergeModules 'fuSrcTraditional', 'fuSrcModules', 'fuUiModules', 'fuSrcJquery'
        dest: "#{paths.build}/jquery.<%= pkg.name %>.js"
      jqueryS3:
        src: fineUploaderModules.mergeModules 'fuSrcS3', 'fuSrcModules', 'fuUiModules', 'fuSrcJquery'
        dest: "#{paths.build}/s3.jquery.<%= pkg.name %>.js"
      all:
        src: fineUploaderModules.mergeModules 'fuSrcTraditional', 'fuSrcModules', 'fuUiModules', 'fuSrcS3', 'fuSrcJquery'
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
            src: ['*.js', '!all.*', '!s3.*', '!*.min.js', '!jquery*', '!*iframe*']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
            ext: '-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: paths.build
            src: [ '!all.*', 's3.*.js', '!*.min.js', '!s3.jquery*', '!*iframe*']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.<%= pkg.name %>-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.min.js',  '!all.*', '!s3.*', '!jquery*']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
            ext: '-<%= pkg.version %>.min.js'
          }
          {
            expand: true
            cwd: paths.build
            src: ['s3.*.min.js', '!s3.jquery*']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
          }
          {
            expand: true
            cwd: paths.build
            src: ['jquery*js', '!s3.*', '!*.min.js']
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
            src: ['jquery*min.js']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.<%= pkg.name %>-<%= pkg.version %>.min.js'
          }
          {
            expand: true
            cwd: paths.build
            src: ['s3.jquery*min.js']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.jquery.<%= pkg.name %>-<%= pkg.version %>.min.js'
          }
          {
            expand: true
            cwd: "./#{paths.src}/js/"
            src: ['iframe.xss.response.js']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.xss.response-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: "./#{paths.src}/js/"
            src: ['iframe.xss.response.js']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.xss.response-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: "./#{paths.src}/js/"
            src: ['iframe.xss.response.js']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.xss.response-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: "./#{paths.src}/js/"
            src: ['iframe.xss.response.js']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
            ext: '.xss.response-<%= pkg.version %>.js'
          }
          {
            expand: true
            cwd: paths.src
            src: ['*.gif']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: paths.src
            src: ['*.gif']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: paths.src
            src: ['*.gif']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: paths.src
            src: ['*.gif']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: './'
            src: ['LICENSE']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: './'
            src: ['LICENSE']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: './'
            src: ['LICENSE']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: './'
            src: ['LICENSE']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>/"
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.min.css']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.min.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.min.css']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.min.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.css', '!*.min.css']
            dest: "#{paths.dist}/<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.css', '!*.min.css']
            dest: "#{paths.dist}/s3.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.min.css']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.min.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.min.css']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.min.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.css', '!*.min.css']
            dest: "#{paths.dist}/jquery.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.css'
          }
          {
            expand: true
            cwd: paths.build
            src: ['*.css', '!*.min.css']
            dest: "#{paths.dist}/s3.jquery.<%= pkg.name %>-<%= pkg.version %>"
            ext: '-<%= pkg.version %>.css'
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
            src: ['*.gif']
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
          src: ['*.gif']
          dest: paths.build
        ]

    cssmin:
      options:
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        report: 'min'
      files:
        src: '<%= concat.css.dest %>'
        dest: "#{paths.build}/<%= pkg.name %>.min.css"

    jshint:
      source: ["#{paths.src}/js/*.js"]
      tests: ["#{paths.test}unit/*.js"]
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

    uglify:
      options:
        mangle: true
        compress: true
        report: 'min'
        preserveComments: 'some'
      core:
        src: ['<%= concat.core.dest %>']
        dest: "#{paths.build}/<%= pkg.name %>.min.js"
      jquery:
        src: ['<%= concat.jquery.dest %>']
        dest: "#{paths.build}/jquery.<%= pkg.name %>.min.js"
      coreS3:
        src: ['<%= concat.coreS3.dest %>']
        dest: "#{paths.build}/s3.<%= pkg.name %>.min.js"
      jqueryS3:
        src: ['<%= concat.jqueryS3.dest %>']
        dest: "#{paths.build}/s3.jquery.<%= pkg.name %>.min.js"
      all:
        src: ['<%= concat.all.dest %>']
        dest: "#{paths.build}/all.<%= pkg.name %>.min.js"

    usebanner:
      header:
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
      footer:
        src: ["#{paths.build}/*.{js,css}"]
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

    watch:
      options:
        interrupt: true
        debounceDelay: 250
      js:
        files: ["#{paths.src}/js/*.js", "#{paths.src}/js/s3/*.js"]
        tasks: [
          'dev'
          'test-unit'
        ]
      test:
        files: ["#{paths.test}/unit/*.js", "#{paths.test}/unit/s3/*.js"]
        tasks: [
          'jshint:tests'
          'test-unit'
        ]
      grunt:
        files: ['./Gruntfile.coffee']
        tasks: [
          'coffeelint:grunt'
          'build'
        ]
      images:
        files: ["#{paths.src}/*.gif"]
        tasks: [
          'copy:images'
        ]

    tests:
      local: 'karma-local.conf.coffee'

    autotest:
      local: 'karma-local.conf.coffee'

    saucetests:
      default:
        configFile: 'karma-sauce.conf.coffee'
        browsers: [
          ['SL-chrome-28-Linux', 'SL-firefox-21-Linux', 'SL-safari-6-OS_X_10.8'],
          ['SL-internet_explorer-10-Windows_8', 'SL-internet_explorer-9-Windows_7', 'SL-internet_explorer-8-Windows_7'],
          ['SL-android-4.0-Linux', 'SL-iphone-6-OS_X_10.8', 'SL-safari-5-OS_X_10.6'],
          #['SL-internet_explorer-7-Windows_XP'],
        ]

    mochaWebdriver:
      options:
        timeout: 60000
        testName: '[selenium] Fine Uploader'
        reporter: 'spec'
      local:
        src: ['test/functional/*.coffee']
        options:
          usePhantom: true
      sauce:
        src: ['test/functional/*.coffee']
        options:
          username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME || ''
          key: process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_ACCESSKEY || ''
          identifier: process.env.TRAVIS_JOB_NUMBER || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`
          concurrency: 3
          tunnelTimeout: 60000
          browsers: allBrowsers.modules

    shell:
      start_saucecon:
        command: './lib/sauce/sauce_connect_setup.sh'
      kill_saucecon:
        command: 'cat /tmp/sauce-connect.pid | xargs kill'
      npm_install:
        command: 'npm install'

  # Dependencies
  # ==========
  for name of pkg.devDependencies when name.substring(0, 6) is 'grunt-'
    grunt.loadNpmTasks name

  grunt.loadTasks './lib/grunt'

  # Tasks
  # ==========
  grunt.registerTask 'test:unit', 'Run unit tests locally with Karma', ['dev', 'tests:local']
  grunt.registerTask 'test:unit:sauce', 'Run tests with Karma on SauceLabs', ['dev', 'saucetests:default']
  grunt.registerTask 'test:func', 'Run functional tests locally', ['dev', 'mochaWebdriver:local']
  grunt.registerTask 'test:func:sauce', 'Run functional tests on SauceLabs', ['dev', 'mochaWebdriver:sauce']

  grunt.registerTask 'travis', 'Test with Travis CI', ['check_pull_req', 'saucetests:default']

  grunt.registerTask 'dev', 'Prepare code for testing', ['clean', 'shell:npm_install', 'bower', 'package', 'copy:test']
  grunt.registerTask 'build', 'Build from latest source', ['concat', 'minify', 'usebanner', 'copy:images']
  grunt.registerTask 'package', 'Build a zipped distribution-worthy version', ['build', 'copy:dist', 'compress']
  grunt.registerTask 'default', 'Default task: clean, bower, lint, build, & test', ['package']
