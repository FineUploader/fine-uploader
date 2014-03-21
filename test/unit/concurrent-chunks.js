/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("concurrent chunked uploads", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            expectedFileSize = 3266,
            expectedChunks = 3,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            acknowledgeRequests = function() {
                setTimeout(function() {
                    qq.each(fileTestHelper.getRequests(), function(idx, req) {
                        if (!req.ack) {
                            req.ack = true;
                            req.respond(200, null, JSON.stringify({success: true}));
                        }
                    });
                }, 10);
            };

        it("Make sure only `maxConnections` chunks are sent at once", function(done) {
            assert.expect(1, done);

            var chunksStarted = 0,
                actualUploadsPerGroup = [0],
                expectedUploadPerGroup = [2, 1],
                uploader = new qq.FineUploaderBasic({
                    maxConnections: 2,
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize,
                        concurrent: {
                            enabled: true
                        }
                    },
                    callbacks: {
                        onUploadChunk: function() {
                            actualUploadsPerGroup[actualUploadsPerGroup.length-1] += 1;
                            chunksStarted++;
                            acknowledgeRequests();
                        },
                        onUploadChunkSuccess: function(id, chunkData) {
                            chunksStarted < expectedChunks && actualUploadsPerGroup.push(0);
                        },
                        onAllComplete: function(succeeded, failed) {
                            assert.deepEqual(actualUploadsPerGroup, expectedUploadPerGroup);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs({name: "test", blob: blob});
            });
        });

        it("Cancel terminates all in-progress requests", function(done) {
            assert.expect(2, done);

            var chunksInProgress = 0,
                xhrsAborted = 0,
                cancelCalled = false,
                uploader = new qq.FineUploaderBasic({
                    debug: true,
                    maxConnections: 3,
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize,
                        concurrent: {
                            enabled: true
                        }
                    },
                    callbacks: {
                        onUploadChunk: function() {
                            chunksInProgress++;

                            setTimeout(function() {
                                if (!cancelCalled && fileTestHelper.getRequests().length === expectedChunks) {
                                    qq.each(fileTestHelper.getRequests(), function(idx, req) {
                                        req.abort = function() {
                                            xhrsAborted++;
                                        };
                                    });

                                    cancelCalled = true;
                                    uploader.cancel(0);
                                }
                            }, 10);
                        },
                        onUploadChunkSuccess: function(id, chunkData) {
                            assert.fail(null, null, "No chunks should have uploaded!");
                        },
                        onCancel: function(id) {
                            assert.equal(id, 0);
                            return true;
                        },
                        onStatusChange: function(id, oldStatus, newStatus) {
                            if (newStatus === qq.status.CANCELED) {
                                assert.equal(xhrsAborted, expectedChunks);
                            }
                        }
                    }
                });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs({name: "test", blob: blob});
            });
        });
    });
}
