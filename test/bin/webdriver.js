#!/usr/bin/env node

var webdriver = require('webdriverjs');


var makeClient = function (browser) { 
    return webdriver.remote({
        desiredCapabilities: { 
            'javascriptEnabled': true, 
            'browserName': browser 
        },
        singleton: true,
        logLevel: 'silent'
    });
};

exports.makeClient = makeClient;
