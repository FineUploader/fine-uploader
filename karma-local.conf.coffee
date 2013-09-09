# Local Karma configuration
sharedConfig = require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config,
      testName: '[local] FineUploader: tests'
      logFile: 'fineuploader.log'
      #files: modules.mergeModules 'karmaModules', 'fuSrcTraditional', 'fuSrcS3', 'fuSrcModules', 'fuUiModules', 'fuUnit'

    config.set
      browsers: ['PhantomJS']

