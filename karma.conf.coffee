# Karma configuration
# Generated on Mon Aug 26 2013 20:43:41 GMT-0500 (CDT)

fineUploaderModules = require './lib/fineuploader.modules'

module.exports = (config, options = {}) ->

  config.set

    files: fineUploaderModules.mergeModules 'testScripts', 'all', 'karmaUnit'

    preprocessors:
        '**/*.coffee': 'coffee'

    # Logging
    # possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO

    # base path, that will be used to resolve files and exclude
    basePath: ""

    # enable / disable watching file and executing tests whenever any file changes
    autoWatch: false

    # frameworks to use
    frameworks: ["mocha"]

    # test results reporter to use
    # possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ["progress"]

    # web server port
    port: 9876

    # runner port
    runnerPort: 0

    # Start these browsers, currently available:
    # - Chrome
    # - ChromeCanary
    # - Firefox
    # - Opera
    # - Safari (only Mac)
    # - PhantomJS
    # - IE (only Windows)
    browsers: options.browsers || ['PhantomJS']

    # If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000

    # Continuous Integration mode
    # if true, it capture browsers, run tests and exit
    singleRun: false

    # enable / disable colors in the output (reporters and logs)
    colors: true

    if process.env.TRAVIS
        #config.transports = 'xhr-polling'
        # Debug logging into a file, that we print out at the end of the build.
        config.loggers.push
            type: 'file'
            filename: process.env.LOGS_DIR + '/' + options.logFile || 'karma.log'
            level: config.LOG_DEBUG
