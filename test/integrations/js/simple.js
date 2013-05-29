assert = chai.assert,
expect = chai.expect;

console.log('here!');
describe("Fine Uploader - Simple and Automatic", function () {
    
    var uploader;

    var errorHandler = function (event, id, filename, reason) {
        qq.log("id: " + id + ", filname: " + filename + ", reason: " + reason); 
    };

    beforeEach(function () {       
        uploader = new qq.FineUploader({
            element: $("#fixture")[0],
            debug: true,
            request: {
                endpoint: '/uploads'
            },
            callbacks: {
                onError: errorHandler
            },
            deleteFile: {
                    enabled: true,
                    endpoint: '/uploads'
            }
        });
    });

    it('should run this test', function () {
        assert(true)  
    });

    it('should also run this test', function () {
        assert.isFalse(false);
    });


});
