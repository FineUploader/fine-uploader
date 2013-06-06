## FineUploader test suite

### What's in here?

##### Tests

Currently only unit test are in full working order. They can be found in the `unit/` directory, and run by issuing the command:
    
    % make test 
    
This will automagically build, lint, and run the source code and unit tests, including starting and stopping a test server for handling uploads.

To continuously integrate, issue `make watch` and whenever the source changes the Makefile will rebuild/lint. Whenever the tests change, the Makefile will lint.              
        
##### Directories

* `bin/` contains binaries for running tests and test servers from the command line
    * `runner.js` is the phantoms test runner which provides functionality to output console.log messages to the terminal, among other things.
    * `server.js` is a  Node.js test server providing all the functionality one would expect of a FineUploader server. Currently, it can handle only uploads and deletes.
    * `watcher` contains definitions for the `make watch` task
    * `webdriver.js` contains utilities for running Selenium webdriver tests
* `integration/` contains Selenium integration tests
* `static/` contains static files (js, css) used as a part of testing
* `unit/` contains unit tests; run via QUnit
* `uploads/` is where mock uploads are sent
* `vendor/` is for vendor modules (jQuery, etc.)

##### Files

* `index.html` is the primary unit test runner
* `raytest.html` is for manual functional testing for non-jQuery FineUploader
* `raytest-jquery.html` is for manual functional test for jQuery FineUploader
* `styles.css` used in the raytests
* `uploader-demo.js` used in raytests
* `uploader-demo-jquery-js` used in ray tests