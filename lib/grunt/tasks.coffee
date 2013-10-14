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

