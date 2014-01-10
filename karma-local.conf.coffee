# Local Karma configuration
sharedConfig = require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config

    config.set
      autoWatch: true
      singleRun: false
      testName: '[local] FineUploader: tests'
      logFile: 'fineuploader.log'
      browsers: [
          'PhantomJS'
      ]

