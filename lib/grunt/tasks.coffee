util = require './utils'
spawn = require('child_process').spawn

module.exports = (grunt) ->

  grunt.registerTask 'lint', 'Lint, in order, the Gruntfile, sources, and tests.', ['concurrent:lint']

  grunt.registerTask 'minify', 'Minify the source javascript and css', ['cssmin', 'uglify']

  grunt.registerMultiTask 'tests', '** Use ` grunt-test` instead **', ->
    util.startKarma.call util, @data, true, @async()

  grunt.registerMultiTask 'autotest', ->
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

  ###
  grunt.registerMultiTask 'sauce-connect', 'Run or kill sauce connect', ->
    if grunt.option 'kill'
  ###

