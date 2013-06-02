#!/usr/bin/env node

exports.casper = require('casper').create({
    clientScripts: [
        '../vendor/mocha.js',
        '../vendor/mocha.css',
        '../vendor/jquery-2.0.1.min.js',
        '../vendor/json2.js',
        '../vendor/purl.js',
        '../vendor/chai.js'
    ],
    logLevel: 'debug',
    onError: function (self, m) {
        console.log("ERROR: " + m);
    }
});

casper.on("remote.message", function (m) {
    console.log(m);
});

casper.start("http://localhost:3000/", function () {
    this.evalute(function sendLog(log) {
        console.log("from the browser, I can tell you are there");
    }, { log: this.result.log });
});
