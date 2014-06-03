/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl, Q */
if (qqtest.canDownloadFileAsBlob) {
    describe("simple S3 upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "https://mytestbucket.s3.amazonaws.com",
            testBucketName = "mytestbucket",
            testSignatureEndoint = "/signature",
            testAccessKey = "testAccessKey",
            typicalRequestOption = {
                accessKey: testAccessKey,
                endpoint: testS3Endpoint
            },
            typicalSignatureOption = {
                endpoint: testSignatureEndoint
            },
            startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest, uploadRequest, policyDoc,
                        conditions = {};

                    fileTestHelper.mockXhr();
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    setTimeout(function() {
                        assert.equal(fileTestHelper.getRequests().length, 2, "Wrong # of requests");

                        uploadRequest = fileTestHelper.getRequests()[0];
                        signatureRequest = fileTestHelper.getRequests()[1];
                        policyDoc = JSON.parse(signatureRequest.requestBody);

                        qq.each(policyDoc.conditions, function(condIdx, condObj) {
                            var condName = Object.getOwnPropertyNames(condObj)[0];
                            conditions[condName] = condObj[condName];
                        });

                        callback(signatureRequest, policyDoc, uploadRequest, conditions);
                    }, 10);
                });
            };

        it("test most basic upload w/ signature request", function(done) {
            assert.expect(24, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(signatureRequest.method, "POST");
                assert.equal(signatureRequest.url, testSignatureEndoint);
                assert.equal(signatureRequest.requestHeaders["Content-Type"].indexOf("application/json;"), 0);

                assert.ok(new Date(policyDoc.expiration).getTime() > Date.now());
                assert.equal(policyDoc.conditions.length, 6);

                assert.equal(conditions.acl, "private");
                assert.equal(conditions.bucket, testBucketName);
                assert.equal(conditions.success_action_status, 200);
                assert.equal(conditions.key, uploader.getKey(0));
                assert.equal(conditions.key, uploader.getUuid(0) + ".jpg");
                assert.equal(conditions["x-amz-meta-qqfilename"], "test.jpg");

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;

                assert.equal(uploadRequest.url, testS3Endpoint);
                assert.equal(uploadRequest.method, "POST");

                assert.equal(uploadRequestParams["Content-Type"], "image/jpeg");
                assert.equal(uploadRequestParams.success_action_status, 200);
                assert.equal(uploadRequestParams["x-amz-storage-class"], null);
                assert.equal(uploadRequestParams["x-amz-meta-qqfilename"], "test.jpg");
                assert.equal(uploadRequestParams.key, uploader.getUuid(0) + ".jpg");
                assert.equal(uploadRequestParams.AWSAccessKeyId, testAccessKey);
                assert.equal(uploadRequestParams.acl, "private");
                assert.ok(uploadRequestParams.file);

                assert.equal(uploadRequestParams.signature, "thesignature");
                assert.equal(uploadRequestParams.policy, "thepolicy");
            });
        });

        it("converts all parameters (metadata) to lower case before sending them to S3", function(done) {
            assert.expect(5, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: typicalSignatureOption
                }
            );

            uploader.setParams({
                mIxEdCaSe: "value",
                mIxEdCaSeFunc: function() {
                    return "value2";
                }
            });

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions["x-amz-meta-mixedcase"], "value");
                assert.equal(conditions["x-amz-meta-mixedcasefunc"], "value2");
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;

                assert.equal(uploadRequestParams["x-amz-meta-mixedcase"], "value");
                assert.equal(uploadRequestParams["x-amz-meta-mixedcasefunc"], "value2");
            });
        });

        it("respects the objectProperties.key option w/ a value of 'filename'", function(done) {
            assert.expect(5, done);

            var uploader = new qq.s3.FineUploaderBasic({
                request:typicalRequestOption,
                signature: typicalSignatureOption,
                objectProperties: {
                    key: "filename"
                }
            });

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions.key, "test.jpg");
                assert.equal(uploader.getKey(0), "test.jpg");
                assert.equal(conditions["x-amz-meta-qqfilename"], "test.jpg");

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;

                assert.equal(uploadRequestParams["x-amz-meta-qqfilename"], "test.jpg");
            });
        });

        it("respects the objectProperties.key option w/ a custom key generation function", function(done) {
            assert.expect(5, done);

            var customKeyPrefix = "testcustomkey_",
                uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        key: function(id) {
                            return customKeyPrefix + this.getName(id);
                        }
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions.key, customKeyPrefix + "test.jpg");
                assert.equal(uploader.getKey(0), customKeyPrefix + "test.jpg");
                assert.equal(conditions["x-amz-meta-qqfilename"], "test.jpg");
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams["x-amz-meta-qqfilename"], "test.jpg");
            });
        });

        describe("respects the objectProperties.key option w/ a custom key generation function that returns a promise", function() {
            var customKeyPrefix = "testcustomkey_";

            function runTest(keyFunc, done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request:typicalRequestOption,
                        signature: typicalSignatureOption,
                        objectProperties: {
                            key: keyFunc
                        }
                    }
                );

                startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                    var uploadRequestParams;

                    assert.equal(conditions.key, customKeyPrefix + "test.jpg");
                    assert.equal(uploader.getKey(0), customKeyPrefix + "test.jpg");
                    assert.equal(conditions["x-amz-meta-qqfilename"], "test.jpg");
                    signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                    uploadRequestParams = uploadRequest.requestBody.fields;
                    assert.equal(uploadRequestParams["x-amz-meta-qqfilename"], "test.jpg");

                    done();
                });
            }

            it("qq.Promise", function(done) {
                var keyFunc = function(id) {
                    return new qq.Promise().success(customKeyPrefix + this.getName(id));
                };

                runTest(keyFunc, done);
            });

            it("Q.js", function(done) {
                var keyFunc = function(id) {
                    /* jshint newcap:false */
                    return Q(customKeyPrefix + this.getName(id));
                };

                runTest(keyFunc, done);
            });
        });


        describe("respects the objectProperties.key option w/ a custom key generation function that returns a failed promise (no reason)", function() {
            function runTest(keyFunc, done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request:typicalRequestOption,
                        signature: typicalSignatureOption,
                        objectProperties: {
                            key: keyFunc
                        }
                    }
                );

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 0, "Wrong # of requests");

                    done();
                });
            }

            it("qq.Promise", function(done) {
                var keyFunc = function() {
                    return new qq.Promise().failure();
                };

                runTest(keyFunc, done);
            });

            it("Q.js", function(done) {
                var keyFunc = function() {
                    return Q.reject();
                };

                runTest(keyFunc, done);
            });
        });

        describe("respects the objectProperties.key option w/ a custom key generation function that returns a failed promise (w/ reason)", function() {
            function runTest(keyFunc, done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request:typicalRequestOption,
                        signature: typicalSignatureOption,
                        objectProperties: {
                            key: keyFunc
                        },
                        callbacks: {
                            onComplete: function(id, name, response, xhr) {
                                assert.equal(response.error, "oops");
                                assert.ok(!response.success);
                                done();
                            }
                        }
                    }
                );

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    uploader.addBlobs({name: "test.jpg", blob: blob});

                    assert.equal(fileTestHelper.getRequests().length, 0, "Wrong # of requests");
                });
            }

            it("qq.Promise", function(done) {
                var keyFunc = function() {
                    return new qq.Promise().failure("oops");
                };

                runTest(keyFunc, done);
            });

            it("qq.Promise", function(done) {
                var keyFunc = function() {
                    return Q.reject("oops");
                };

                runTest(keyFunc, done);
            });
        });

        it("respects the objectProperties.acl option w/ a custom value set via option", function(done) {
            assert.expect(3, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        acl: "public-read"
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions.acl, "public-read");
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams.acl, "public-read");
            });
        });

        it("respects the objectProperties.acl option w/ a custom value set via API", function(done) {
            assert.expect(3, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        acl: "public-read"
                    }
                }
            );

            uploader.setAcl("test-acl", 0);

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions.acl, "test-acl");
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams.acl, "test-acl");
            });
        });

        it("respects the objectProperties.reducedRedundancy option w/ a value of true", function(done) {
            assert.expect(3, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        reducedRedundancy: true
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME], qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE);
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME], qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE);
            });
        });

        it("respects the objectProperties.serverSideEncryption option w/ a value of true", function(done) {
            assert.expect(3, done);

            var uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    objectProperties: {
                        serverSideEncryption: true
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME], qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE);
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME], qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE);
            });
        });

        it("respects custom headers to be sent with signature request", function(done) {
            assert.expect(2, done);

            var customHeader = {"test-header-name": "test-header-value"},
                customSignatureOptions = qq.extend({}, typicalSignatureOption),
                uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: qq.extend(customSignatureOptions, {customHeaders: customHeader})
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                assert.equal(signatureRequest.requestHeaders["test-header-name"], customHeader["test-header-name"]);
            });
        });

        it("sends uploadSuccess request after upload succeeds", function(done) {
            var uploadSuccessUrl = "/upload/success",
                uploadSuccessParams = {"test-param-name": "test-param-value"},
                uploadSuccessHeaders = {"test-header-name": "test-header-value"},
                uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    uploadSuccess: {
                        endpoint: uploadSuccessUrl,
                        params: uploadSuccessParams,
                        customHeaders: uploadSuccessHeaders
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest) {
                var uploadSuccessRequest, uploadSuccessRequestParsedBody;

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));
                uploadRequest.respond(200, {ETag: "123"}, null);

                assert.equal(fileTestHelper.getRequests().length, 3, "Wrong # of requests");
                uploadSuccessRequest = fileTestHelper.getRequests()[2];
                uploadSuccessRequestParsedBody = purl("http://test.com?" + uploadSuccessRequest.requestBody).param();
                assert.equal(uploadSuccessRequest.url, uploadSuccessUrl);
                assert.equal(uploadSuccessRequest.method, "POST");
                assert.equal(uploadSuccessRequest.requestHeaders["Content-Type"].indexOf("application/x-www-form-urlencoded"), 0);
                assert.equal(uploadSuccessRequest.requestHeaders["test-header-name"], uploadSuccessHeaders["test-header-name"]);
                assert.equal(uploadSuccessRequestParsedBody["test-param-name"], uploadSuccessParams["test-param-name"]);
                assert.equal(uploadSuccessRequestParsedBody.key, uploader.getKey(0));
                assert.equal(uploadSuccessRequestParsedBody.uuid, uploader.getUuid(0));
                assert.equal(uploadSuccessRequestParsedBody.name, uploader.getName(0));
                assert.equal(uploadSuccessRequestParsedBody.bucket, testBucketName);
                assert.equal(uploadSuccessRequestParsedBody.etag, "123");

                uploadSuccessRequest.respond(200, null, null);
                assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);

                done();
            });
        });

        it("declares an upload as a failure if uploadSuccess response indicates a problem with the file", function(done) {
            assert.expect(2, done);

            var uploadSuccessUrl = "/upload/success",
                uploader = new qq.s3.FineUploaderBasic({
                    request:typicalRequestOption,
                    signature: typicalSignatureOption,
                    uploadSuccess: {
                        endpoint: uploadSuccessUrl
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadSuccessRequest, uploadSuccessRequestParsedBody;

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));
                uploadRequest.respond(200, null, null);

                uploadSuccessRequest = fileTestHelper.getRequests()[2];
                uploadSuccessRequest.respond(200, null, JSON.stringify({success: false}));
                assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
            });
        });
    });
}
