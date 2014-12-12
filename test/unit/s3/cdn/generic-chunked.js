/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("s3 chunked upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "http://some.cdn.com",
            testAccessKey = "testAccessKey",
            expectedFileSize = 3266,
            expectedChunks = 2,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            typicalChunkingOption = {
                enabled: true,
                partSize: chunkSize
            };

        describe("server-side signature-based chunked S3 upload tests for a CDN endpoint", function() {
            var startTypicalTest = function(uploader, done) {
                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        var uploadPartRequest,
                            initiateRequest,
                            uploadPartSignatureRequest1,
                            uploadPartSignatureRequest2,
                            uploadPartToSign1,
                            uploadPartToSign2,
                            uploadCompleteSignatureRequest,
                            uploadCompleteToSign,
                            multipartCompleteRequest,
                            initiateSignatureRequest,
                            uploadRequest,
                            initiateToSign;

                        fileTestHelper.mockXhr();
                        uploader.addFiles({name: "test.jpg", blob: blob});

                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        initiateSignatureRequest = fileTestHelper.getRequests()[0];
                        initiateToSign = JSON.parse(initiateSignatureRequest.requestBody);

                        // signature request for initiate multipart upload
                        assert.ok(initiateToSign.headers.indexOf("/mybucket/" + uploader.getKey(0) + "?uploads") > 0);
                        initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                        // initiate multipart upload request
                        initiateRequest = fileTestHelper.getRequests()[1];
                        initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                        // signature request for upload part 1
                        uploadPartSignatureRequest1 = fileTestHelper.getRequests()[3];
                        uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                        assert.ok(uploadPartToSign1.headers.indexOf("/mybucket/" + uploader.getKey(0) + "?partNumber=1&uploadId=123") > 0);
                        uploadPartSignatureRequest1.respond(200, null, JSON.stringify({signature: "thesignature"}));

                        // upload part 1 request
                        uploadPartRequest = fileTestHelper.getRequests()[2];
                        uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                        // signature request for upload part 2
                        uploadPartSignatureRequest2 = fileTestHelper.getRequests()[5];
                        uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest2.requestBody);
                        assert.ok(uploadPartToSign2.headers.indexOf("/mybucket/" + uploader.getKey(0) + "?partNumber=2&uploadId=123") > 0);
                        uploadPartSignatureRequest2.respond(200, null, JSON.stringify({signature: "thesignature"}));

                        // upload part 2 request
                        uploadPartRequest = fileTestHelper.getRequests()[4];
                        uploadPartRequest.respond(200, {ETag: "etag2"}, null);

                        // signature request for multipart complete
                        uploadCompleteSignatureRequest = fileTestHelper.getRequests()[6];
                        uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                        assert.ok(uploadCompleteToSign.headers.indexOf("/mybucket/" + uploader.getKey(0) + "?uploadId=123") > 0);
                        uploadCompleteSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                        // multipart complete request
                        multipartCompleteRequest = fileTestHelper.getRequests()[7];
                        multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>mybucket</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                        assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);

                        done();
                    });
                },
                testSignatureEndoint = "/signature",
                typicalRequestOption = {
                    accessKey: testAccessKey,
                    endpoint: testS3Endpoint
                },
                typicalSignatureOption = {
                    endpoint: testSignatureEndoint
                };

            it("handles a chunked upload w/ bucket specified as string", function(done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        objectProperties: {
                            bucket: "mybucket"
                        }
                    }
                );

                startTypicalTest(uploader, done);
            });

            it("handles a chunked upload w/ bucket specified via function", function(done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        objectProperties: {
                            bucket: function() {
                                return "mybucket";
                            }
                        }
                    }
                );

                startTypicalTest(uploader, done);
            });

            it("handles a chunked upload w/ bucket specified via promissory function", function(done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        objectProperties: {
                            bucket: function() {
                                var promise = new qq.Promise();
                                promise.success("mybucket");
                                return promise;
                            }
                        }
                    }
                );

                startTypicalTest(uploader, done);
            });
        });
    });
}
