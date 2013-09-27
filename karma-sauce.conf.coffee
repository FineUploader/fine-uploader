# SauceLabs Karma configuration
sharedConfig = require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config,
      testName: '[sauce] FineUploader: tests'
      logFile: 'fineuploader-sauce.log'
      singleRun: true
      autoWatch: false
