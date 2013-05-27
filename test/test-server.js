#!/usr/bin/env node

/*
* Simple connect server for phantom.js
* Adapted from Modernizr and Bootstrap
*/

var connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , app = connect()
      .use(connect.static(__dirname + '/../'));

http.createServer(app).listen(3000);

fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8')

// Use webdriverjs to create a Selenium Client
var phantomjsClient = exports.phantomjsClient = require('webdriverjs').remote({
        desiredCapabilities: {
            // You may choose other browsers
            // http://code.google.com/p/selenium/wiki/DesiredCapabilities
            browserName: 'phantomjs'
        },
        // webdriverjs has a lot of output which is generally useless
        // However, if anything goes wrong, remove this to see more details
        logLevel: 'silent'
});

var firefoxClient = exports.firefoxClient = require('webdriverjs').remote({
        desiredCapabilities: {
            // You may choose other browsers
            // http://code.google.com/p/selenium/wiki/DesiredCapabilities
            browserName: 'firefox'
        },
        // webdriverjs has a lot of output which is generally useless
        // However, if anything goes wrong, remove this to see more details
        logLevel: 'silent'
});

var chromeClient = exports.chromeClient = require('webdriverjs').remote({
        desiredCapabilities: {
            // You may choose other browsers
            // http://code.google.com/p/selenium/wiki/DesiredCapabilities
            browserName: 'chrome'
        },
        // webdriverjs has a lot of output which is generally useless
        // However, if anything goes wrong, remove this to see more details
        logLevel: 'silent'
});

var safariClient = exports.safariClient = require('webdriverjs').remote({
        desiredCapabilities: {
            // You may choose other browsers
            // http://code.google.com/p/selenium/wiki/DesiredCapabilities
            browserName: 'safari'
        },
        // webdriverjs has a lot of output which is generally useless
        // However, if anything goes wrong, remove this to see more details
        logLevel: 'silent'
});

/**
phantomjsClient.init().url('http://localhost:3000/test/test.html');
firefoxClient.init().url('http://localhost:3000/test/test.html');
chromeClient.init().url('http://localhost:3000/test/test.html');
safariClient.init().url('http://localhost:3000/test/test.html');
*/

