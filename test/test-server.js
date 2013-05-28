#!/usr/bin/env node

/*
* Simple connect server for phantom.js
* Adapted from Modernizr and Bootstrap
*/

var uploadPath = __dirname + './uploads'; 

function upload(req, res, next) {
  if ('POST' !== req.method) return next();

    var savePath = uploadPath;

    var fileName = req.files.qqfile.name;

    //after upload, rename the file and respond to Fine Uploader to notify it of success
    fs.rename(req.files.qqfile.path, savePath + fileName, function(err) {
        if (err != null) {
            console.log('Err: ' + err);
            res.send(JSON.stringify({success: false, error: err}), {'Content-Type': 'text/plain'}, 200);
        }
        else {
            res.send(JSON.stringify({success: true}), {'Content-Type': 'text/plain'}, 200);
            console.log('File Uploaded: ' + savePath + fileName);
        }
    });
}

var connect = require('connect')
  , http = require('http')
  , fs = require('fs')
  , app = connect()
            .use(connect.static(__dirname + '/../'))
            .use(connect.multipart({ uploadDir: uploadPath }))
            .use('/upload', upload);


http.createServer(app).listen(3000);
console.log("\n### Test Server Started on http://localhost:3000 ###");
console.log("http://localhost:3000/test/fixtures\n");

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

