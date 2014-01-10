# SauceLabs Karma configuration
sharedConfig = require './karma.conf'
modules = require './lib/modules'
allBrowsers = require './lib/browsers'
testRunnerId = if process.env.TRAVIS_BRANCH? then "travis #{process.env.TRAVIS_BRANCH}" else "#{process.env.SAUCE_USERNAME}@local"

module.exports = (config, options = {}) ->
    sharedConfig config,
      testName: '[sauce] FineUploader: tests'
      logFile: 'fineuploader-sauce.log'
      singleRun: true
      autoWatch: false
      customLaunchers: allBrowsers.sauceBrowsers
      sauceLabs:
        recordVideo: false
        startConnect: false
        tags: [ testRunnerId ]
        testName: options.testName || '[unit] FineUploader'
        username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME || ''
        accessKey: process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_ACCESSKEY || ''
        build: process.env.TRAVIS_BUILD_ID || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`
        tunnelIdentifer: process.env.TRAVIS_JOB_NUMBER || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`

