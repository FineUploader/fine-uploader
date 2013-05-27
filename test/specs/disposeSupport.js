                                                                                                                                                                                                                                                                                                                              - CORS support for uploads & delete file requests.  Essentially all other tests mentioned in this case should be run with a CORS environment a non-CORS environment.  Note that IE7 is not currently supported for upload CORS requests, and CORS delete requests are not supported in IE9 or older.  See #801 for planned support for delete requests in these browsers.  For XHR2 requests, ensure credentials ()), firefoxClient = require('../test-server.js').firefoxClient();


// DisposeSupport
describe('DisposeSupport', function () {

    before(function () {
        firefoxClient.init() 
        firefoxClient.url("http://localhost:3000/test/fixtures/dispose.html");
    });
    
});

