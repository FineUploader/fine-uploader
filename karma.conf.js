// Karma configuration
// Generated on Sun May 26 2013 23:04:51 GMT-0500 (CDT)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  MOCHA,
  MOCHA_ADAPTER,
  './test/vendor/*.js',
  './client/js/header.js',
  './client/js/util.js',
  './client/js/version.js',
  './client/js/features.js',
  './client/js/promise.js',
  './client/js/button.js',
  './client/js/paste.js',
  './client/js/upload-data.js',
  './client/js/uploader.basic.js',
  './client/js/dnd.js',
  './client/js/uploader.js',
  './client/js/ajax.requester.js',
  './client/js/deletefile.ajax.requester.js',
  './client/js/window.receive.message.js',
  './client/js/handler.base.js',
  './client/js/handler.form.js',
  './client/js/handler.xhr.js',
  //'./fine-uploader/js/**/*.js',
  //'./test/specs/*.js',
  './test/units/*.js',
  //'./test/fixtures/*.html'
];

preprocessors = {
  'client/js/**/*.js': 'coverage'
};

// list of files to exclude
exclude = [
  
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['dots', 'coverage'];
coverageReporter = {
  type : 'html',
  dir : './test/coverage/'
}

// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Firefox', 'PhantomJS', 'Chrome'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;
