describe('uploader.basic.js', function () {
    var $uploader, fineuploader;

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $uploader = $fixture.find("#fine-uploader");
    });

    describe('formatFileName', function () {

        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0]
            });
        });

        it('shortens a long (> 33 chars) filename', function () {
            var filename = "EWDPYZFAMDDOLNQEJXVUEWDPYZFAMDDOLN";
            var filename_fmt = fineuploader._options.formatFileName(filename);
            assert.equal(filename_fmt,
                "EWDPYZFAMDDOLNQEJXV...EWDPYZFAMDDOLN",
                "expect filename to be shortened");
        });

        it('refuses to shorten a short (<= 33 chars) filename', function () {
            var filename = "abcdefg";
            var filename_fmt = fineuploader._options.formatFileName(filename);
            assert.equal(filename_fmt,
                "abcdefg",
                "expect filename to NOT be shortened");
        });
    });

    describe('setParams', function () {

        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic({ 
                element: $uploader[0]
            });
        });

        it('resets', function () {
            var params = {"hello": "world"}
            fineuploader.setParams(params, 'foo');
            assert.deepEqual(fineuploader._paramsStore.getParams('foo'), params,
                "the request parameters should be set"); 
            fineuploader._paramsStore.reset();
            assert.deepEqual(fineuploader._paramsStore.getParams('foo'), {},
                "the request parameters should be reset");
        });

        it('set simple key-value parameters', function () {
            var params = {"hello": "world"}
            fineuploader.setParams(params);
            assert.deepEqual(fineuploader._options.request.params, params,
                "the request parameters should be set"); 
        });

        it('set nested objects as parameters', function () {
            var params = {
                "hello": {
                    "confusing": "world"
                }
            };
            fineuploader.setParams(params);
            assert.deepEqual(fineuploader._options.request.params, params,
                "the request parameters should be set"); 
        });

        it('set function return values as parameters', function () {
            var params = {
                hello_func: function () {
                    return 42;
                }
            }
            fineuploader.setParams(params);
            assert.deepEqual(fineuploader._options.request.params, params,
                "the request parameters should be set"); 
        });

        it('allows changing parameters for a specific file id', function () {
            var params = {"hello": "world"}
            fineuploader.setParams(params, 'foo');
            assert.deepEqual(fineuploader._paramsStore.getParams('foo'), params,
                "the request parameters should be set"); 

        });

        it('allows changing paramters for all files', function () {
            var params = {"hello": "world"}
            fineuploader.setParams(params);
            assert.deepEqual(fineuploader._paramsStore.getParams(), params,
                "the request parameters should be set"); 
        });

    });

    describe('setEndpoint', function () {

        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic({ 
                element: $uploader[0]
            });
        });

        it('resets', function () {
            var endpoint = '/endpoint';
            fineuploader.setEndpoint(endpoint, 'foo');
            var ep = fineuploader._endpointStore.getEndpoint('foo');
            assert.deepEqual(ep,
                endpoint,
                "the endpoint should be set"); 
            fineuploader._endpointStore.reset();
            ep = fineuploader._endpointStore.getEndpoint('foo'); 
            assert.deepEqual(ep, fineuploader._options.request.endpoint, "the endpoint should be reset");
        });

        it('set a new endpoint', function () {
            var endpoint = '/endpoint'; 
            fineuploader.setEndpoint(endpoint, 'foo');
            var ep = fineuploader._endpointStore.getEndpoint('foo');
            assert.deepEqual(ep, endpoint, "the endpoint should be set"); 
        });

    });
});
