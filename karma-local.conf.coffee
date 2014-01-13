# Local Karma configuration
sharedConfig = require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config

    config.set
      testName: '[local] FineUploader: tests'
      logFile: 'fineuploader.log'
      autoWatch: true
