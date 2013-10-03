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

  grunt.registerTask 'custombuild', 'Generate a custom build', (derp) ->
    if (arguments.length == 0)
      grunt.log.writeln "No args"
    else
      grunt.log.writeln derp
    ###
    argv = require('optimist')
      .options('dest',
        default: @options().dest
        describe: "Destination to build to"
      ).options('fuSrcUi',
        default: false
        describe: "Provide default UI"
      ).options('fuSrcTraditional',
        default: false,
        describe: "Provide 'traditional' endpoint support"
      ).options('fuSrcS3',
        default: false
        decribe: "Provide Amazon S3 endpoint support"
      ).options('fuSrcJquery',
        default: false
        describe: "Provide jQuery wrapper"
      ).options('extras',
        default: ""
        describe: "Comma-separated list of optional modules to include"
      ).argv

    opts = _.filter _.keys(argv), (k) ->
      if argv[k] is true
        opts[k] = true

    console.dir opts

    util.build.call @, argv.dest, argv
    ###

    ###
    moduleMapping =
      ui: ['fuSrcUi']
      jquery: ['fuSrcJquery']
      traditional: ['fuSrcTraditional']
      s3: ['fuSrcS3']
      s3Jquery: ['fuSrcS3Jquery']
      extras:
        all:
          ['fuSrcModules', 'fuUiModules']
        paste:
          ['fuPasteModule']
        dnd:
          ['fuDndModule']
        delete:
          ['fuDeleteFileModule']
        deleteui:
          ['fuDeleteFileUiModule']
        edit:
          ['fuEditFilenameModule']

    modules = ['fuSrcCore']
    for option of moduleMapping
      if argv[option] is true && argv[option] != 'extras'
        modules = modules.concat moduleMapping[option]

    if argv.modules?
      extraModules = argv.modules.split(',')
      if extraModules[0] == 'all'
          modules = modules.concat moduleMapping.extras['all']
      else
        for extraModuleKey of moduleMapping['extras']
          if extraModuleKey in extraModules
            modules = modules.concat moduleMapping.extras[extraModuleKey]

    grunt.log.write "\nBuilding with modules: "
    console.log modules
    modules = sourceModules.mergeModules.apply @, modules

    src = ''
    modules.map((f) ->
      # Concatenate
      src += grunt.file.read f
      console.log f
      src
    ).join(grunt.util.linefeed)

    grunt.file.mkdir argv.dest
    dest = argv.dest + '/fineuploader-<%= pkg.version %>.js'
    dest = grunt.template.process dest, grunt.config
    grunt.file.write dest, src
    grunt.log.writeln("Wrote #{dest}")

    extraModulesMapping =
      img: ['fuImages']
      css: ['fuCss']
      iframe: ['fuIframeXssResponse']

    extraModules = ['fuDocs', 'fuImages', 'fuIframeXssResponse', 'fuCss']
    for option in extraModulesMapping
      if argv[option] is false
        extraModules[option] = []

    extraModules = sourceModules.mergeModules.apply @, extraModules

    self = @
    extraModules.map (f) ->
      dest = argv.dest + "/#{path.basename(f)}"
      src = grunt.file.read f
      grunt.file.write(dest)
      grunt.log.writeln("Wrote #{dest}")

  ###

  ###
  grunt.registerMultiTask 'sauce-connect', 'Run or kill sauce connect', ->
    if grunt.option 'kill'
  ###

