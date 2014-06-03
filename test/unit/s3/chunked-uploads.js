/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
//TODO test to ensure uploads are reset if CompleteMultipart error response contains specific keywords.  Do this as part of #1188
if (qqtest.canDownloadFileAsBlob) {
    describe("s3 chunked upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "https://mytestbucket.s3.amazonaws.com",
            testBucketName = "mytestbucket",
            testAccessKey = "testAccessKey",
            expectedFileSize = 3266,
            expectedChunks = 2,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            typicalChunkingOption = {
                enabled: true,
                partSize: chunkSize
            };

        describe("server-side signature-based chunked S3 upload tests", function() {

            var startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var initiateSignatureRequest, uploadRequest, initiateToSign;

                    fileTestHelper.mockXhr();
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                    initiateSignatureRequest = fileTestHelper.getRequests()[0];
                    initiateToSign = JSON.parse(initiateSignatureRequest.requestBody);

                    callback(initiateSignatureRequest, initiateToSign, uploadRequest);
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

            it("handles a basic chunked upload", function(done) {
                assert.expect(87, done);

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
                    uploader = new qq.s3.FineUploaderBasic({
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

                startTypicalTest(uploader, function(initiateSignatureRequest, initiateToSign) {
                    var uploadPartRequest,
                        initiateRequest,
                        uploadPartSignatureRequest1,
                        uploadPartSignatureRequest2,
                        uploadPartToSign1,
                        uploadPartToSign2,
                        uploadCompleteSignatureRequest,
                        uploadCompleteToSign,
                        multipartCompleteRequest;

                    // signature request for initiate multipart upload
                    assert.equal(initiateSignatureRequest.url, testSignatureEndoint);
                    assert.equal(initiateSignatureRequest.method, "POST");
                    assert.equal(initiateSignatureRequest.requestHeaders["Content-Type"].indexOf("application/json;"), 0);
                    assert.ok(initiateToSign.headers);
                    assert.equal(initiateToSign.headers.indexOf("POST"), 0);
                    assert.ok(initiateToSign.headers.indexOf("image/jpeg") > 0);
                    assert.ok(initiateToSign.headers.indexOf("x-amz-acl:private") > 0);
                    assert.ok(initiateToSign.headers.indexOf("x-amz-date:") > 0);
                    assert.ok(initiateToSign.headers.indexOf("x-amz-meta-qqfilename:" + uploader.getName(0)) > 0);
                    assert.ok(initiateToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploads") > 0);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    initiateRequest = fileTestHelper.getRequests()[1];
                    assert.equal(initiateRequest.method, "POST");
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    assert.equal(initiateRequest.requestHeaders["x-amz-meta-qqfilename"], uploader.getName(0));
                    assert.equal(initiateRequest.requestHeaders["x-amz-acl"], "private");
                    assert.ok(initiateRequest.requestHeaders["x-amz-date"]);
                    assert.equal(initiateRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                    initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                    // signature request for upload part 1
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    uploadPartSignatureRequest1 = fileTestHelper.getRequests()[3];
                    assert.equal(uploadPartSignatureRequest1.method, "POST");
                    assert.equal(uploadPartSignatureRequest1.url, testSignatureEndoint);
                    assert.equal(uploadPartSignatureRequest1.requestHeaders["Content-Type"].indexOf("application/json;"), 0);
                    uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign1.headers);
                    assert.equal(uploadPartToSign1.headers.indexOf("PUT"), 0);
                    assert.ok(uploadPartToSign1.headers.indexOf("x-amz-date:") > 0);
                    assert.ok(uploadPartToSign1.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123") > 0);
                    uploadPartSignatureRequest1.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // upload part 1 request
                    uploadPartRequest = fileTestHelper.getRequests()[2];
                    assert.equal(uploadPartRequest.method, "PUT");
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                    assert.equal(uploadPartRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                    uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                    // signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 6);
                    uploadPartSignatureRequest2 = fileTestHelper.getRequests()[5];
                    assert.equal(uploadPartSignatureRequest2.method, "POST");
                    assert.equal(uploadPartSignatureRequest2.url, testSignatureEndoint);
                    assert.equal(uploadPartSignatureRequest2.requestHeaders["Content-Type"].indexOf("application/json;"), 0);
                    uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest2.requestBody);
                    assert.ok(uploadPartToSign2.headers);
                    assert.equal(uploadPartToSign2.headers.indexOf("PUT"), 0);
                    assert.ok(uploadPartToSign2.headers.indexOf("x-amz-date:") > 0);
                    assert.ok(uploadPartToSign2.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123") > 0);
                    uploadPartSignatureRequest2.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // upload part 2 request
                    uploadPartRequest = fileTestHelper.getRequests()[4];
                    assert.equal(uploadPartRequest.method, "PUT");
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                    assert.equal(uploadPartRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                    uploadPartRequest.respond(200, {ETag: "etag2"}, null);

                    // signature request for multipart complete
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    uploadCompleteSignatureRequest = fileTestHelper.getRequests()[6];
                    assert.equal(uploadCompleteSignatureRequest.method, "POST");
                    assert.equal(uploadCompleteSignatureRequest.url, testSignatureEndoint);
                    assert.equal(uploadCompleteSignatureRequest.requestHeaders["Content-Type"].indexOf("application/json;"), 0);
                    uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                    assert.ok(uploadCompleteToSign.headers);
                    assert.equal(uploadCompleteToSign.headers.indexOf("POST"), 0);
                    assert.ok(uploadCompleteToSign.headers.indexOf("x-amz-date:") > 0);
                    assert.ok(uploadCompleteToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploadId=123") > 0);
                    uploadCompleteSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 8);
                    multipartCompleteRequest = fileTestHelper.getRequests()[7];
                    assert.equal(multipartCompleteRequest.method, "POST");
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.ok(multipartCompleteRequest.requestHeaders["x-amz-date"]);
                    assert.equal(multipartCompleteRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });

            it("ensures set reducedRedundancy and serverSideEncryption options result in proper headers/params", function(done) {
                assert.expect(18, done);

                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        objectProperties: {
                            serverSideEncryption: true,
                            reducedRedundancy: true
                        }
                    }
                );

                startTypicalTest(uploader, function(initiateSignatureRequest, initiateToSign) {
                    var uploadPartRequest,
                        initiateRequest,
                        uploadPartSignatureRequest1,
                        uploadPartSignatureRequest2,
                        uploadPartToSign1,
                        uploadPartToSign2,
                        uploadCompleteSignatureRequest,
                        uploadCompleteToSign,
                        multipartCompleteRequest;

                    // signature request for initiate multipart upload
                    assert.ok(initiateToSign.headers.indexOf(qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME + ":" + qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE) > 0);
                    assert.ok(initiateToSign.headers.indexOf(qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME + ":" + qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE) > 0);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // initiate multipart upload request
                    initiateRequest = fileTestHelper.getRequests()[1];
                    assert.equal(initiateRequest.requestHeaders[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME], qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE);
                    assert.equal(initiateRequest.requestHeaders[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME], qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE);
                    initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                    // signature request for upload part 1
                    uploadPartSignatureRequest1 = fileTestHelper.getRequests()[3];
                    uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign1.headers.indexOf(qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME + ":" + qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE) < 0);
                    assert.ok(uploadPartToSign1.headers.indexOf(qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME + ":" + qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE) < 0);
                    uploadPartSignatureRequest1.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // upload part 1 request
                    uploadPartRequest = fileTestHelper.getRequests()[2];
                    assert.ok(!uploadPartRequest.requestHeaders[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME]);
                    assert.ok(!uploadPartRequest.requestHeaders[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME]);
                    uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                    // signature request for upload part 2
                    uploadPartSignatureRequest2 = fileTestHelper.getRequests()[5];
                    uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign2.headers.indexOf(qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME + ":" + qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE) < 0);
                    assert.ok(uploadPartToSign2.headers.indexOf(qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME + ":" + qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE) < 0);
                    uploadPartSignatureRequest2.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // upload part 2 request
                    uploadPartRequest = fileTestHelper.getRequests()[4];
                    assert.ok(!uploadPartRequest.requestHeaders[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME]);
                    assert.ok(!uploadPartRequest.requestHeaders[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME]);
                    uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                    // signature request for multipart complete
                    uploadCompleteSignatureRequest = fileTestHelper.getRequests()[6];
                    uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                    assert.ok(uploadCompleteToSign.headers.indexOf(qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME + ":" + qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE) < 0);
                    assert.ok(uploadCompleteToSign.headers.indexOf(qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME + ":" + qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE) < 0);
                    uploadCompleteSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // multipart complete request
                    multipartCompleteRequest = fileTestHelper.getRequests()[7];
                    assert.ok(!multipartCompleteRequest.requestHeaders[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME]);
                    assert.ok(!multipartCompleteRequest.requestHeaders[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME]);
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });

            it("handles failures at every step of a chunked upload", function(done) {
                assert.expect(99, done);

                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption,
                        callbacks: {
                            onComplete: function(id, name, response) {
                                onCompleteCallbacks++;

                                if (onCompleteCallbacks < 9) {
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

                startTypicalTest(uploader, function(initiateSignatureRequest, initiateToSign) {
                    var uploadPartRequest,
                        initiateRequest,
                        uploadPartSignatureRequest1,
                        uploadPartSignatureRequest2,
                        uploadPartToSign1,
                        uploadPartToSign2,
                        uploadCompleteSignatureRequest,
                        uploadCompleteToSign,
                        multipartCompleteRequest;

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // failing signature request for initiate multipart upload
                    assert.equal(initiateSignatureRequest.url, testSignatureEndoint);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({invalid: true}));
                    assert.equal(fileTestHelper.getRequests().length, 1);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    uploader.retry(0);
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful initiate signature request
                    initiateSignatureRequest = fileTestHelper.getRequests()[1];
                    assert.equal(initiateSignatureRequest.url, testSignatureEndoint);
                    assert.ok(initiateToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploads") > 0);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // failing initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    initiateRequest = fileTestHelper.getRequests()[2];
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    initiateRequest.respond(200, null, "");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);


                    // successful initiate signature request
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    initiateSignatureRequest = fileTestHelper.getRequests()[3];
                    assert.equal(initiateSignatureRequest.url, testSignatureEndoint);
                    assert.ok(initiateToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploads") > 0);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // successful initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 5);
                    initiateRequest = fileTestHelper.getRequests()[4];
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                    // failed signature request for upload part 1
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    uploadPartSignatureRequest1 = fileTestHelper.getRequests()[6];
                    assert.equal(uploadPartSignatureRequest1.url, testSignatureEndoint);
                    uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign1.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123") > 0);
                    uploadPartSignatureRequest1.respond(200, null, JSON.stringify({invalid: true}));

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 1
                    assert.equal(fileTestHelper.getRequests().length, 9);
                    uploadPartSignatureRequest1 = fileTestHelper.getRequests()[8];
                    assert.equal(uploadPartSignatureRequest1.url, testSignatureEndoint);
                    uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign1.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123") > 0);
                    uploadPartSignatureRequest1.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // failing upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 9);
                    uploadPartRequest = fileTestHelper.getRequests()[7];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    uploadPartRequest.respond(404, {ETag: "etag1"}, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 9);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 1
                    assert.equal(fileTestHelper.getRequests().length, 11);
                    uploadPartSignatureRequest1 = fileTestHelper.getRequests()[10];
                    assert.equal(uploadPartSignatureRequest1.url, testSignatureEndoint);
                    uploadPartToSign1 = JSON.parse(uploadPartSignatureRequest1.requestBody);
                    assert.ok(uploadPartToSign1.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123") > 0);
                    uploadPartSignatureRequest1.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // successful upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 11);
                    uploadPartRequest = fileTestHelper.getRequests()[9];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    uploadPartRequest.respond(200, {ETag: "etag1_a"}, null);

                    // failing signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 13);
                    uploadPartSignatureRequest2 = fileTestHelper.getRequests()[12];
                    assert.equal(uploadPartSignatureRequest2.url, testSignatureEndoint);
                    uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest2.requestBody);
                    assert.ok(uploadPartToSign2.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123") > 0);
                    uploadPartSignatureRequest2.respond(404, null, JSON.stringify({signature: "thesignature"}));

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 13);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 15);
                    uploadPartSignatureRequest2 = fileTestHelper.getRequests()[14];
                    assert.equal(uploadPartSignatureRequest2.url, testSignatureEndoint);
                    uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest2.requestBody);
                    assert.ok(uploadPartToSign2.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123") > 0);
                    uploadPartSignatureRequest2.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // failing upload part 2 request
                    uploadPartRequest = fileTestHelper.getRequests()[13];
                    assert.equal(fileTestHelper.getRequests().length, 15);
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    uploadPartRequest.respond(404, {ETag: "etag2"}, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 15);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for upload part 2
                    assert.equal(fileTestHelper.getRequests().length, 17);
                    uploadPartSignatureRequest2 = fileTestHelper.getRequests()[16];
                    assert.equal(uploadPartSignatureRequest2.url, testSignatureEndoint);
                    uploadPartToSign2 = JSON.parse(uploadPartSignatureRequest2.requestBody);
                    assert.ok(uploadPartToSign2.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123") > 0);
                    uploadPartSignatureRequest2.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // successful upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 17);
                    uploadPartRequest = fileTestHelper.getRequests()[15];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    uploadPartRequest.respond(200, {ETag: "etag2_a"}, null);

                    // failing signature request for multipart complete
                    assert.equal(fileTestHelper.getRequests().length, 18);
                    uploadCompleteSignatureRequest = fileTestHelper.getRequests()[17];
                    assert.equal(uploadCompleteSignatureRequest.url, testSignatureEndoint);
                    uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                    assert.ok(uploadCompleteToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploadId=123") > 0);
                    uploadCompleteSignatureRequest.respond(400, null, JSON.stringify({signature: "thesignature"}));

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 18);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful signature request for multipart complete
                    assert.equal(fileTestHelper.getRequests().length, 19);
                    uploadCompleteSignatureRequest = fileTestHelper.getRequests()[18];
                    assert.equal(uploadCompleteSignatureRequest.url, testSignatureEndoint);
                    uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                    assert.ok(uploadCompleteToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploadId=123") > 0);
                    uploadCompleteSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // failing multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 20);
                    multipartCompleteRequest = fileTestHelper.getRequests()[19];
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1_a</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2_a</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 20);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);


                    // successful signature request for multipart complete
                    assert.equal(fileTestHelper.getRequests().length, 21);
                    uploadCompleteSignatureRequest = fileTestHelper.getRequests()[20];
                    assert.equal(uploadCompleteSignatureRequest.url, testSignatureEndoint);
                    uploadCompleteToSign = JSON.parse(uploadCompleteSignatureRequest.requestBody);
                    assert.ok(uploadCompleteToSign.headers.indexOf("/" + testBucketName + "/" + uploader.getKey(0) + "?uploadId=123") > 0);
                    uploadCompleteSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));

                    // successful multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 22);
                    multipartCompleteRequest = fileTestHelper.getRequests()[21];
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1_a</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2_a</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });

            it("converts all parameters (metadata) to lower case before sending them to S3", function(done) {
                assert.expect(5, done);

                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: typicalSignatureOption,
                        chunking: typicalChunkingOption
                    }
                );

                uploader.setParams({
                    mIxEdCaSe: "value",
                    mIxEdCaSeFunc: function() {
                        return "value2";
                    }
                });

                startTypicalTest(uploader, function(initiateSignatureRequest, initiateToSign) {
                    var initiateRequest;

                    assert.ok(initiateToSign.headers.indexOf("x-amz-meta-mixedcase:value") >= 0);
                    assert.ok(initiateToSign.headers.indexOf("x-amz-meta-mixedcasefunc:value2") >= 0);
                    initiateSignatureRequest.respond(200, null, JSON.stringify({signature: "thesignature"}));
                    initiateRequest = fileTestHelper.getRequests()[1];
                    assert.equal(initiateRequest.requestHeaders["x-amz-meta-mixedcase"], "value");
                    assert.equal(initiateRequest.requestHeaders["x-amz-meta-mixedcasefunc"], "value2");
                });
            });
        });

        describe("client-side signature-based chunked S3 upload tests", function() {
            var startTypicalTest = function(uploader, callback) {
                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        var uploadRequest;

                        fileTestHelper.mockXhr();
                        uploader.addBlobs({name: "test.jpg", blob: blob});

                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        uploadRequest = fileTestHelper.getRequests()[0];

                        callback(uploadRequest);
                    });
                },
                testSecretKey = "testSecrtKey",
                testExpiration = new Date(Date.now() + 60000),
                typicalRequestOption = {
                    endpoint: testS3Endpoint
                },
                typicalCredentialsOption = {
                    accessKey: testAccessKey,
                    secretKey: testSecretKey,
                    expiration: testExpiration
                };

            it("handles a basic chunked upload", function(done) {
                assert.expect(24, done);

                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        chunking: typicalChunkingOption,
                        credentials: typicalCredentialsOption
                    }
                );

                startTypicalTest(uploader, function() {
                    var uploadPartRequest,
                        initiateRequest,
                        multipartCompleteRequest;

                    // initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 1);
                    initiateRequest = fileTestHelper.getRequests()[0];
                    assert.equal(initiateRequest.method, "POST");
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    assert.equal(initiateRequest.requestHeaders["x-amz-meta-qqfilename"], uploader.getName(0));
                    assert.equal(initiateRequest.requestHeaders["x-amz-acl"], "private");
                    assert.ok(initiateRequest.requestHeaders["x-amz-date"]);
                    assert.equal(initiateRequest.requestHeaders.Authorization.indexOf("AWS " + testAccessKey + ":"), 0, "Initiate MP request Authorization header invalid");
                    initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                    // upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    uploadPartRequest = fileTestHelper.getRequests()[1];
                    assert.equal(uploadPartRequest.method, "PUT");
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                    assert.equal(uploadPartRequest.requestHeaders.Authorization.indexOf("AWS " + testAccessKey + ":"), 0, "Upload part 1 request Authorization header is invalid");
                    uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                    // upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    uploadPartRequest = fileTestHelper.getRequests()[2];
                    assert.equal(uploadPartRequest.method, "PUT");
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                    assert.equal(uploadPartRequest.requestHeaders.Authorization.indexOf("AWS " + testAccessKey + ":"), 0, "Upload part 2 request Authorization header is invalid");
                    uploadPartRequest.respond(200, {ETag: "etag2"}, null);

                    // multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    multipartCompleteRequest = fileTestHelper.getRequests()[3];
                    assert.equal(multipartCompleteRequest.method, "POST");
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.ok(multipartCompleteRequest.requestHeaders["x-amz-date"]);
                    assert.equal(multipartCompleteRequest.requestHeaders.Authorization.indexOf("AWS " + testAccessKey + ":"), 0, "MP complete request Authorization header is invalid");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });

            it("handles failures at every step of a chunked upload", function(done) {
                assert.expect(33, done);

                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        chunking: typicalChunkingOption,
                        credentials: typicalCredentialsOption
                    }
                );

                startTypicalTest(uploader, function() {
                    var uploadPartRequest,
                        initiateRequest,
                        multipartCompleteRequest;

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // failing initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 1);
                    initiateRequest = fileTestHelper.getRequests()[0];
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    initiateRequest.respond(200, null, "");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 1);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful initiate multipart upload request
                    assert.equal(fileTestHelper.getRequests().length, 2);
                    initiateRequest = fileTestHelper.getRequests()[1];
                    assert.equal(initiateRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploads");
                    initiateRequest.respond(200, null, "<UploadId>123</UploadId>");

                    // failing upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    uploadPartRequest = fileTestHelper.getRequests()[2];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    uploadPartRequest.respond(404, {ETag: "etag1"}, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 3);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful upload part 1 request
                    assert.equal(fileTestHelper.getRequests().length, 4);
                    uploadPartRequest = fileTestHelper.getRequests()[3];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                    uploadPartRequest.respond(200, {ETag: "etag1_a"}, null);

                    // failing upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 5);
                    uploadPartRequest = fileTestHelper.getRequests()[4];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    uploadPartRequest.respond(404, {ETag: "etag2"}, null);

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 5);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful upload part 2 request
                    assert.equal(fileTestHelper.getRequests().length, 6);
                    uploadPartRequest = fileTestHelper.getRequests()[5];
                    assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                    uploadPartRequest.respond(200, {ETag: "etag2_a"}, null);

                    // failing multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    multipartCompleteRequest = fileTestHelper.getRequests()[6];
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1_a</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2_a</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    assert.equal(fileTestHelper.getRequests().length, 7);
                    uploader.retry(0);
                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOADING);

                    // successful multipart complete request
                    assert.equal(fileTestHelper.getRequests().length, 8);
                    multipartCompleteRequest = fileTestHelper.getRequests()[7];
                    assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                    assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1_a</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2_a</ETag></Part></CompleteMultipartUpload>");
                    multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                    assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
                });
            });
        });
    });
}
