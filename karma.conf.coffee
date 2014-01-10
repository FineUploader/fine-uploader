# Shared Karma configuration
modules = require './lib/modules'
allBrowsers = require './lib/browsers'

module.exports = (config, options = {}) ->
  config.set
    files: modules.mergeModules 'karmaModules', 'fuSrcBuild', 'fuIframeXssResponse', 'testHelperModules', 'fuUnit'
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

  if process.env.TRAVIS
      config.transports = ['xhr-polling']
      # Debug logging into a file, that we print out at the end of the build.
      config.loggers.push
          type: 'file'
          filename: process.env.LOGS_DIR + '/' + options.logFile || 'karma.log'
          level: config.LOG_DEBUG
