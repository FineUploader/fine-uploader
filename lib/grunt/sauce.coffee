#allBrowsers = require './../../browsers'
#
#module.exports = (grunt) ->
#
#    mochaWebdriver:
#        options:
#            timeout: 60000
#            testName: '[selenium] Fine Uploader'
#            reporter: 'spec'
#        local:
#            src: ['test/functional/*.coffee']
#            options:
#                usePhantom: true
#        sauce:
#            src: ['test/functional/*.coffee']
#            options:
#                username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME || ''
#                key: process.env.SAUCE_ACCESS_KEY || process.env.SAUCE_ACCESSKEY || ''
#                identifier: process.env.TRAVIS_JOB_NUMBER || `Math.floor((new Date).getTime() / 1000 - 1230768000).toString()`
#                concurrency: 3
#                tunnelTimeout: 60000
#                browsers: allBrowsers.modules
#
#    saucetests:
#        default:
#            configFile: 'karma-sauce.conf.coffee'
#            browsers: [
#                ['SL-android-4.0-Linux', 'SL-iphone-6-OS_X_10.8', 'SL-safari-5-OS_X_10.6'],
#                ['SL-chrome-28-Linux', 'SL-firefox-26-Linux', 'SL-safari-6-OS_X_10.8'],
#                ['SL-internet_explorer-11-Windows_8.1', 'SL-internet_explorer-10-Windows_8', 'SL-internet_explorer-9-Windows_7'],
#                ['SL-internet_explorer-8-Windows_7', 'SL-internet_explorer-7-Windows_XP']
#            ]
#
#    grunt.registerTask 'test:unit:sauce', 'Run tests with Karma on SauceLabs', ['dev', 'wait_for_sauce', 'saucetests:default']
#
#    grunt.registerTask 'test:func:sauce', 'Run functional tests on SauceLabs', ['dev', 'wait_for_sauce', 'mochaWebdriver:sauce']

