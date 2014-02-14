/* globals describe, it, qq, assert, qqtest, helpme */
if (qq.supportedFeatures.imagePreviews) {
    describe("scaling module tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests();

        it("is disabled if no sizes are specified", function() {
            var scaler = new qq.Scaler({sizes: []});

            assert.ok(!scaler.enabled);
        });

        it("is disabled if the current browsers doesn't support the File API", function() {
            var scaler = new qq.Scaler({sizes: [{max: 100}]}),
                supportsPreviews = qq.supportedFeatures.imagePreviews;

            assert.equal(scaler.enabled, supportsPreviews);
        });

        it("creates properly ordered and constructed file records on demand", function() {
            var sizes = [
                    {
                        name: "small",
                        max: 100,
                        type: "image/jpeg"
                    },
                    {
                        name: "large",
                        max: 300,
                        type: "image/jpeg"
                    },
                    {
                        name: "medium",
                        max: 200,
                        type: "image/jpeg"
                    }
                ],
                originalFile = {dummy: "blob"},
                scaler = new qq.Scaler(({sizes: sizes})),
                records = scaler.getFileRecords("originalUuid", "originalName.jpeg", originalFile);

            assert.equal(records.length, 4);

            assert.equal(records[0].name, "originalName (small).jpeg");
            assert.notEqual(records[0].uuid, "originalUuid");
            assert.ok(records[0].blob instanceof qq.BlobProxy);

            assert.equal(records[1].name, "originalName (medium).jpeg");
            assert.notEqual(records[1].uuid, "originalUuid");
            assert.ok(records[1].blob instanceof qq.BlobProxy);

            assert.equal(records[2].name, "originalName (large).jpeg");
            assert.notEqual(records[2].uuid, "originalUuid");
            assert.ok(records[2].blob instanceof qq.BlobProxy);

            assert.equal(records[3].name, "originalName.jpeg");
            assert.equal(records[3].uuid, "originalUuid");
            assert.equal(records[3].blob, originalFile);
        });

        it("handles extensionless filenames correctly", function() {
            var sizes = [
                    {
                        name: "small",
                        max: 100
                    }
                ],
                scaler = new qq.Scaler(({sizes: sizes})),
                records = scaler.getFileRecords("originalUuid", "originalName", {});

            assert.equal(records[0].name, "originalName (small)");
        });

        describe("generates scaled image tests", function() {
            function runScaleTest(orient, done) {
                assert.expect(3, done);

                var scalerContext = qq.extend({}, qq.Scaler.prototype),
                    scale = qq.bind(qq.Scaler.prototype._generateScaledImage, scalerContext);

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                    scale(50, orient, function(){}, blob).then(function(scaledBlob) {
                        var URL = window.URL && window.URL.createObjectURL ? window.URL :
                                  window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL :
                                  null,
                            img = document.createElement("img");


                        assert.ok(qq.isBlob(scaledBlob));

                        img.onload = function() {
                            assert.ok(this.width <= 50);
                            assert.ok(this.height <= 50);
                        };

                        img.onerror = function() {
                            assert.fail(null, null, "Image failed to render!");
                        };

                        img.src = URL.createObjectURL(scaledBlob);
                    });
                });
            }

            it("generates a properly scaled & oriented image for a reference image", function(done) {
                runScaleTest(true, done);
            });

            it("generates a properly scaled image for a reference image", function(done) {
                runScaleTest(false, done);
            });
        });


        it("renames the scaled files only if their MIME type differs from the reference file", function(done) {
            assert.expect(8, done);

            var sizes = [
                    {
                        name: "small",
                        max: 100,
                        type: "image/jpeg"
                    },
                    {
                        name: "large",
                        max: 300
                    },
                    {
                        name: "medium",
                        max: 200,
                        type: "image/webp"
                    }
                ],
                scaler = new qq.Scaler(({sizes: sizes}));

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                var records = scaler.getFileRecords("originalUuid", "originalName.jpEg", blob);

                assert.equal(records[0].name, "originalName (small).jpEg");
                assert.equal(records[1].name, "originalName (medium).webp");
                assert.equal(records[2].name, "originalName (large).png");
                assert.equal(records[3].name, "originalName.jpEg");

                // leave extension-less file names alone
                records = scaler.getFileRecords("originalUuid", "originalName", blob);
                assert.equal(records[0].name, "originalName (small)");
                assert.equal(records[1].name, "originalName (medium)");
                assert.equal(records[2].name, "originalName (large)");
                assert.equal(records[3].name, "originalName");
            });
        });

        it("uploads scaled files as expected: non-chunked, default options", function(done) {
            assert.expect(21, done);

            var referenceFileSize,
                sizes = [
                    {
                        name: "small",
                        max: 50,
                        type: "image/jpeg"
                    },
                    {
                        name: "medium",
                        max: 400,
                        type: "image/jpeg"
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "up (small).jpeg"},
                    {id: 1, name: "up (medium).jpeg"},
                    {id: 2, name: "up.jpeg"},
                    {id: 3, name: "up2 (small).jpeg"},
                    {id: 4, name: "up2 (medium).jpeg"},
                    {id: 5, name: "up2.jpeg"}
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    scaling: {
                        sizes: sizes
                    },
                    callbacks: {
                        onUpload: function(id, name) {
                            assert.ok(uploader.getSize(id) > 0);
                            assert.ok(qq.isBlob(uploader.getFile(id)));
                            assert.equal(uploader.getFile(id).size, referenceFileSize);

                            actualUploadCallbacks.push({id: id, name: name});
                            setTimeout(function() {
                                fileTestHelper.getRequests()[id].respond(200, null, JSON.stringify({success: true}));
                            }, 10);
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 6);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();
                referenceFileSize = blob.size;
                uploader.addBlobs([{blob: blob, name: "up.jpeg"}, {blob: blob, name: "up2.jpeg"}]);
            });
        });

        it("uploads scaled files as expected: chunked, default options", function(done) {
            assert.expect(15, done);

            var referenceFileSize,
                sizes = [
                    {
                        name: "medium",
                        max: 400,
                        type: "image/jpeg"
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "up (medium).jpeg"},
                    {id: 1, name: "up.jpeg"},
                    {id: 2, name: "up2 (medium).jpeg"},
                    {id: 3, name: "up2.jpeg"}
                ],
                actualUploadCallbacks = [],
                acknowledgeRequests = function() {
                    setTimeout(function() {
                        qq.each(fileTestHelper.getRequests(), function(idx, req) {
                            if (!req.ack) {
                                req.ack = true;
                                req.respond(200, null, JSON.stringify({success: true}));
                            }
                        });
                    }, 10);
                },
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    chunking: {
                        enabled: true,
                        partSize: 50000
                    },
                    scaling: {
                        sizes: sizes
                    },
                    callbacks: {
                        onUploadChunk: function(id) {
                            acknowledgeRequests();
                        },
                        onUpload: function(id, name) {
                            assert.ok(uploader.getSize(id) > 0);
                            assert.ok(qq.isBlob(uploader.getFile(id)));
                            assert.equal(uploader.getFile(id).size, referenceFileSize);

                            actualUploadCallbacks.push({id: id, name: name});
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 4);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();
                referenceFileSize = blob.size;
                uploader.addBlobs([{blob: blob, name: "up.jpeg"}, {blob: blob, name: "up2.jpeg"}]);
            });
        });
    });
}
