assert = require 'assert'
async = require 'async'

describe "Mocha test run by grunt-mocha-sauce", ->

  it 'has a browser injected into it', ->
    assert.ok @browser

describe "A basic Webdriver example", ->
  describe "injected browser executing a Google Search", ->
    it "performs as expected", (done) ->
      searchBox = undefined
      browser = @browser
      async.waterfall [(cb) ->
        browser.get "http://google.com", cb
      , (cb) ->
        browser.elementByName "q", cb
      , (el, cb) ->
        searchBox = el
        searchBox.type "webdriver", cb
      , (cb) ->
        searchBox.getAttribute "value", cb
      , (val, cb) ->
        try
          assert.equal val, "webdriver"
          cb()
        catch e
          cb e
      ], done


