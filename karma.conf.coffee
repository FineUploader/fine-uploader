# Shared Karma configuration
modules = require './lib/modules'
allBrowsers = require './lib/browsers'
testRunnerId = if process.env.TRAVIS_BRANCH? then "travis #{process.env.TRAVIS_BRANCH}" else "#{process.env.SAUCE_USERNAME}@local"

module.exports = (config, options = {}) ->
  config.set
    files: modules.mergeModules 'karmaModules', 'fuSrcBuild', 'fuIframeXssResponse', 'fuUnit'
    basePath: ""
    autoWatch: true
    preprocessors:
        '**/*.coffee': 'coffee'
    logLevel: config.LOG_INFO
    logColors: true
    frameworks: ["mocha"]
    reporters: ["dots"]
    captureTimeout: 60000
    colors: true
    customLaunchers: allBrowsers.sauceBrowsers
    sauceLabs:
      recordVideo: false
      startConnect: false
      tags: [ testRunnerId ]
      testName: options.testName || '[unit] FineUploader'
      username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME || ''
      accessKey: process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_ACCESSKEY || ''
      build: process.env.TRAVIS_BUILD_ID || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`
      tunnelIdentifer: process.env.TRAVIS_JOB_NUMBER || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`

    if process.env.TRAVIS
        config.transports = ['xhr-polling']
        # Debug logging into a file, that we print out at the end of the build.
        config.loggers.push
            type: 'file'
            filename: process.env.LOGS_DIR + '/' + options.logFile || 'karma.log'
            level: config.LOG_DEBUG
