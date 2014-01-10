/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("chunked S3 upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "https://mytestbucket.s3.amazonaws.com",
            testBucketName = "mytestbucket",
            testSignatureEndoint = "/signature",
            testAccessKey = "testAccessKey",
            expectedFileSize = 3266,
            expectedChunks = 2,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            typicalRequestOption = {
                accessKey: testAccessKey,
                endpoint: testS3Endpoint
            },
            typicalSignatureOption = {
                endpoint: testSignatureEndoint
            },
            typicalChunkingOption = {
                enabled: true,
                partSize: chunkSize
            },
            startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var initiateSignatureRequest, uploadRequest, initiateToSign;

                    fileTestHelper.mockXhr();
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 2, "Wrong # of requests");

                    uploadRequest = fileTestHelper.getRequests()[0];
                    initiateSignatureRequest = fileTestHelper.getRequests()[1];
                    initiateToSign = JSON.parse(initiateSignatureRequest.requestBody);

                    callback(initiateSignatureRequest, initiateToSign, uploadRequest);
                });
            };

        it("test most basic chunked upload", function(done) {
            assert.expect(57, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption,
                    chunking: typicalChunkingOption
                }
            );

            startTypicalTest(uploader, function(initiateSignatureRequest, initiateToSign, uploadPartRequest) {
                var initiateRequest,
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
                assert.equal(fileTestHelper.getRequests().length, 3);
                initiateRequest = fileTestHelper.getRequests()[2];
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
                assert.equal(uploadPartRequest.method, "PUT");
                assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=1&uploadId=123");
                assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                assert.equal(uploadPartRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                uploadPartRequest.respond(200, {ETag: "etag1"}, null);

                // signature request for upload part 2
                assert.equal(fileTestHelper.getRequests().length, 5);
                uploadPartSignatureRequest2 = fileTestHelper.getRequests()[4];
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
                assert.equal(uploadPartRequest.method, "PUT");
                assert.equal(uploadPartRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?partNumber=2&uploadId=123");
                assert.ok(uploadPartRequest.requestHeaders["x-amz-date"]);
                assert.equal(uploadPartRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                uploadPartRequest.respond(200, {ETag: "etag2"}, null);

                // signature request for multipart complete
                assert.equal(fileTestHelper.getRequests().length, 6);
                uploadCompleteSignatureRequest = fileTestHelper.getRequests()[5];
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
                assert.equal(fileTestHelper.getRequests().length, 7);
                multipartCompleteRequest = fileTestHelper.getRequests()[6];
                assert.equal(multipartCompleteRequest.method, "POST");
                assert.equal(multipartCompleteRequest.url, testS3Endpoint + "/" + uploader.getKey(0) + "?uploadId=123");
                assert.ok(multipartCompleteRequest.requestHeaders["x-amz-date"]);
                assert.equal(multipartCompleteRequest.requestHeaders.Authorization, "AWS " + testAccessKey + ":thesignature");
                assert.equal(multipartCompleteRequest.requestBody, "<CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>etag1</ETag></Part><Part><PartNumber>2</PartNumber><ETag>etag2</ETag></Part></CompleteMultipartUpload>");
                multipartCompleteRequest.respond(200, null, "<CompleteMultipartUploadResult><Bucket>" + testBucketName + "</Bucket><Key>" + uploader.getKey(0) + "</Key></CompleteMultipartUploadResult>");

                assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);
            });
        });
    });
}
