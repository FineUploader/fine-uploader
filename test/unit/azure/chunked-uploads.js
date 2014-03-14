/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("azure chunked upload tests", function() {
    "use strict";

    if (qqtest.canDownloadFileAsBlob) {
        var fileTestHelper = helpme.setupFileTests(),
            testContainerEndpoint = "https://azureaccount.blob.core.windows.net/testContainer",
            expectedFileSize = 3266,
            expectedChunks = 2,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            typicalChunkingOption = {
                enabled: true,
                partSize: chunkSize,
                minFileSize: expectedFileSize
            };

        describe("server-side signature-based chunked Azure upload tests", function() {
            var startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest, signatureRequestPurl;

                    fileTestHelper.mockXhr();
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                    signatureRequest = fileTestHelper.getRequests()[0];
                    assert.equal(signatureRequest.method, "GET");

                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.attr("path"), testSignatureEndoint);

                    callback(signatureRequest, signatureRequestPurl);
                });
            },
            testSignatureEndoint = "/signature",
            typicalRequestOption = {
                endpoint: testContainerEndpoint
            },
            typicalSignatureOption = {
                endpoint: testSignatureEndoint
            };

            it("does not chunk if file is too small", function(done) {
                assert.expect(8, done);

                var uploader = new qq.azure.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: {
                            enabled: true,
                            partSize: typicalChunkingOption.partSize,
                            minFileSize: expectedFileSize + 1
                        }
                    }
                );

                startTypicalTest(uploader, function(signatureRequest, signatureRequestPurl) {
                    var expectedSasUri = "http://sasuri.com",
                        uploadRequest;

                    // signature request for upload part 1
                    assert.equal(signatureRequestPurl.param("_method"), "PUT");
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // upload request
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    uploadRequest = fileTestHelper.getRequests()[1];
                    assert.equal(uploadRequest.method, "PUT");
                    assert.equal(uploadRequest.url, expectedSasUri);
                });
            });

            it("handles a basic chunked upload", function(done) {
                assert.expect(57, done);

                var uploadChunkCalled = false,
                    uploadChunkSuccessCalled = false,
                    verifyChunkData = function(onUploadChunkSuccess, chunkData) {
                        if (onUploadChunkSuccess && uploadChunkSuccessCalled || !onUploadChunkSuccess && uploadChunkCalled) {
                            assert.equal(chunkData.partIndex, 1);
                            assert.equal(chunkData.startByte, chunkSize + 1);
                            assert.equal(chunkData.endByte,  expectedFileSize);
                            assert.equal(chunkData.totalParts, 2);
                        }
                        else {
                            if (onUploadChunkSuccess) {
                                uploadChunkSuccessCalled = true;
                            }
                            else {
                                uploadChunkCalled = true;
                            }

                            assert.equal(chunkData.partIndex, 0);
                            assert.equal(chunkData.startByte, 1);
                            assert.equal(chunkData.endByte,  chunkSize);
                            assert.equal(chunkData.totalParts, 2);
                        }
                    },
                    uploader = new qq.azure.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        callbacks: {
                            onComplete: function(id, name, response, xhr) {
                                assert.equal(id, 0, "Wrong ID passed to onComplete");
                                assert.equal(name, uploader.getName(0), "Wrong name passed to onComplete");
                                assert.ok(response, "Null response passed to onComplete");
                                assert.ok(xhr, "Null XHR passed to onComplete");
                            },
                            onUploadChunk: function(id, name, chunkData) {
                                //should be called twice each (1 for each chunk)
                                assert.equal(id, 0, "Wrong ID passed to onUploadChunk");
                                assert.equal(name, uploader.getName(0), "Wrong name passed to onUploadChunk");

                                verifyChunkData(false, chunkData);
                            },
                            onUploadChunkSuccess: function(id, chunkData, response, xhr) {
                                //should be called twice each (1 for each chunk)
                                assert.equal(id, 0, "Wrong ID passed to onUploadChunkSuccess");
                                assert.ok(response, "Null response paassed to onUploadChunkSuccess");
                                assert.ok(xhr, "Null XHR paassed to onUploadChunkSuccess");

                                verifyChunkData(true, chunkData);
                            }
                        }
                    }
                );

                startTypicalTest(uploader, function(signatureRequest, signatureRequestPurl) {
                    var expectedSasUri = "http://sasuri.com",
                        uploadRequest, putBlockListRequest;

                    // signature request for upload part 1
                    assert.equal(signatureRequestPurl.param("_method"), "PUT");
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    uploadRequest = fileTestHelper.getRequests()[1];
                    assert.ok(!uploadRequest.requestHeaders["x-ms-meta-qqfilename"]);
                    assert.equal(uploadRequest.method, "PUT");
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00000")));
                    uploadRequest.respond(201, null, null);

                    // signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    signatureRequest = fileTestHelper.getRequests()[2];
                    assert.equal(signatureRequest.method, "GET");
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("_method"), "PUT");
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    uploadRequest = fileTestHelper.getRequests()[3];
                    assert.ok(!uploadRequest.requestHeaders["x-ms-meta-qqfilename"]);
                    assert.equal(uploadRequest.method, "PUT");
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00001")));
                    uploadRequest.respond(201, null, null);

                    // signature request for put block list
                    assert.equal(fileTestHelper.getRequests().length, 5);
                    signatureRequest = fileTestHelper.getRequests()[4];
                    assert.equal(signatureRequest.method, "GET");
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("_method"), "PUT");
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // put block list request
                    assert.equal(fileTestHelper.getRequests().length, 6);
                    putBlockListRequest = fileTestHelper.getRequests()[5];
                    assert.equal(putBlockListRequest.method, "PUT");
                    assert.equal(putBlockListRequest.url, expectedSasUri + "&comp=blocklist");
                    assert.equal(putBlockListRequest.requestHeaders["x-ms-blob-content-type"], "image/jpeg");
                    assert.equal(putBlockListRequest.requestHeaders["x-ms-meta-qqfilename"], uploader.getName(0));
                    putBlockListRequest.respond(201, null, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });

            it("handles failures at every step of a chunked upload", function(done) {
                assert.expect(71, done);

                var uploader = new qq.azure.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        callbacks: {
                            onComplete: function(id, name, response) {
                                onCompleteCallbacks++;

                                if (onCompleteCallbacks < 7) {
                                    assert.ok(!response.success);
                                }
                                else {
                                    assert.ok(response.success);
                                }
                            },
                            onManualRetry: function(id, name) {
                                //expected to be called once for each retry
                                assert.equal(id, 0);
                                assert.equal(name, uploader.getName(0));
                            }
                        }
                    }
                ),
                    onCompleteCallbacks = 0;

                startTypicalTest(uploader, function(signatureRequest, signatureRequestPurl) {
                    var expectedSasUri = "http://sasuri.com",
                        uploadRequest, putBlockListRequest;

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // failing signature request for upload part 1
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(500, null, null);
                    assert.equal(fileTestHelper.getRequests().length, 1);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 1
                    signatureRequest = fileTestHelper.getRequests()[1];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // failing upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    uploadRequest = fileTestHelper.getRequests()[2];
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00000")));
                    uploadRequest.respond(404, null, null);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 1
                    signatureRequest = fileTestHelper.getRequests()[3];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // successful upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 5);
                    uploadRequest = fileTestHelper.getRequests()[4];
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00000")));
                    uploadRequest.respond(201, null, null);

                    // failing signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 6);
                    signatureRequest = fileTestHelper.getRequests()[5];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(500, null, null);
                    assert.equal(fileTestHelper.getRequests().length, 6);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 2
                    signatureRequest = fileTestHelper.getRequests()[6];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // failing upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 8);
                    uploadRequest = fileTestHelper.getRequests()[7];
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00001")));
                    uploadRequest.respond(404, null, null);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 9);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 1
                    signatureRequest = fileTestHelper.getRequests()[8];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // successful upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 10);
                    uploadRequest = fileTestHelper.getRequests()[9];
                    assert.equal(uploadRequest.method, "PUT");
                    assert.equal(uploadRequest.url, expectedSasUri + "&comp=block&blockid=" + encodeURIComponent(btoa("00001")));
                    uploadRequest.respond(201, null, null);

                    // failing signature request for put block list
                    assert.equal(fileTestHelper.getRequests().length, 11);
                    signatureRequest = fileTestHelper.getRequests()[10];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(500, null, null);
                    assert.equal(fileTestHelper.getRequests().length, 11);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 12);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for put block list
                    signatureRequest = fileTestHelper.getRequests()[11];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // failing put block list request
                    assert.equal(fileTestHelper.getRequests().length, 13);
                    putBlockListRequest = fileTestHelper.getRequests()[12];
                    assert.equal(putBlockListRequest.url, expectedSasUri + "&comp=blocklist");
                    assert.equal(putBlockListRequest.requestHeaders["x-ms-blob-content-type"], "image/jpeg");
                    putBlockListRequest.respond(404, null, null);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 14);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for put block list
                    signatureRequest = fileTestHelper.getRequests()[13];
                    signatureRequestPurl = purl(signatureRequest.url);
                    assert.equal(signatureRequestPurl.param("bloburi"), testContainerEndpoint + "/" + uploader.getBlobName(0));
                    signatureRequest.respond(200, null, expectedSasUri);

                    // successful put block list request
                    assert.equal(fileTestHelper.getRequests().length, 15);
                    putBlockListRequest = fileTestHelper.getRequests()[14];
                    assert.equal(putBlockListRequest.url, expectedSasUri + "&comp=blocklist");
                    assert.equal(putBlockListRequest.requestHeaders["x-ms-blob-content-type"], "image/jpeg");
                    putBlockListRequest.respond(201, null, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });
        });
    }
});
