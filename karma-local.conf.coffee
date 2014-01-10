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
          'PhantomJS',
          'Firefox',
          'Chrome',
          'IE7 - WinXP',
          'IE8 - WinXP',
          'IE9 - Win7',
          'IE10 - Win7',
          'IE11 - Win7'
      ]

