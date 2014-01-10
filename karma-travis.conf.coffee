sharedConfig= require './karma.conf'

module.exports = (config, options = {}) ->
    sharedConfig config

    config.set
        autoWatch: false
        singleRun: true
        testName: '[travis] Fine Uploader tests'
        logFile: 'fineuploader-travis.log'
        transports: ['xhr-polling']
        browsers: ['PhantomJS', 'SlimerJS']
