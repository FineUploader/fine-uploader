/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl, Q */
if (qqtest.canDownloadFileAsBlob) {
    describe("simple S3 upload tests vis a generic CDN", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "http://some.cdn.com",
            testSignatureEndoint = "/signature",
            testAccessKey = "testAccessKey",
            typicalRequestOption = {
                accessKey: testAccessKey,
                endpoint: testS3Endpoint
            },
            typicalSignatureOption = {
                endpoint: testSignatureEndoint
            },
            startTypicalTest = function(uploader, done) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest, uploadRequest, policyDoc,
                        conditions = {},
                        uploadSuccessRequest, uploadSuccessRequestParsedBody;

                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test.jpg", blob: blob});

                    setTimeout(function() {
                        assert.equal(fileTestHelper.getRequests().length, 2, "Wrong # of requests");

                        uploadRequest = fileTestHelper.getRequests()[0];
                        signatureRequest = fileTestHelper.getRequests()[1];
                        policyDoc = JSON.parse(signatureRequest.requestBody);

                        qq.each(policyDoc.conditions, function(condIdx, condObj) {
                            var condName = Object.getOwnPropertyNames(condObj)[0];
                            conditions[condName] = condObj[condName];
                        });

                        assert.equal(conditions.bucket, "mybucket");
                        signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));
                        assert.equal(uploadRequest.url, testS3Endpoint);

                        uploadRequest.respond(200, {ETag: "123"}, null);

                        uploadSuccessRequest = fileTestHelper.getRequests()[2];
                        uploadSuccessRequestParsedBody = purl("http://test.com?" + uploadSuccessRequest.requestBody).param();
                        assert.equal(uploadSuccessRequestParsedBody.bucket, "mybucket");

                        done();
                    }, 10);
                });
            };

        it("test basic upload w/ string for bucket", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        bucket: "mybucket"
                    },
                    uploadSuccess: {
                        endpoint: "upload/success"
                    }
                }
            );

            startTypicalTest(uploader, done);
        });

        it("test basic upload w/ simple function for bucket", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        bucket: function(id) {
                            assert.equal(id, 0, "unexpected ID passed to bucket function");
                            return "mybucket";
                        }
                    },
                    uploadSuccess: {
                        endpoint: "upload/success"
                    }
                }
            );

            startTypicalTest(uploader, done);
        });

        it("test basic upload w/ promissory function for bucket", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        bucket: function(id) {
                            assert.equal(id, 0, "unexpected ID passed to bucket function");
                            var promise = new qq.Promise();
                            promise.success("mybucket");
                            return promise;
                        }
                    },
                    uploadSuccess: {
                        endpoint: "upload/success"
                    }
                }
            );

            startTypicalTest(uploader, done);
        });
    });
}
