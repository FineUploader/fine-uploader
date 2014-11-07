/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl, Q */
describe("uploader.basic.api.js", function () {
    "use strict";

    var $uploader, fineuploader;

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $uploader = $fixture.find("#fine-uploader");
    });

    it("resets multiple buttons to their original states", function () {
        var $btn1 = $fixture.appendTo("<div></div>"),
            $btn2 = $fixture.appendTo("<div></div>"),
            i, button;

        var fineuploader = new qq.FineUploaderBasic({
            element: $uploader[0],
            extraButtons: [
                {
                    element: $btn1[0],
                    multiple: false,
                    accept: ""
                },
                {
                    element: $btn2[0],
                    multiple: false,
                    accept: ""
                }
            ]
        });

        for (i = 0; i < fineuploader._buttons.length - 1; i++) {
            button = fineuploader._buttons[i];
            button.setMultiple(true);
            button.setAcceptFiles("audio/*");
        }

        fineuploader.reset();

        if (qq.supportedFeatures.ajaxUploading) {
            for (i = 0; i < fineuploader._buttons.length - 1; i++) {
                var input = button.getInput();
                button = fineuploader._buttons[i];
                assert.ok(!input.hasAttribute("multiple"));
                assert.ok(!input.hasAttribute("accept"));
            }
        }
    });

    describe("formatFileName", function () {

        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0]
            });
        });

        it("shortens a long (> 33 chars) filename", function () {
            var filename = "EWDPYZFAMDDOLNQEJXVUEWDPYZFAMDDOLN";
            var filename_fmt = fineuploader._options.formatFileName(filename);
            assert.equal(filename_fmt,
                "EWDPYZFAMDDOLNQEJXV...EWDPYZFAMDDOLN",
                "expect filename to be shortened");
        });

        it("refuses to shorten a short (<= 33 chars) filename", function () {
            var filename = "abcdefg";
            var filename_fmt = fineuploader._options.formatFileName(filename);
            assert.equal(filename_fmt,
                "abcdefg",
                "expect filename to NOT be shortened");
        });
    });

    describe("setParams", function () {

        beforeEach(function () {
            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0]
            });
        });

        it("resets", function () {
            var params = {"hello": "world"};
            fineuploader.setParams(params, "foo");
            assert.deepEqual(fineuploader._paramsStore.get("foo"), params,
                "the request parameters should be set");
            fineuploader._paramsStore.reset();
            assert.deepEqual(fineuploader._paramsStore.get("foo"), {},
                "the request parameters should be reset");
        });

        it("allows changing parameters for a specific file id", function () {
            var params = {"hello": "world"};
            fineuploader.setParams(params, "foo");
            assert.deepEqual(fineuploader._paramsStore.get("foo"), params,
                "the request parameters should be set");

        });

        it("allows changing paramters for all files", function () {
            var params = {"hello": "world"};
            fineuploader.setParams(params);
            assert.deepEqual(fineuploader._paramsStore.get(), params,
                "the request parameters should be set");
        });

    });

    describe("setEndpoint", function () {
        var defaultEndpoint = "a/b/c";

        beforeEach(function () {

            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0],
                request: {
                    endpoint: defaultEndpoint
                }
            });
        });

        it("resets", function () {
            var endpoint = "/endpoint";
            fineuploader.setEndpoint(endpoint, 0);
            var ep = fineuploader._endpointStore.get(0);
            assert.deepEqual(ep,
                endpoint,
                "the endpoint should be set");
            fineuploader._endpointStore.reset();
            ep = fineuploader._endpointStore.get(0);
            assert.deepEqual(ep, fineuploader._options.request.endpoint, "the endpoint should be reset");
        });

        it("set a new endpoint", function () {
            var endpoint = "/endpoint";
            fineuploader.setEndpoint(endpoint, 0);
            var ep = fineuploader._endpointStore.get(0);

            assert.deepEqual(ep, endpoint, "the endpoint should be set");

            qq.each(fineuploader._extraButtonSpecs, function(id, spec) {
                assert.equal(spec.endpoint, defaultEndpoint, "endpoint for extra button was changed unexpectedly!");
            });
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

        describe("handles successful promissory callbacks", function() {
            function runTest(callback, done) {
                var spec = {
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

                fineuploader._handleCheckedCallback(spec);
            }

            it ("qq.Promise", function(done) {
                var callback = function() {
                        var promise = new qq.Promise();

                        setTimeout(function() {
                            promise.success("foobar");
                        }, 100);

                        return promise;
                    };

                runTest(callback, done);
            });

            it ("Q.js", function(done) {
                var callback = function() {
                        return Q.Promise(function(resolve) {
                            setTimeout(function() {
                                resolve("foobar");
                            }, 100);
                        });
                    };

                runTest(callback, done);
            });
        });

        describe("handles failed promissory callbacks", function() {
            function runTest(callback, done) {
                var spec = {
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
            }

            it ("qq.Promise", function(done) {
                var callback = function() {
                        var promise = new qq.Promise();

                        setTimeout(function() {
                            promise.failure();
                        }, 100);

                        return promise;
                    };

                runTest(callback, done);
            });

            it ("Q.js", function(done) {
                var callback = function() {
                    return Q.Promise(function (resolve, reject) {
                        setTimeout(function () {
                            reject();
                        }, 100);
                    });
                };

                runTest(callback, done);
            });
        });

        it("does auto retry if upload is not paused", function() {
            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0],
                retry: {
                    enableAuto: true
                }
            });

            fineuploader._uploadData = {
                retrieve: function() {
                    return {
                        status: qq.status.UPLOADING
                    };
                }
            };

            assert.ok(fineuploader._shouldAutoRetry(0));
        });

        it("does not auto retry if upload is paused", function() {
            fineuploader = new qq.FineUploaderBasic({
                element: $uploader[0],
                retry: {
                    enableAuto: true
                }
            });

            fineuploader._uploadData = {
                retrieve: function() {
                    return {
                        status: qq.status.PAUSED
                    };
                }
            };

            assert.ok(!fineuploader._shouldAutoRetry(0));
        });
    });

    describe("getRemainingAllowedItems", function() {
        var uploader;

        function setupUploader(allowedItems) {
            uploader = new qq.FineUploaderBasic({
                validation: {
                    itemLimit: allowedItems
                }
            });
        }

        it("reports the correct number of remaining allowed items w/out item limit", function() {
            setupUploader(0);
            uploader._netUploadedOrQueued = 3;

            assert.equal(uploader.getRemainingAllowedItems(), null);
        });

        it("reports the correct number of remaining items w/ an item limit", function() {
            setupUploader(3);
            uploader._netUploadedOrQueued = 2;

            assert.equal(uploader.getRemainingAllowedItems(), 1);
        });

        it("allows the itemLimit to be adjusted via the API", function() {
            setupUploader(3);
            uploader._netUploadedOrQueued = 2;

            uploader.setItemLimit(5);

            assert.equal(uploader.getRemainingAllowedItems(), 3);
        });
    });

    describe("_createStore", function() {
        var uploader = new qq.FineUploaderBasic({});

        it("handles non-object stores properly", function() {
            var initVal = "foo",
                store = uploader._createStore(initVal);

            assert.equal(store.get(100), initVal);
            assert.equal(store.get(), initVal);

            store.set("bar", 2);
            store.set("three", 3);
            assert.equal(store.get(2), "bar");
            assert.equal(store.get(3), "three");
            assert.equal(store.get(100), initVal);
            assert.equal(store.get(), initVal);

            store.remove(3);
            assert.equal(store.get(2), "bar");
            assert.equal(store.get(3), initVal);
            assert.equal(store.get(100), initVal);
            assert.equal(store.get(), initVal);

            store.set("foobar");
            assert.equal(store.get(2), "foobar");
            assert.equal(store.get(3), "foobar");
            assert.equal(store.get(100), "foobar");
            assert.equal(store.get(), "foobar");

            store.reset();
            assert.equal(store.get(2), initVal);
            assert.equal(store.get(3), initVal);
            assert.equal(store.get(100), initVal);
            assert.equal(store.get(), initVal);
        });

        it("handles object stores properly", function() {
            var initVal = {foo: "bar"},
                a = {a: "a"},
                two = {two: "two"},
                three = {three: "three"},
                store = uploader._createStore(initVal);

            assert.deepEqual(store.get(100), initVal);
            assert.deepEqual(store.get(), initVal);

            store.set(two, 2);
            store.set(three, 3);
            assert.deepEqual(store.get(2), two);
            assert.deepEqual(store.get(3), three);
            assert.deepEqual(store.get(100), initVal);
            assert.deepEqual(store.get(), initVal);

            three.test = "123";
            assert.notDeepEqual(store.get(3), three);

            store.remove(3);
            assert.deepEqual(store.get(2), two);
            assert.deepEqual(store.get(3), initVal);
            assert.deepEqual(store.get(100), initVal);
            assert.deepEqual(store.get(), initVal);

            store.set(a);
            assert.deepEqual(store.get(2), a);
            assert.deepEqual(store.get(3), a);
            assert.deepEqual(store.get(100), a);
            assert.deepEqual(store.get(), a);

            a.test = "123";
            assert.notDeepEqual(store.get(2), a);

            store.reset();
            assert.deepEqual(store.get(2), initVal);
            assert.deepEqual(store.get(3), initVal);
            assert.deepEqual(store.get(100), initVal);
            assert.deepEqual(store.get(), initVal);
        });
    });

    describe("_handleNewFile", function() {
        it("ignores size property if passing a file input", function() {
            var uploader = new qq.FineUploaderBasic({}),
                fileInput = document.createElement("input");

            uploader._customNewFileHandler = function(actualFile, name, uuid, size) {
                assert.equal(size, -1);
            };

            fileInput.type = "file";

            uploader._handleNewFile(fileInput, 0, []);
        });
    });
});
