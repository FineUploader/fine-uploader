/* globals describe, it, qq, assert, qqtest, helpme */
if (qq.supportedFeatures.imagePreviews) {
    describe("scaling module tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
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

        it("is disabled if no sizes are specified", function() {
            var scaler = new qq.Scaler({sizes: [], sendOriginal: true});

            assert.ok(!scaler.enabled);
        });

        it("is disabled if the current browsers doesn't support the File API", function() {
            var scaler = new qq.Scaler({sizes: [{size: 100}], sendOriginal: true}),
                supportsPreviews = qq.supportedFeatures.imagePreviews;

            assert.equal(scaler.enabled, supportsPreviews);
        });

        describe("generate records tests", function() {
            function runTest(includeOriginal) {
                var sizes = [
                        {
                            name: "small",
                            size: 100,
                            type: "image/jpeg"
                        },
                        {
                            name: "large",
                            size: 300,
                            type: "image/jpeg"
                        },
                        {
                            name: "medium",
                            size: 200,
                            type: "image/jpeg"
                        }
                    ],
                    originalFile = {dummy: "blob", type:"image/jpeg"},
                    scaler = new qq.Scaler(({sizes: sizes, sendOriginal: includeOriginal})),
                    records = scaler.getFileRecords("originalUuid", "originalName.jpeg", originalFile);

                assert.equal(records.length, includeOriginal ? 4 : 3);

                assert.equal(records[0].name, "originalName (small).jpeg");
                assert.notEqual(records[0].uuid, "originalUuid");
                assert.ok(records[0].blob instanceof qq.BlobProxy);

                assert.equal(records[1].name, "originalName (medium).jpeg");
                assert.notEqual(records[1].uuid, "originalUuid");
                assert.ok(records[1].blob instanceof qq.BlobProxy);

                assert.equal(records[2].name, "originalName (large).jpeg");
                assert.notEqual(records[2].uuid, "originalUuid");
                assert.ok(records[2].blob instanceof qq.BlobProxy);

                if (includeOriginal) {
                    assert.equal(records[3].name, "originalName.jpeg");
                    assert.equal(records[3].uuid, "originalUuid");
                    assert.equal(records[3].blob, originalFile);
                }
            }

            it("creates properly ordered and constructed file records on demand", function() {
                runTest(true);
            });

            it("creates properly ordered and constructed file records on demand (ignoring original)", function() {
                runTest(false);
            });
        });

        it("handles extensionless filenames correctly", function() {
            var sizes = [
                    {
                        name: "small",
                        size: 100
                    }
                ],
                scaler = new qq.Scaler(({sizes: sizes, sendOriginal: true})),
                records = scaler.getFileRecords("originalUuid", "originalName", {type: "image/jpeg"});

            assert.equal(records[0].name, "originalName (small)");
        });

        describe("generates simple scaled image tests", function() {
            function runScaleTest(orient, done) {
                assert.expect(3, done);

                var scalerContext = qq.extend({}, qq.Scaler.prototype),
                    scale = qq.bind(qq.Scaler.prototype._generateScaledImage, scalerContext);

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                    scale({size: 50, orient: orient, log: function(){}}, blob).then(function(scaledBlob) {
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
                        size: 100,
                        type: "image/jpeg"
                    },
                    {
                        name: "large",
                        size: 300
                    },
                    {
                        name: "medium",
                        size: 200,
                        type: "image/bmp"
                    }
                ],
                scaler = new qq.Scaler(({sizes: sizes, sendOriginal: true}));

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                var records = scaler.getFileRecords("originalUuid", "originalName.jpEg", blob);

                assert.equal(records[0].name, "originalName (small).jpEg");
                assert.equal(records[1].name, "originalName (medium).bmp");
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
                        size: 50,
                        type: "image/jpeg"
                    },
                    {
                        name: "medium",
                        size: 400,
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
                        size: 400,
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

        it("skips the scaling workflow for files that cannot be scaled", function(done) {
            assert.expect(7, done);

            var referenceFileSize,
                sizes = [
                    {
                        name: "small",
                        size: 50,
                        type: "image/jpeg"
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "one.txt"},
                    {id: 1, name: "two.txt"}
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    scaling: {
                        sizes: sizes
                    },
                    callbacks: {
                        onUpload: function(id, name) {
                            assert.ok(qq.isBlob(uploader.getFile(id)));
                            assert.equal(uploader.getFile(id).size, referenceFileSize);
                            actualUploadCallbacks.push({id: id, name: name});
                            acknowledgeRequests();
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 2);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("simpletext.txt", "text/plain").then(function(blob) {
                fileTestHelper.mockXhr();
                referenceFileSize = blob.size;
                uploader.addBlobs([{blob: blob, name: "one.txt"}, {blob: blob, name: "two.txt"}]);
            });
        });

        it("skips the scaling workflow for files that cannot be scaled but still uploads scaled versions where possible", function(done) {
            assert.expect(6, done);

            var sizes = [
                    {
                        name: "small",
                        size: 50,
                        type: "image/jpeg"
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "one.txt"},
                    {id: 1, name: "two (small).jpg"},
                    {id: 2, name: "two.jpg"}
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    scaling: {
                        sizes: sizes
                    },
                    callbacks: {
                        onUpload: function(id, name) {
                            assert.ok(qq.isBlob(uploader.getFile(id)));

                            actualUploadCallbacks.push({id: id, name: name});
                            acknowledgeRequests();
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 3);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("simpletext.txt", "text/plain").then(function(textFile) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(jpegFile) {
                    fileTestHelper.mockXhr();
                    uploader.addBlobs([{blob: textFile, name: "one.txt"}, {blob: jpegFile, name: "two.jpg"}]);
                });
            });
        });

        it("generates a scaled Blob of the default type if the requested type is not specified or is not valid", function(done) {
            assert.expect(7, done);

            var sizes = [
                    {
                        name: "one",
                        size: 100,
                        type: "image/jpeg"
                    },
                    {
                        name: "two",
                        size: 101,
                        type: "image/blah"
                    },
                    {
                        name: "three",
                        size: 102
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "test (one).jpeg"},
                    {id: 1, name: "test (two).png"},
                    {id: 2, name: "test (three).png"},
                    {id: 3, name: "test.png"}
                ],
                expectedScaledBlobType = [
                    "image/jpeg",
                    "image/png",
                    "image/png",
                    "image/png"
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    scaling: {
                        defaultType: "image/png",
                        sizes: sizes
                    },
                    callbacks: {
                        onUpload: function(id, name) {
                            actualUploadCallbacks.push({id: id, name: name});
                            setTimeout(function() {
                                var req = fileTestHelper.getRequests()[id],
                                    actualType = req.requestBody.fields.qqfile.type;

                                assert.equal(actualType, expectedScaledBlobType[id], "(" + id + ") Scaled blob type (" + actualType + ")  is incorrect.  Expected " + expectedScaledBlobType[id]);
                                req.respond(200, null, JSON.stringify({success: true}));
                            }, 10);
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 4);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("star.png", "image/png").then(function(blob) {
                fileTestHelper.mockXhr();
                uploader.addBlobs({blob: blob, name: "test.png"});
            });
        });

        it("uploads scaled files as expected, excluding the original: non-chunked, default options", function(done) {
            assert.expect(15, done);

            var referenceFileSize,
                sizes = [
                    {
                        name: "small",
                        size: 50,
                        type: "image/jpeg"
                    },
                    {
                        name: "medium",
                        size: 400,
                        type: "image/jpeg"
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 0, name: "up (small).jpeg"},
                    {id: 1, name: "up (medium).jpeg"},
                    {id: 2, name: "up2 (small).jpeg"},
                    {id: 3, name: "up2 (medium).jpeg"}
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    scaling: {
                        sendOriginal: false,
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

        it("does not attempt to upload scaled file groups that fail validation", function(done) {
            assert.expect(9, done);

            var referenceFileSize,
                sizes = [
                    {
                        name: "small",
                        size: 50
                    },
                    {
                        name: "medium",
                        size: 400
                    }
                ],
                expectedUploadCallbacks = [
                    {id: 3, name: "star (small).png"},
                    {id: 4, name: "star (medium).png"},
                    {id: 5, name: "star.png"}
                ],
                actualUploadCallbacks = [],
                uploader = new qq.FineUploaderBasic({
                    request: {endpoint: "test/uploads"},
                    validation: {
                        sizeLimit: 856,
                        stopOnFirstInvalidFile: false
                    },
                    scaling: {
                        sizes: sizes
                    },
                    callbacks: {
                        onUpload: function(id, name) {
                            assert.ok(uploader.getSize(id) > 0);
                            assert.ok(qq.isBlob(uploader.getFile(id)));

                            actualUploadCallbacks.push({id: id, name: name});
                            acknowledgeRequests();
                        },
                        onAllComplete: function(successful, failed) {
                            assert.equal(successful.length, 3);
                            assert.equal(failed.length, 0);
                            assert.deepEqual(actualUploadCallbacks, expectedUploadCallbacks);
                        }
                    }
                });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(up) {
                qqtest.downloadFileAsBlob("star.png", "image/png").then(function(star) {
                    fileTestHelper.mockXhr();
                    uploader.addBlobs([{blob: up, name: "up.jpg"}, {blob: star, name: "star.png"}]);
                });
            });
        });

        describe("scaleImage API method tests", function() {
            it("return a scaled version of an existing image file, fail a request for a missing file, fail a request for a non-image file", function(done) {
                assert.expect(4, done);

                var referenceFileSize,
                    uploader = new qq.FineUploaderBasic({
                        request: {endpoint: "test/uploads"},
                        callbacks: {
                            onUpload: acknowledgeRequests,

                            onAllComplete: function(successful, failed) {
                                uploader.scaleImage(0, {size: 10}).then(function(scaledBlob) {
                                    assert.ok(qq.isBlob(scaledBlob));
                                    assert.ok(scaledBlob.size < referenceFileSize);
                                });

                                // not an image
                                uploader.scaleImage(1, {size: 10}).then(function() {},
                                function() {
                                    assert.ok(true);
                                });

                                //missing
                                uploader.scaleImage(2, {size: 10}).then(function() {},
                                function() {
                                    assert.ok(true);
                                });
                            }
                        }
                    });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(up) {
                    referenceFileSize = up.size;

                    qqtest.downloadFileAsBlob("simpletext.txt", "text/plain").then(function(text) {
                        fileTestHelper.mockXhr();
                        uploader.addBlobs([{blob: up, name: "up.jpg"}, {blob: text, name: "text.txt"}]);
                    });
                });
            });
        });
    });
}
