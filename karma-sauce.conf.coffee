sharedConfig = require './karma.conf'
browsers = require './test/browsers'
fineUploaderModules = require './lib/fineuploader.modules'

sauceBrowsers = do ->
  b = {}
  for browser in browsers
    key = "SL-#{browser.browserName.replace " ", "_"}-#{browser.version || ''}-#{browser.platform.replace " ", "_"}"
    key = key.replace " ", "_"
    b[key] =
      base: 'SauceLabs'
      browserName: browser.browserName
      version: browser.version
      platform: browser.platform
  return b

sauceBrowserKeys = do ->
  res = []
  for k of sauceBrowsers
    res.push k
  return res

module.exports = (config) ->
    sharedConfig config,
        testName: '[sauce] FineUploader: modules'
        logFile: 'fineuploader-modules.log'

    config.set
      customLaunchers: sauceBrowsers
      browsers: sauceBrowserKeys[0..2]
      singleRun: true
      autoWatch: false
      sauceLabs:
        username: process.env.SAUCE_USERNAME || ''
        accessKey: process.env.SAUCE_ACCESS_KEY || ''
        startConnect: false
        tags: [ process.env.SAUCE_USERNAME+"@"+process.env.TRAVIS_BRANCH || process.env.SAUCE_USERNAME+"@local"]
        build: process.env.TRAVIS_BUILD_ID || Math.floor((new Date).getTime() / 1000 - 1230768000).toString()
        identifer: process.env.TRAVIS_JOB_ID || Math.floor((new Date).getTime() / 1000 - 1230768000).toString()
        recordVideo: false
        recordScreenshots: false

