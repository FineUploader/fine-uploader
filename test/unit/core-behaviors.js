if (qqtest.canDownloadFileAsBlob) {
    describe("expected upload behavior tests - core uploader", function() {
        var oldWrapCallbacks,
            testImgKey = "up.jpg",
            testImgType = "image/jpeg",
            testBlob;

        before(function() {
            oldWrapCallbacks = qq.FineUploaderBasic.prototype._wrapCallbacks;

            // "Turn off" wrapping of callbacks that squelches errors.  We need AssertionErrors in callbacks to bubble.
            qq.FineUploaderBasic.prototype._wrapCallbacks = function() {};
        });

        after(function() {
            qq.FineUploaderBasic.prototype._wrapCallbacks = oldWrapCallbacks;
        });

        function maybeDownloadFile() {
            var downloadAsync = new qq.Promise();

            if (testBlob) {
                downloadAsync.success(testBlob);
            }
            else {
                qqtest.downloadFileAsBlob(testImgKey, testImgType).then(function(blob) {
                    testBlob = blob;
                    downloadAsync.success(testBlob);
                },
                function() {
                    assert.fail(null, null, "Failed to download test file!");
                    downloadAsync.failure();
                });
            }

            return downloadAsync;
        }


        it("handles a simple blob submission correctly (autoUpload = false)", function(done) {
            var uploader = new qq.FineUploaderBasic({
                autoUpload: false,
                callbacks: {
                    onSubmit: function(id, name) {
                        callbackOrder.push("submit");
                        assert.equal(id, 0);
                        assert.equal(name, expectedName);
                    },
                    onSubmitted: function(id, name) {
                        callbackOrder.push("submitted");
                        assert.equal(id, 0);
                        assert.equal(name, expectedName);
                    },
                    onValidate: function(blobData) {
                        callbackOrder.push("validate");
                        assert.equal(blobData.name, expectedName);
                        assert.equal(blobData.size, expectedFileSize);
                    },
                    onValidateBatch: function(blobDataArray) {
                        callbackOrder.push("validateBatch");
                        assert.equal(blobDataArray.length, 1);
                        assert.equal(blobDataArray[0].name, expectedName);
                        assert.equal(blobDataArray[0].size, expectedFileSize);
                    },
                    onStatusChange: function(id, oldStatus, newStatus) {
                        assert.equal(id, 0);
                        statusChangeOrder.push(newStatus);
                    }
                }
            }),
                callbackOrder = [],
                statusChangeOrder = [],
                expectedFileSize = 3266,
                expectedName = "testname",
                expectedCallbackOrder = ["validateBatch", "validate", "submit", "submitted"],
                expectedStatusChangeOrder = [qq.status.SUBMITTING, qq.status.SUBMITTED];

            maybeDownloadFile(done).then(function(blob) {
                uploader.addBlobs({blob: blob, name: expectedName});

                assert.deepEqual(callbackOrder, expectedCallbackOrder, "Callbacks invoked in wrong order");
                assert.deepEqual(statusChangeOrder, expectedStatusChangeOrder, "Status changed in wrong order");
                assert.equal(uploader.getName(0), expectedName, "Wrong filename");
                assert.equal(uploader.getNetUploads(), 0, "Wrong # of net uploads");
                assert.equal(uploader.getSize(0), expectedFileSize, "Wrong file size");
                assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                assert.equal(uploader.getUploads({id: 0}).name, expectedName, "Wrong filename");
                assert.equal(uploader.getUploads({id: 0}).originalName, expectedName, "Wrong original name");
                assert.equal(uploader.getUploads({id: 0}).size, expectedFileSize, "Wrong file size");
                assert.equal(uploader.getUploads({id: 0}).status, qq.status.SUBMITTED, "Wrong status");

                done();
            });
        });

        describe("file rejection via callback", function() {
            function setupUploader(callback, blob, done) {
                var uploader = new qq.FineUploaderBasic({
                    autoUpload: false,
                    callbacks: (function() {
                        var callbacks = {},
                            callbackName = "on" + callback.charAt(0).toUpperCase() + callback.substr(1);

                        if (done) {
                            callbacks[callbackName] = function() {
                                var promise = new qq.Promise();
                                setTimeout(function() {
                                    promise.failure();
                                },100);
                                return promise;
                            };

                            callbacks.onStatusChange = function(id, oldStatus, newStatus) {
                                if (newStatus === qq.status.REJECTED) {
                                    assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                                    assert.equal(uploader.getUploads({id: 0}).status, qq.status.REJECTED, "Wrong status");

                                    done();
                                }
                            };
                        }
                        else {
                            callbacks[callbackName] = function() {
                                return false;
                            };
                        }

                        return callbacks;
                    }())
                });

                uploader.addBlobs(blob);

                return uploader;
            }

            it("Ignores a submitted file that is rejected by returning false in a submit callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    var uploader = setupUploader("submit", blob);

                    assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                    assert.equal(uploader.getUploads({id: 0}).status, qq.status.REJECTED, "Wrong status");

                    done();
                });
            });

            it("Ignores a submitted file that is rejected by returning a promise and failing it in a submit callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    setupUploader("submit", blob, done);
                });
            });

            // Skip until #1059 is addresssed
            it.skip("Ignores a submitted file that is rejected by returning false in a validate callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    var uploader = setupUploader("validate", blob);

                    assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                    assert.equal(uploader.getUploads({id: 0}).status, qq.status.REJECTED, "Wrong status");

                    done();
                });
            });

            // Skip until #1059 is addresssed
            it.skip("Ignores a submitted file that is rejected by returning a promise and failing it in a validate callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    setupUploader("validate", blob, done);
                });
            });

            // Skip until #1059 is addresssed
            it.skip("Ignores a submitted file that is rejected by returning false in a validateBatch callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    var uploader = setupUploader("validateBatch", blob);

                    assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                    assert.equal(uploader.getUploads({id: 0}).status, qq.status.REJECTED, "Wrong status");

                    done();
                });
            });

            // Skip until #1059 is addresssed
            it.skip("Ignores a submitted file that is rejected by returning a promise and failing it in a validateBatch callback", function(done) {
                maybeDownloadFile().then(function(blob) {
                    setupUploader("validateBatch", blob, done);
                });
            });
        });

        describe("file rejection via internal validation", function() {
            function setupUploader(limits, numBlobs, statusChangeLogic) {
                var uploader = new qq.FineUploaderBasic({
                    autoUpload: false,
                    validation: limits,
                    callbacks: {
                        onStatusChange: function() {
                            statusChangeLogic.apply(uploader, arguments);
                        }
                    }
                });

                maybeDownloadFile().then(function(blob) {
                    numBlobs = [].concat(numBlobs);
                    qq.each(numBlobs, function(idx, num) {
                        var blobs = [],
                            i;

                        for (i = 0; i < num; i++) {
                            blobs.push(blob);
                        }

                        uploader.addBlobs(blobs);
                    });
                });
            }

            // Skip until #1059 is addresssed
            it.skip("prevents too many items from being submitted at once", function(done) {
                var rejectedFiles = 0;

                setupUploader({itemLimit: 2}, 2, function(id, oldStatus, newStatus) {
                    newStatus === qq.status.REJECTED && rejectedFiles++;

                    if (rejectedFiles === 3) {
                        assert.equal(this.getUploads().length, 3);
                        assert.equal(this.getUploads({status: qq.status.REJECTED}).length, 3);
                        done();
                    }
                });
            });

            // Skip until #1059 is addresssed
            it.skip("prevents too many items from being submitted over multiple submissions", function(done) {
                setupUploader({itemLimit: 2}, [2, 1], function(id, oldStatus, newStatus) {
                    if (newStatus === qq.status.REJECTED) {
                        assert.equal(this.getUploads().length, 3);
                        assert.equal(this.getUploads({status: qq.status.SUBMITTED}).length, 2);
                        assert.equal(this.getUploads({status: qq.status.REJECTED}).length, 1);
                        done();
                    }
                });
            });

            // Skip until #1059 is addresssed
            it.skip("prevents files that are too large from being submitted", function(done) {
                setupUploader({sizeLimit: 3265}, 1, function(id, oldStatus, newStatus) {
                    if (newStatus === qq.status.REJECTED) {
                        assert.equal(this.getUploads().length, 1);
                        assert.equal(this.getUploads({status: qq.status.REJECTED}).length, 1);
                        done();
                    }
                });
            });

            it("allow files that are not too large to be submitted", function(done) {
                setupUploader({sizeLimit: 3266}, 1, function(id, oldStatus, newStatus) {
                    if (newStatus === qq.status.SUBMITTED) {
                        assert.equal(this.getUploads().length, 1);
                        assert.equal(this.getUploads({status: qq.status.SUBMITTED}).length, 1);
                        done();
                    }
                });
            });

            // Skip until #1059 is addresssed
            it.skip("don't allow files that are too small to be submitted", function(done) {
                setupUploader({minSizeLimit: 3267}, 1, function(id, oldStatus, newStatus) {
                    if (newStatus === qq.status.REJECTED) {
                        assert.equal(this.getUploads().length, 1);
                        assert.equal(this.getUploads({status: qq.status.REJECTED}).length, 1);
                        done();
                    }
                });
            });

            it("allow files that are not too small to be submitted", function(done) {
                setupUploader({minSizeLimit: 3266}, 1, function(id, oldStatus, newStatus) {
                    if (newStatus === qq.status.SUBMITTED) {
                        assert.equal(this.getUploads().length, 1);
                        assert.equal(this.getUploads({status: qq.status.SUBMITTED}).length, 1);
                        done();
                    }
                });
            });

            describe("stopOnFirstInvalidFile tests", function() {
                function setupStopOnFirstInvalidFileUploader(stopOnFirstInvalidFile) {
                    var expectedSubmitted = stopOnFirstInvalidFile ? 1 : 2,
                        expectedRejected = stopOnFirstInvalidFile ? 2 : 1,
                        uploader = new qq.FineUploaderBasic({
                        autoUpload: false,
                        validation: {
                            sizeLimit: 3266,
                            stopOnFirstInvalidFile: stopOnFirstInvalidFile
                        },
                        callbacks: {
                            onStatusChange: function(id, oldStatus, newStatus) {
                                if (uploader.getUploads({status: qq.status.SUBMITTED}).length === expectedSubmitted &&
                                    uploader.getUploads({status: qq.status.REJECTED}).length === expectedRejected) {

                                    assert.ok(true);
                                    done();
                                }
                            }
                        }
                    });

                    maybeDownloadFile().then(function(blob1) {
                        qqtest.downloadFileAsBlob("down.jpg", "image/jpeg").then(function(blob2) {
                            uploader.addBlobs([blob1, blob2, blob1]);
                        });
                    });
                }

                // Skip until #1059 is addresssed
                it.skip("Rejects all files after (and including) the invalid file by default", function(done) {
                    setupStopOnFirstInvalidFileUploader(true);
                });

                // Skip until #1059 is addresssed
                it.skip("Rejects only files that are invalid", function(done) {
                    setupStopOnFirstInvalidFileUploader(false);
                });
            });
        });
    });
}
