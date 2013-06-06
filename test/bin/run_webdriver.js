var webdriver = require('wd')
  , assert = require('assert');

var browser = webdriver.remote(
  "ondemand.saucelabs.com"
  , 80
  , "feltnerm"
  , "47c0c315-9e60-449e-af53-dc51b78db5bf"
);

browser.on('status', function(info){
  console.log('\x1b[36m%s\x1b[0m', info);
});

browser.on('command', function(meth, path){
  console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
});

var desired = {
  browserName: 'iphone'
  , version: '5.0'
  , platform: 'Mac 10.6'
  , tags: ["examples"]
  , name: "This is an example test"
}

browser.init(desired, function() {
  browser.get("http://saucelabs.com/test/guinea-pig", function() {
    browser.title(function(err, title) {
      assert.ok(~title.indexOf('I am a page title - Sauce Labs'), 'Wrong title!');
      browser.elementById('submit', function(err, el) {
        browser.clickElement(el, function() {
          browser.eval("window.location.href", function(err, href) {
            assert.ok(~href.indexOf('guinea'), 'Wrong URL!');
            browser.quit()
          })
        })
      })
    })
  })
})
