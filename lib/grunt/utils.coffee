spawn = require('child_process').spawn
path = require 'path'
glob = require 'glob'
grunt = require 'grunt'
_ = grunt.util._
modules = require '../modules'

module.exports =

  startKarma: (config, done) ->
    browsers = grunt.option 'browsers'
    reporters = grunt.option 'reporters'
    port = grunt.option 'port'
    autoWatch = grunt.option 'autoWatch'
    singleRun = grunt.option 'singleRun'
    args = ['node_modules/karma/bin/karma', 'start', config,
      if singleRun then '--single-run' else '',
      if autoWatch then '--auto-watch' else '',
      if reporters then '--reporters=' + reporters else '',
      if browsers then '--browsers=' + browsers else '',
      if port then '--port=' + port else ''
    ]
    console.log(args)
    p = spawn 'node', args
    p.stdout.pipe process.stdout
    p.stderr.pipe process.stderr
    p.on 'exit', (code) ->
      if code != 0
        grunt.fail.warn "Karma test(s) failed. Exit code: " + code
      done()

  concat: (formulae) ->
    src = ''
    _.map(formulae, (f) ->
      files = glob.sync(f)
      _.map(files, (file) ->
          src = grunt.file.read file
          src
      ).join(grunt.util.linefeed)
    ).join(grunt.util.linefeed)

