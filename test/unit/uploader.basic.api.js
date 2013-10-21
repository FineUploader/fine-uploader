describe('uploader.basic.api.js', function () {
    var $uploader, fineuploader;

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $uploader = $fixture.find("#fine-uploader");
    });

    it('resets multiple buttons to their original states', function () {
        var $btn1 = $fixture.appendTo("<div></div>"),
            $btn2 = $fixture.appendTo("<div></div>")

        var fineuploader = new qq.FineUploaderBasic({
            element: $uploader[0],
            extraButtons: [
                {
                    element: $btn1[0],
                    multiple: false,
                    accept: ''
                },
                {
                    element: $btn2[0],
                    multiple: false,
                    accept: ''
                }
            ]
        });

        for (var i = 0; i < fineuploader._buttons.length - 1; i++) {
            var button = fineuploader._buttons[i];
            button.setMultiple(true);
            button.setAcceptFiles('audio/*');
        }

        fineuploader.reset();

        if (qq.supportedFeatures.ajaxUploading) {
            for (var i = 0; i < fineuploader._buttons.length - 1; i++) {
                var button = fineuploader._buttons[i],
                    input = button.getInput();
                assert.ok(!input.hasAttribute('multiple'));
                assert.ok(!input.hasAttribute('accept'));
            }
        }
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
        var defaultEndpoint = "a/b/c";

        beforeEach(function () {

            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0],
                request: {
                    endpoint: defaultEndpoint
                }
            });
        });

        it('resets', function () {
            var endpoint = '/endpoint';
            fineuploader.setEndpoint(endpoint, 0);
            var ep = fineuploader._endpointStore.getEndpoint(0);
            assert.deepEqual(ep,
                endpoint,
                "the endpoint should be set");
            fineuploader._endpointStore.reset();
            ep = fineuploader._endpointStore.getEndpoint(0);
            assert.deepEqual(ep, fineuploader._options.request.endpoint, "the endpoint should be reset");
        });

        it('set a new endpoint', function () {
            var endpoint = '/endpoint';
            fineuploader.setEndpoint(endpoint, 0);
            var ep = fineuploader._endpointStore.getEndpoint(0);

            assert.deepEqual(ep, endpoint, "the endpoint should be set");

            qq.each(fineuploader._extraButtonSpecs, function(id, spec) {
                assert.equal(spec.endpoint, defaultEndpoint, "endpoint for extra button was changed unexpectedly!");
            })
        });
    });

    describe("_isAllowedExtension", function() {
        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic();
        });

        it("allows files if no restrictions are in place", function() {
            var allowedExtensions = [];

            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "foo.bar"));
            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "foo.bar.bat"));
            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "foo"));
        });

        it("doesn't choke if allowed extensions are not valid (i.e. not strings)", function() {
            var allowedExtensions = [{}];

            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "foo.bar"));
            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "foo.bar.bat"));
            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "foo"));
        });

        it("only allows valid extensions", function() {
            var allowedExtensions = ["bar", "exe", "png"];

            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "foo.bar"));
            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "foo.fee.exe"));
            assert.ok(fineuploader._isAllowedExtension(allowedExtensions, "png.png"));
            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "foo.bar.bat"));
            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "foo"));
            assert.ok(!fineuploader._isAllowedExtension(allowedExtensions, "png"));
        });
    });

    describe("_handleCheckedCallback", function() {
        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic();
        });

        it("handles successful non-promissory callbacks (undefined return value)", function() {
            var callback = function() {},
                spec = {
                    callback: callback,
                    onSuccess: function(callbackRetVal) {
                        assert.deepEqual(callbackRetVal, undefined);
                    },
                    onFailure: function() {
                        assert.failure();
                    }
                };

            fineuploader._handleCheckedCallback(spec);
        });

        it("handles successful non-promissory callbacks (defined return value)", function() {
            var callback = function() {
                    return "foobar";
                },
                spec = {
                    callback: callback,
                    onSuccess: function(callbackRetVal) {
                        assert.deepEqual(callbackRetVal, "foobar");
                    }
                };

            assert.deepEqual(fineuploader._handleCheckedCallback(spec), "foobar");
        });

        it("handles failed non-promissory callbacks (defined onFailure)", function(done) {
            var callback = function() {
                    return false;
                },
                spec = {
                    callback: callback,
                    onSuccess: function() {
                        assert.fail();
                        done();
                    },
                    onFailure: function() {
                        done();
                    }
                };

            fineuploader._handleCheckedCallback(spec);
        });

        it("handles failed non-promissory callbacks (undefined onFailure)", function(done) {
            var callback = function() {
                    return false;
                },
                spec = {
                    callback: callback,
                    onSuccess: function() {
                        assert.fail();
                    }
                };

            fineuploader._handleCheckedCallback(spec);
            done();
        });

        it ("handles successful promissory callbacks", function(done) {
            var callback = function() {
                    var promise = new qq.Promise();

                    setTimeout(function() {
                        promise.success("foobar");
                    }, 100);

                    return promise;
                },
                spec = {
                    callback: callback,
                    onSuccess: function(passedVal) {
                        assert.deepEqual(passedVal, "foobar");
                        done();
                    },
                    onFailure: function() {
                        assert.fail();
                        done();
                    }
                };

                assert.ok(qq.isPromise(fineuploader._handleCheckedCallback(spec)));
        });

        it ("handles failed promissory callbacks", function(done) {
            var callback = function() {
                    var promise = new qq.Promise();

                    setTimeout(function() {
                        promise.failure();
                    }, 100);

                    return promise;
                },
                spec = {
                    callback: callback,
                    onSuccess: function() {
                        assert.fail();
                        done();
                    },
                    onFailure: function() {
                        done();
                    }
                };

            assert.ok(qq.isPromise(fineuploader._handleCheckedCallback(spec)));
        });
    });

});
