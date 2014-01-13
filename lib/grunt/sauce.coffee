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
#
#    grunt.registerMultiTask 'saucetests', 'Run Karma tests on sauce', ->
#        self = @
#        done = @async()
#        count = 0
#        results = []
#        success = true
#        # we can only run 3 simultaneous browsers on SauceLabs
#        grunt.util.async.forEachSeries @data.browsers, (browserSet, next) ->
#            browsers = browserSet.join ','
#            port = util.sauceLabsAvailablePorts.pop()
#            args = ["node_modules/karma/bin/karma", "start", self.data.configFile,
#                    "--browsers=#{browsers}", "--port=#{port}", "--single-run=true"]
#
#            grunt.util.spawn
#                cmd: 'node'
#                grunt: false
#                args: args
#                opts:
#                    stdio: 'inherit'
#            , (error, result, code) ->
#                results[count] = code || 0
#                count++
#                if code != 0
#                    success = false
#                next()
#        , (err) ->
#            if err?
#                done err
#            else
#                done success
#
#    grunt.registerTask 'wait_for_sauce', '', ->
#        done = @async()
#
#        SauceLabs = require 'saucelabs'
#        saucelabs = new SauceLabs
#            username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME
#            password: process.env.SAUCE_ACCESSKEY || process.env.SAUCE_ACCESS_KEY
#
#        jobs_in_progress = 1
#
#        # Filter out all the jobs that do NOT match `type`
#        reject_jobs = (type, next) ->
#            (jobs) ->
#                jobs = jobs.filter (job) ->
#                    return job.status != type
#                if typeof next == 'function'
#                    next jobs
#
#        # Query SauceLabs' REST API for all jobs that have been run for this
#        # account
#        get_jobs = (next) ->
#            saucelabs.getJobs (err, jobs) ->
#                if err?
#                    grunt.log.error(error)
#                if typeof next == 'function'
#                    next jobs
#
#        # Wait until jobs_in_progress is 0, if it isn't keep querying
#        # SauceLabs
#        # Currently, if more than 0 jobs are running, this task will block
#        # until 0 are running. This could be optimized since we can run
#        # 3 at a time.
#        wait = (next) ->
#            if jobs_in_progress > 0
#                grunt.log.writeln("Waiting. #{jobs_in_progress} jobs running ...")
#                in_progress = reject_jobs 'complete', (jobs, next) ->
#                    if jobs and jobs.length > 0
#                        jobs_in_progress = jobs.length
#                    else
#                        jobs_in_progress = 0
#                get_jobs in_progress
#                setTimeout wait, 10000, next
#            else
#                grunt.log.writeln("0 jobs running. Continuing forth!")
#                if typeof next == 'function'
#                    next(true)
#        wait done
