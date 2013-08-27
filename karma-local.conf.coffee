sharedConfig = require './karma.conf'
fineUploaderModules = require './lib/fineuploader.modules'

module.exports = (config) ->
    sharedConfig config,
        testName: '[local] FineUploader: modules'
        logFile: 'fineuploader-modules.log'

    config.set
      browsers: ['PhantomJS']
