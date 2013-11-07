util = require './utils'
path = require 'path'
spawn = require('child_process').spawn
sourceModules = require('../modules')

module.exports = (grunt) ->

    _ = grunt.util._
    grunt.registerTask 'lint', 'Lint, in order, the Gruntfile, sources, and tests.', ['concurrent:lint']

    grunt.registerTask 'minify', 'Minify the source javascript and css', [
        'cssmin:all', 'uglify:core', 'uglify:jquery', 'uglify:coreS3',
        'uglify:jqueryS3', 'uglify:all']

    grunt.registerMultiTask 'tests', '** Use ` grunt-test` instead **', ->
        util.startKarma.call util, @data, true, @async()

    grunt.registerMultiTask 'autotest', "Re-run karma tests on changes", ->
        util.startKarma.call util, @data, false, @async()

    grunt.registerTask 'check_pull_req', '', ->
        util.checkPullRequest()

    grunt.registerMultiTask 'saucetests', 'Run Karma tests on sauce', ->
        self = @
        done = @async()
        count = 0
        results = []
        success = true
        # we can only run 3 simultaneous browsers on SauceLabs
        grunt.util.async.forEachSeries @data.browsers, (browserSet, next) ->
            browsers = browserSet.join ','
            port = util.sauceLabsAvailablePorts.pop()
            args = ["node_modules/karma/bin/karma", "start", self.data.configFile,
                    "--browsers=#{browsers}", "--port=#{port}", "--single-run=true"]

            grunt.util.spawn
                cmd: 'node'
                grunt: false
                args: args
                opts:
                    stdio: 'inherit'
            , (error, result, code) ->
                results[count] = code || 0
                count++
                if code != 0
                    success = false
                next()
        , (err) ->
            if err?
                done err
            else
                done success

    grunt.registerTask 'wait_for_sauce', '', ->
        done = @async()

        SauceLabs = require 'saucelabs'
        saucelabs = new SauceLabs
            username: process.env.SAUCE_USERNAME || process.env.SAUCE_USER_NAME
            password: process.env.SAUCE_ACCESSKEY || process.env.SAUCE_ACCESS_KEY

        jobs_in_progress = 1

        # Filter out all the jobs that do NOT match `type`
        reject_jobs = (type, next) ->
            (jobs) ->
                jobs = jobs.filter (job) ->
                    return job.status != type
                if typeof next == 'function'
                    next jobs

        # Query SauceLabs' REST API for all jobs that have been run for this
        # account
        get_jobs = (next) ->
            saucelabs.getJobs (err, jobs) ->
                if err?
                    grunt.log.error(error)
                if typeof next == 'function'
                    next jobs

        # Wait until jobs_in_progress is 0, if it isn't keep querying
        # SauceLabs
        # Currently, if more than 0 jobs are running, this task will block
        # until 0 are running. This could be optimized since we can run
        # 3 at a time.
        wait = (next) ->
            if jobs_in_progress > 0
                grunt.log.writeln("Waiting. #{jobs_in_progress} jobs running ...")
                in_progress = reject_jobs 'complete', (jobs, next) ->
                    if jobs and jobs.length > 0
                        jobs_in_progress = jobs.length
                    else
                        jobs_in_progress = 0
                get_jobs in_progress
                setTimeout wait, 10000, next
            else
                grunt.log.writeln("0 jobs running. Continuing forth!")
                if typeof next == 'function'
                    next(true)
        wait done

