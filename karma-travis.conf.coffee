sharedConfig= require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config

    config.set
        testName: '[travis] Fine Uploader tests'
        logFile: 'fineuploader-travis.log'
        singleRun: true
        autoWatch: false
        transports: ['xhr-polling']
        browsers: ['PhantomJS', 'Firefox']
