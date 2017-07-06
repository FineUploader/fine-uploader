/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("paused uploads", function () {
        "use strict";

        var testUploadEndpoint = "/test/upload",
            fileTestHelper = helpme.setupFileTests();

        function getSimpleUploader(shouldComplete, shouldCompleteMessage) {
            var uploader = new qq.FineUploaderBasic({
                autoUpload: false,
                request: {
                    endpoint: testUploadEndpoint
                },
                maxConnections: 1,
                callbacks: {
                    onUpload: function(id) {
                        setTimeout(function() {
                            fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                        }, 0);
                    },
                    onComplete: function(id, name, response, xhr) {
                        uploadCounts++;

                        assert.deepEqual(response, {success: true}, "Server response parsing failed");
                        /* jshint eqnull:true */
                        assert.ok(xhr != null, "XHR not passed to onComplete");

                        assert.equal(uploader.getUploads({status: qq.status.UPLOAD_SUCCESSFUL}).length, uploadCounts, "Expected " + uploadCounts + " successful files");
                        assert.equal(uploader.getNetUploads(), uploadCounts, "Wrong # of net uploads");

                        if (shouldComplete && uploader._isPausedQueue) {
                            uploader.resumeQueue();

                            assert.ok(!uploader._isPausedQueue, "Queue is paused");
                        }
                    },
                    onAllComplete: function() {
                        assert.ok(shouldComplete, shouldCompleteMessage);
                    }
                }
            }), uploadCounts = 0;

            return uploader;
        }

        it("doesn't treat paused elements on pauseQueue", function (done) {
            assert.expect(10, done);

            var uploader = getSimpleUploader(false, "All files shouldn't have been uploaded");

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();

                uploader.addFiles([
                    {name: "blob0", blob: blob},
                    {name: "blob1", blob: blob},
                    {name: "blob2", blob: blob}
                ]);

                uploader.uploadStoredFiles();

                uploader.pauseQueue();

                assert.ok(uploader._isPausedQueue, "Queue is not paused");

                assert.equal(uploader.getUploads().length, 3, "Expected only 3 files");
            });
        });



        it("treats paused elements on resumeQueue", function (done) {
            assert.expect(16, done);

            var uploader = getSimpleUploader(true, "All files should have been uploaded");

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();

                uploader.addFiles([
                    {name: "blob0", blob: blob},
                    {name: "blob1", blob: blob},
                    {name: "blob2", blob: blob}
                ]);

                uploader.uploadStoredFiles();

                uploader.pauseQueue();

                assert.ok(uploader._isPausedQueue, "Queue is not paused");

                assert.equal(uploader.getUploads().length, 3, "Expected only 3 files");
            });
        });
    });
}
