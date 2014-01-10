# Local Karma configuration
sharedConfig = require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config,
      testName: '[local] FineUploader: tests'
      logFile: 'fineuploader.log'

    config.set
      browsers: ['PhantomJS', 'SlimerJS']

