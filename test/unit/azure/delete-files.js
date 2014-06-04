/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("test the delete file feature for Azure", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testEndpoint = "https://testcontainer.com",
            testSignatureEndoint = "http://signature-server.com/signature",
            startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest;

                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                    signatureRequest = fileTestHelper.getRequests()[0];
                    signatureRequest.respond(200, null, "http://sasuri.com");

                    setTimeout(function() {
                        var uploadRequest = fileTestHelper.getRequests()[1];
                        uploadRequest.respond(201, null, "");

                        callback();
                    }, 0);
                });
            };

        it("does not attempt to delete a file if feature is disabled", function(done) {
            assert.expect(2, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint}
                }
            );

            startTypicalTest(uploader, function() {
                assert.ok(!uploader.deleteFile(0));
            });
        });

        it("properly deletes a file if the feature is enabled", function(done) {
            assert.expect(16, done);

            var expectedCallbackOrder = ["delete", "deleteComplete"],
                actualCallbackOrder = [],
                uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    deleteFile: {
                        enabled: true
                    },
                    callbacks: {
                        onDelete: function(id) {
                            actualCallbackOrder.push("delete");
                            assert.equal(id, 0);
                        },
                        onDeleteComplete: function(id, xhr, isError) {
                            actualCallbackOrder.push("deleteComplete");
                            assert.equal(id, 0);
                            assert.ok(xhr);
                            assert.ok(!isError);
                        }
                    }
                }
            );

            startTypicalTest(uploader, function() {
                var deleteFileSignatureRequest, deleteFileRequest, purlSignatureRequest,
                    blobName = uploader.getBlobName(0),
                    blobUri = testEndpoint + "/" + blobName;

                assert.ok(uploader.deleteFile(0));
                assert.equal(fileTestHelper.getRequests().length, 3);
                deleteFileSignatureRequest = fileTestHelper.getRequests()[2];
                purlSignatureRequest = purl(deleteFileSignatureRequest.url);

                assert.equal(deleteFileSignatureRequest.method, "GET");

                assert.equal(purlSignatureRequest.param("bloburi"), blobUri);
                assert.equal(purlSignatureRequest.param("_method"), "DELETE");
                assert.ok(purlSignatureRequest.param("qqtimestamp"));

                deleteFileSignatureRequest.respond(200, null, "http://sasuri.com");

                assert.equal(fileTestHelper.getRequests().length, 4);
                deleteFileRequest = fileTestHelper.getRequests()[3];

                assert.equal(deleteFileRequest.method, "DELETE");
                assert.equal(deleteFileRequest.url, "http://sasuri.com");

                deleteFileRequest.respond(202, null, null);

                assert.equal(uploader.getUploads()[0].status, qq.status.DELETED);
                assert.deepEqual(actualCallbackOrder, expectedCallbackOrder);
            });
        });

        it("properly fails a delete operation if the signature request fails", function(done) {
            assert.expect(6, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    deleteFile: {
                        enabled: true
                    },
                    callbacks: {
                        onDeleteComplete: function(id, xhr, isError) {
                            assert.equal(id, 0);
                            assert.ok(xhr);
                            assert.ok(isError);
                        }
                    }
                }
            );

            startTypicalTest(uploader, function() {
                var deleteFileSignatureRequest;

                uploader.deleteFile(0);
                deleteFileSignatureRequest = fileTestHelper.getRequests()[2];
                deleteFileSignatureRequest.respond(500, null, null);

                assert.equal(fileTestHelper.getRequests().length, 3);
                assert.equal(uploader.getUploads()[0].status, qq.status.DELETE_FAILED);
            });
        });

        it("properly fails a delete operation if the delete request to Azure fails", function(done) {
            assert.expect(6, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    deleteFile: {
                        enabled: true
                    },
                    callbacks: {
                        onDeleteComplete: function(id, xhr, isError) {
                            assert.equal(id, 0);
                            assert.ok(xhr);
                            assert.ok(isError);
                        }
                    }
                }
            );

            startTypicalTest(uploader, function() {
                var deleteFileSignatureRequest, deleteFileRequest;

                uploader.deleteFile(0);
                deleteFileSignatureRequest = fileTestHelper.getRequests()[2];
                deleteFileSignatureRequest.respond(200, null, "http://sasuri.com");

                assert.equal(fileTestHelper.getRequests().length, 4);
                deleteFileRequest = fileTestHelper.getRequests()[3];
                deleteFileRequest.respond(500, null, null);

                assert.equal(uploader.getUploads()[0].status, qq.status.DELETE_FAILED);
            });
        });
    });
}
