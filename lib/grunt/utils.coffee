spawn = require('child_process').spawn
path = require 'path'
glob = require 'glob'
grunt = require 'grunt'
_ = grunt.util._
modules = require '../modules'

module.exports =

  checkPullRequest: ->
    if (process.env.TRAVIS_BRANCH == 'master' and process.env.TRAVIS_PULL_REQUEST != 'false')
      grunt.fail.fatal '''Woah there, buddy! Pull requests should be
      branched from develop!\n
      Details on contributing pull requests found here: \n
      https://github.com/Widen/fine-uploader/blob/master/CONTRIBUTING.md\n
      '''

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

  parallelTask: (args, options) ->
    task =
      grunt: true
      args: args
      stream: options && options.stream

    args.push '--port=' + @sauceLabsAvailablePorts.pop()

    if grunt.option 'reporters'
      args.push '--reporters=' + grunt.option 'reporters'

    task

  sauceLabsAvailablePorts: [9000, 9001, 9080, 9090, 9876]

  concat: (formulae) ->
    src = ''
    _.map(formulae, (f) ->
      files = glob.sync(f)
      _.map(files, (file) ->
          src = grunt.file.read file
          src
      ).join(grunt.util.linefeed)
    ).join(grunt.util.linefeed)

  build: (dest, formulae) ->
    ###
    This task will generate a custom build of Fine Uploader based on the
    provided `formulae`
    These formulae correspond to the keys in './lib/modules'
    and are combined into the `dest` directory.
    ###

    dest_src = path.join(dest, 'src')
    filename = grunt.config.process 'custom.<%= pkg.name %>-<%= pkg.version %>.js'
    dest_filename = path.join(dest, 'src', filename)

    # Build formula, true indicates that module should be included
    formula = []
    includes =
        fuSrcCore: false
        fuSrcTraditional: false
        fuSrcUi: false
        fuSrcS3: false
        fuSrcS3Ui: false
        fuSrcAzureWithFormSupport: false
        fuSrcAzureUi: false
        fuDeleteFileModule: false
        fuPasteModule: false
        fuDndModule: false
        fuUiEvents: false
        fuDeleteFileUiModule: false
        fuEditFilenameModule: false
        fuImagePreviewModule: false
        fuImageValidationModule: false
        fuSessionModule: false
        fuFormSupportModule: false
        fuScaling: false
        fuTotalProgress: false
        fuSrcJquery: false
        fuSrcS3Jquery: false
        fuSrcAzureJquery: false
        cryptoJs: false
        fuSrcJqueryDnd: false

    if _.isArray formulae
      _.each formulae, (mod) ->
        if mod in _.keys(includes)
          includes[mod] = true
        else
            grunt.log.error "Module: #{mod} not found in modules"
    else if _.isObject formulae
      includes = _.defaults includes, formulae

    formula = _.filter _.keys(includes), (k) -> includes[k] is true
    grunt.log.writeln ">> FORMULA: " + formula
    mods = modules.mergeModules.apply @, formula
    mods = _.uniq mods, true

    src = @concat mods
    grunt.file.write dest_filename, src
    grunt.log.writeln "Wrote: " + dest_filename

    extraIncludes =
      fuDocs: true
      fuImages: true
      fuCss: true
      fuTemplates: true
      fuPlaceholders: includes['fuImagePreviewModule']
      fuIframeXssResponse: true

    extraFormula = _.filter _.keys(extraIncludes), (k) -> extraIncludes[k] is true
    extraModules = modules.mergeModules.apply @, extraFormula

    _.each extraModules, (mod) ->
      modname = path.basename(mod)
      if modname.match(/\.css$/)
        modname = grunt.config.process 'custom.<%= pkg.name %>-<%= pkg.version %>.css'
      if '/' in mod and mod.split('/').indexOf('placeholders') != -1 or mod.split('/').indexOf('templates') != -1
          modname = mod.split('/').slice(1).join('/')
          grunt.log.writeln "Wrote extra module: #{modname}"
      grunt.file.copy mod, path.join(dest_src, modname)
      grunt.log.writeln "Copied: #{path.basename(modname)}"
