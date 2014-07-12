util = require './utils'
path = require 'path'
spawn = require('child_process').spawn
sourceModules = require('../modules')

module.exports = (grunt) ->

    _ = grunt.util._
    grunt.registerTask 'lint', 'Lint, in order, the Gruntfile, sources, and tests.', ['concurrent:lint']

    grunt.registerTask 'minify', 'Minify the source javascript and css', [
        'cssmin:all', 'uglify:core', 'uglify:jquery', 'uglify:coreS3',
        'uglify:jqueryS3', 'uglify:jqueryAzure', 'uglify:coreAzure', 'uglify:all']

    grunt.registerMultiTask 'tests', '** Use ` grunt-test` instead **', ->
        util.startKarma.call util, @data, @async()

    grunt.registerTask 'check_pull_req', '', ->
        util.checkPullRequest()


