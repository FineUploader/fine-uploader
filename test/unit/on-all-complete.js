/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("onAllComplete callback tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            runSingleUploadTest = function(autoUpload, success, done) {
                assert.expect(4, done);

                var callbackOrder = [],
                    uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    autoUpload: autoUpload,
                    callbacks: {
                        onComplete: function() {
                            callbackOrder.push("complete");
                        },
                        onAllComplete: function(succeeded, failed) {
                            callbackOrder.push("allComplete");

                            if (success) {
                                assert.equal(succeeded.length, 1);
                                assert.equal(succeeded[0], 0);
                                assert.equal(failed.length, 0);
                            }
                            else {
                                assert.equal(failed.length, 1);
                                assert.equal(failed[0], 0);
                                assert.equal(succeeded.length, 0);
                            }

                            assert.deepEqual(callbackOrder, ["complete", "allComplete"]);
                        }
                    }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addBlobs(blob);
                    !autoUpload && uploader.uploadStoredFiles();

                    if (success) {
                        fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                    }
                    else {
                        fileTestHelper.getRequests()[0].respond(400, null, null);
                    }
                });
            },
            runMultipleUploadTest = function(success, done) {
                assert.expect(5, done);

                var callbackOrder = [],
                    uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    callbacks: {
                        onComplete: function() {
                            callbackOrder.push("complete");
                        },
                        onUpload: function(id) {
                            if (success) {
                                setTimeout(function() {
                                    fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                                }, 0);
                            }
                            else {
                                setTimeout(function() {
                                    fileTestHelper.getRequests()[id].respond(400, null, null);
                                }, 0);
                            }
                        },
                        onAllComplete: function(succeeded, failed) {
                            callbackOrder.push("allComplete");

                            if (success) {
                                assert.equal(succeeded.length, 2);
                                assert.equal(succeeded[0], 0);
                                assert.equal(succeeded[1], 1);
                                assert.equal(failed.length, 0);
                            }
                            else {
                                assert.equal(failed.length, 2);
                                assert.equal(failed[0], 0);
                                assert.equal(failed[1], 1);
                                assert.equal(succeeded.length, 0);
                            }

                            assert.deepEqual(callbackOrder, ["complete", "complete", "allComplete"]);
                        }
                    }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addBlobs([blob, blob]);
                });
            };


        it("calls onAllComplete after a single file is submitted & completed - manual upload", function(done) {
            runSingleUploadTest(false, true, done);
        });

        it("calls onAllComplete after a single file is submitted & completed (failed) - manual upload", function(done) {
            runSingleUploadTest(false, false, done);
        });

        it("calls onAllComplete after a single file is submitted & completed - auto upload", function(done) {
            runSingleUploadTest(true, true, done);
        });

        it("calls onAllComplete after a single file is submitted & completed (failed) - auto upload", function(done) {
            runSingleUploadTest(true, false, done);
        });

        it("does not call onAllComplete after a single file is submitted and canceled", function(done) {
            assert.expect(1, done);

            var callbackOrder = [],
                uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                autoUpload: false,
                callbacks: {
                    onCancel: function() {
                        callbackOrder.push("cancel");
                    },
                    onAllComplete: function() {
                        assert.fail(null, null, "onAllComplete should not have been called");
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs(blob);
                uploader.cancel(0);

                setTimeout(function() {
                    assert.deepEqual(callbackOrder, ["cancel"]);
                }, 0);
            });
        });

        it("calls onAllComplete after multiple files are submitted & completed (all succeeded)", function(done) {
            runMultipleUploadTest(true, done);
        });

        it("calls onAllComplete after multiple files are submitted & completed (all failed)", function(done) {
            runMultipleUploadTest(false, done);
        });

        it("calls onAllComplete after multiple files are submitted & completed (1 succeeded, 1 failed)", function(done) {
            assert.expect(5, done);

            var failId = 1,
                callbackOrder = [],
                uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                callbacks: {
                    onComplete: function() {
                        callbackOrder.push("complete");
                    },
                    onUpload: function(id) {
                        if (id === failId) {
                            setTimeout(function() {
                                fileTestHelper.getRequests()[id].respond(400, null, null);
                            }, 0);
                        }
                        else {
                            setTimeout(function() {
                                fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                            }, 0);
                        }
                    },
                    onAllComplete: function(succeeded, failed) {
                        callbackOrder.push("allComplete");

                        assert.equal(succeeded.length, 1);
                        assert.equal(succeeded[0], 0);
                        assert.equal(failed.length, 1);
                        assert.equal(failed[0], failId);

                        assert.deepEqual(callbackOrder, ["complete", "complete", "allComplete"]);
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs([blob, blob]);
            });
        });

        it("calls onAllComplete after multiple files are submitted (1 succeeded, 1 rejected)", function(done) {
            assert.expect(4, done);

            var cancelId = 1,
                callbackOrder = [],
                uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                callbacks: {
                    onComplete: function() {
                        callbackOrder.push("complete");
                    },
                    onSubmit: function(id) {
                        return id !== cancelId;
                    },
                    onUpload: function(id) {
                        setTimeout(function() {
                            fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                        }, 0);
                    },
                    onAllComplete: function(succeeded, failed) {
                        callbackOrder.push("allComplete");

                        assert.equal(succeeded.length, 1);
                        assert.equal(succeeded[0], 0);
                        assert.equal(failed.length, 0);

                        assert.deepEqual(callbackOrder, ["complete", "allComplete"]);
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs([blob, blob]);
            });
        });

        it("does not call onAllComplete after multiple files are submitted (all rejected)", function(done) {
            assert.expect(1, done);

            var callbackOrder = [],
                uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                callbacks: {
                    onSubmit: function() {
                        callbackOrder.push("submit");
                        return false;
                    },
                    onAllComplete: function(succeeded, failed) {
                        assert.fail(null, null, "onAllComplete should not have been called");
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs([blob, blob]);

                setTimeout(function() {
                    assert.deepEqual(callbackOrder, ["submit", "submit"]);
                }, 0);
            });
        });

        it("calls onComplete correctly after for each batch of files", function(done) {
            assert.expect(10, done);

            var uploadCount = 0,
                callbackOrder = [],
                uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                callbacks: {
                    onComplete: function() {
                        callbackOrder.push("complete");
                    },
                    onUpload: function(id) {
                        setTimeout(function() {
                            fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                        }, 0);
                    },
                    onAllComplete: function(succeeded, failed) {
                        callbackOrder.push("allComplete");

                        assert.equal(succeeded.length, 2);
                        assert.equal(succeeded[0], uploadCount);
                        assert.equal(succeeded[1], uploadCount + 1);
                        assert.equal(failed.length, 0);

                        assert.deepEqual(callbackOrder, ["complete", "complete", "allComplete"]);

                        if (uploadCount < 2) {
                            uploadCount+=2;
                            setTimeout(uploadFiles, 0);
                        }
                    }
                }
            }),
                uploadFiles = function() {
                    callbackOrder = [];
                    uploader.addBlobs([blobToUpload, blobToUpload]);
                },
                blobToUpload;


            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                blobToUpload = blob;

                fileTestHelper.mockXhr();
                uploadFiles();
            });
        });
    });
}
