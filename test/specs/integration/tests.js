var fs = require('fs') 
  , chai = require('chai')
  , webd = require('../webdriver') 
  , assert = chai.assert
  , expect = chai.expect;

var testFilesPath = __dirname + '/test_files/';

describe('Simple and Automatic', function () {
    this.timeout(99999999);
    var client = {};
    var uploader = {};

    beforeEach(function() {
        client = webd.makeClient('firefox'); 
        client.init();

        client.execute("uploader = new qq.FineUploader({ element: $('#fixture')[0], debug: true, request: { endpoint: '/uploads' }, callbacks: { onError: errorHandler }, deleteFile : { enabled: true, endpoint: '/uploads' }});");

        //uploader = new qq.FineUploader({
        //    element: $("#fixture")[0],
        //    debug: true,
        //    request: { 
        //        endpoint: '/uploads/'
        //    },
        //    callbacks: { 
        //        onError: errorHandler
        //    },
        //    deleteFile: {
        //        enabled: true,
        //        endpoint: '/uploads'
        //    }
        //});
    });

    it("Should be able to upload", function (done) {
        client.url("http://localhost:3000/tests/integration/simple");
        var filepath = testFilesPath + '10MB_test.img';
        client.sendKeys(".qq-upload-button > input:nth-child(2)", filepath, function (err, result) {
            expect(err).to.be.null;   

        });
    });

    afterEach(function (done) {
        client.end(done); 
    });

    after(function (done) {
        client.endAll(done); 
     });

});
