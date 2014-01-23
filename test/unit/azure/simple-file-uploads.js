/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("simple Azure upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testEndpoint = "https://testcontainer.com",
            testSignatureEndoint = "http://signature-server.com/signature",
            startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest;

                    fileTestHelper.mockXhr();
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                    signatureRequest = fileTestHelper.getRequests()[0];

                    callback(signatureRequest);
                });
            };

        it("test most basic upload w/ signature request", function(done) {
            assert.expect(9, done);

            var expectedSasUri = "http://sasuri.com",
                uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint}
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                var uploadRequest,
                    blobName = uploader.getBlobName(0),
                    blobUri = testEndpoint + "/" + blobName;

                assert.equal(blobName, uploader.getUuid(0) + "." + qq.getExtension(uploader.getName(0)));
                assert.equal(signatureRequest.method, "GET");
                assert.equal(signatureRequest.url, testSignatureEndoint + "?bloburi=" + encodeURIComponent(blobUri) + "&_method=PUT");

                signatureRequest.respond(200, null, expectedSasUri);

                setTimeout(function() {
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    uploadRequest = fileTestHelper.getRequests()[1];

                    assert.equal(uploadRequest.url, expectedSasUri);
                    assert.equal(uploadRequest.method, "PUT");
                    assert.equal(uploadRequest.requestHeaders["x-ms-blob-type"], "BlockBlob");
                    assert.equal(uploadRequest.requestHeaders["Content-Type"].indexOf("image/jpeg"), 0);
                }, 0);
            });
        });

        it("test most basic upload w/ signature request that includes custom headers", function(done) {
            assert.expect(2, done);

            var expectedSignatureHeaders = {
                    foo: "bar"
                },
                uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {
                        endpoint: testSignatureEndoint,
                        customHeaders: expectedSignatureHeaders
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                assert.equal(signatureRequest.requestHeaders.foo, expectedSignatureHeaders.foo);
            });
        });

        it("test most basic upload w/ signature request uses the filename as the blob name", function(done) {
            assert.expect(3, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    blobProperties: {name: "filename"}
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                var blobName = uploader.getBlobName(0),
                    blobUri = testEndpoint + "/" + blobName;

                assert.equal(blobName, uploader.getName(0));
                assert.equal(signatureRequest.url, testSignatureEndoint + "?bloburi=" + encodeURIComponent(blobUri) + "&_method=PUT");
            });
        });

        it("test most basic upload w/ signature request uses a promissory function to determine the blob name", function(done) {
            assert.expect(3, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    blobProperties: {
                        name: function(id) {
                            return new qq.Promise().success(id + "_blobname");
                        }
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                var blobName = uploader.getBlobName(0),
                    blobUri = testEndpoint + "/" + blobName;

                assert.equal(blobName, "0_blobname");
                assert.equal(signatureRequest.url, testSignatureEndoint + "?bloburi=" + encodeURIComponent(blobUri) + "&_method=PUT");
            });
        });

        it("test basic upload w/ params", function(done) {
            assert.expect(6, done);

            var expectedParams = {
                    foo: "bar",
                    one: 1,
                    bool: true,
                    func: function() {
                        return "thefunction";
                    },
                    funky: "ch@r&cters"
                },
                uploader = new qq.azure.FineUploaderBasic({
                    request: {
                        endpoint: testEndpoint,
                        params: expectedParams
                    },
                    signature: {endpoint: testSignatureEndoint}
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                var uploadRequest,
                    blobName = uploader.getBlobName(0),
                    blobUri = testEndpoint + "/" + blobName;

                signatureRequest.respond(200, null, "http://sasuri.com");

                setTimeout(function() {
                    uploadRequest = fileTestHelper.getRequests()[1];

                    assert.equal(uploadRequest.requestHeaders[qq.azure.util.AZURE_PARAM_PREFIX + "foo"], expectedParams.foo);
                    assert.equal(uploadRequest.requestHeaders[qq.azure.util.AZURE_PARAM_PREFIX + "one"], expectedParams.one);
                    assert.equal(uploadRequest.requestHeaders[qq.azure.util.AZURE_PARAM_PREFIX + "bool"], String(expectedParams.bool));
                    assert.equal(uploadRequest.requestHeaders[qq.azure.util.AZURE_PARAM_PREFIX + "func"], expectedParams.func());
                    assert.equal(uploadRequest.requestHeaders[qq.azure.util.AZURE_PARAM_PREFIX + "funky"], encodeURIComponent(expectedParams.funky));
                }, 0);
            });
        });

        it("triggers expected callbacks at appropriate times", function(done) {
            assert.expect(17, done);

            var expectedCallbackOrder = ["validateBatch", "validate", "submit", "submitted", "upload", "complete"],
                actualCallbackOrder = [],
                expectedStatusOrder = [qq.status.SUBMITTING, qq.status.SUBMITTED, qq.status.UPLOADING, qq.status.UPLOAD_SUCCESSFUL],
                actualStatusOrder = [],
                uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    callbacks: {
                        onUpload: function(id, name) {
                            actualCallbackOrder.push("upload");
                            assert.equal(id, 0);
                            assert.equal(name, uploader.getName(0));
                        },
                        onValidate: function(id, name) {
                            actualCallbackOrder.push("validate");
                        },
                        onValidateBatch: function(id, name) {
                            actualCallbackOrder.push("validateBatch");
                        },
                        onSubmitted: function(id, name) {
                            actualCallbackOrder.push("submitted");
                            assert.equal(id, 0);
                            assert.equal(name, uploader.getName(0));
                        },
                        onSubmit: function(id, name) {
                            actualCallbackOrder.push("submit");
                            assert.equal(id, 0);
                            assert.equal(name, uploader.getName(0));
                        },
                        onComplete: function(id, name, response, xhr) {
                            actualCallbackOrder.push("complete");
                            assert.equal(id, 0);
                            assert.equal(name, uploader.getName(0));
                            assert.deepEqual(response, {success: true});
                            assert.ok(xhr);
                            assert.deepEqual(actualCallbackOrder, expectedCallbackOrder);
                        },
                        onStatusChange: function(id, oldStatus, newStatus) {
                            assert.equal(id, 0);
                            actualStatusOrder.push(newStatus);
                            if (newStatus === qq.status.UPLOAD_SUCCESSFUL) {
                                assert.deepEqual(actualStatusOrder, expectedStatusOrder);
                            }
                        }
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                signatureRequest.respond(200, null, "http://sasuri.com");

                setTimeout(function() {
                    var uploadRequest = fileTestHelper.getRequests()[1];
                    uploadRequest.respond(201, null, null);
                }, 0);
            });
        });

        it("reports error message from Azure to complete callback", function(done) {
            assert.expect(3, done);

            var uploader = new qq.azure.FineUploaderBasic({
                    request: {endpoint: testEndpoint},
                    signature: {endpoint: testSignatureEndoint},
                    callbacks: {
                        onComplete: function(id, name, response, xhr) {
                            assert.ok(response.error);
                            assert.equal(response.azureError, "string-value");
                        }
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest) {
                signatureRequest.respond(200, null, "http://sasuri.com");

                setTimeout(function() {
                    var uploadRequest = fileTestHelper.getRequests()[1];
                    uploadRequest.respond(500, null, "<?xml version=\"1.0\" encoding=\"utf-8\"?><Error><Code>string-value</Code><Message>string-value</Message></Error>");
                }, 0);
            });
        });
    });
}
