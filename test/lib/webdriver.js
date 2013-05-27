exports.webdriver = function() {
    return {
        phantomjs: require('webdriverjs').remote({
            desiredCapabilities: {
                browserName: "phantomjs",
            },
            logLevel: 'silent"'
    });

});
