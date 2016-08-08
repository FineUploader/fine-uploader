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
            v2SignatureOption = {
                endpoint: testSignatureEndoint
            },
            v4SignatureOption = {
                endpoint: testSignatureEndoint,
                version: 4
            },
            startTypicalTest = function(uploader, callback) {
                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var signatureRequest, uploadRequest, policyDoc,
                        conditions = {};

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

                        callback(signatureRequest, policyDoc, uploadRequest, conditions);
                    }, 10);
                });
            };

        describe("v4 signatures", function() {
            it("test most basic upload w/ signature request", function(done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: v4SignatureOption
                    }
                );

                startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                    var uploadRequestParams,
                        now = new Date(),
                        policyDate;

                    assert.equal(signatureRequest.method, "POST");
                    assert.equal(signatureRequest.url, testSignatureEndoint + "?v4=true");
                    assert.equal(signatureRequest.requestHeaders["Content-Type"].indexOf("application/json;"), 0);

                    assert.ok(new Date(policyDoc.expiration).getTime() > Date.now());
                    assert.equal(policyDoc.conditions.length, 9);

                    assert.equal(conditions.acl, "private");
                    assert.equal(conditions.bucket, testBucketName);
                    assert.equal(conditions["Content-Type"], "image/jpeg");
                    assert.equal(conditions.success_action_status, 200);
                    assert.equal(conditions["x-amz-algorithm"], "AWS4-HMAC-SHA256");
                    assert.equal(conditions.key, uploader.getKey(0));
                    assert.equal(conditions.key, uploader.getUuid(0) + ".jpg");
                    assert.equal(conditions["x-amz-credential"], testAccessKey + "/" + now.getUTCFullYear() + ("0" + (now.getUTCMonth() + 1)).slice(-2) + ("0" + now.getUTCDate()).slice(-2) + "/us-east-1/s3/aws4_request");
                    policyDate = conditions["x-amz-date"];
                    assert.ok(policyDate);
                    assert.equal(conditions["x-amz-meta-qqfilename"], "test.jpg");

                    signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                    uploadRequestParams = uploadRequest.requestBody.fields;

                    assert.equal(uploadRequest.url, testS3Endpoint);
                    assert.equal(uploadRequest.method, "POST");

                    assert.equal(uploadRequestParams.key, uploader.getUuid(0) + ".jpg");
                    assert.equal(uploadRequestParams["Content-Type"], "image/jpeg");
                    assert.equal(uploadRequestParams.success_action_status, 200);
                    assert.equal(uploadRequestParams.acl, "private");
                    assert.equal(uploadRequestParams["x-amz-meta-qqfilename"], "test.jpg");
                    assert.equal(uploadRequestParams["x-amz-algorithm"], "AWS4-HMAC-SHA256");
                    assert.equal(uploadRequestParams["x-amz-credential"], testAccessKey + "/" + now.getUTCFullYear() + ("0" + (now.getUTCMonth() + 1)).slice(-2) + ("0" + now.getUTCDate()).slice(-2) + "/us-east-1/s3/aws4_request");
                    assert.equal(uploadRequestParams["x-amz-date"], policyDate);

                    assert.ok(uploadRequestParams.file);

                    assert.equal(uploadRequestParams["x-amz-signature"], "thesignature");
                    assert.equal(uploadRequestParams.policy, "thepolicy");

                    done();
                });
            });

            it("handles slow browser system clock", function(done) {
                var clockDrift = 1000 * 60 * 60, // slow by 1 hour
                    uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            accessKey: testAccessKey,
                            clockDrift: clockDrift,
                            endpoint: testS3Endpoint
                        },
                        signature: v4SignatureOption
                    });

                startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                    var uploadRequestParams,
                        now = new Date(new Date().getTime() + clockDrift),
                        policyDate;

                    assert.ok(new Date(policyDoc.expiration).getTime() > now);
                    policyDate = conditions["x-amz-date"];
                    signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                    uploadRequestParams = uploadRequest.requestBody.fields;
                    assert.equal(uploadRequestParams["x-amz-date"], policyDate);
                    done();
                });
            });

            it("handles fast browser system clock", function(done) {
                var clockDrift = -1000 * 60 * 60, // fast by 1 hour
                    uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            accessKey: testAccessKey,
                            clockDrift: clockDrift,
                            endpoint: testS3Endpoint
                        },
                        signature: v4SignatureOption
                    }
                );

                startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                    var uploadRequestParams,
                        now = new Date(new Date().getTime() + clockDrift),
                        policyDate;

                    assert.ok(new Date(policyDoc.expiration).getTime() > now);
                    policyDate = conditions["x-amz-date"];
                    signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                    uploadRequestParams = uploadRequest.requestBody.fields;
                    assert.equal(uploadRequestParams["x-amz-date"], policyDate);
                    done();
                });
            });
        });

        it("test most basic upload w/ signature request", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption
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

                done();
            });
        });

        it("handles slow browser system clock", function(done) {
            var clockDrift = 1000 * 60 * 60, // slow by 1 hour
                uploader = new qq.s3.FineUploaderBasic({
                    request: {
                        accessKey: testAccessKey,
                        clockDrift: clockDrift,
                        endpoint: testS3Endpoint
                    },
                    signature: v2SignatureOption
                });

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams,
                    now = new Date(new Date().getTime() + clockDrift),
                    policyDate;

                assert.ok(new Date(policyDoc.expiration).getTime() > now);
                policyDate = conditions["x-amz-date"];
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams["x-amz-date"], policyDate);
                done();
            });
        });

        it("handles fast browser system clock", function(done) {
            var clockDrift = -1000 * 60 * 60, // fast by 1 hour
                uploader = new qq.s3.FineUploaderBasic({
                    request: {
                        accessKey: testAccessKey,
                        clockDrift: clockDrift,
                        endpoint: testS3Endpoint
                    },
                    signature: v2SignatureOption
                });

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams,
                    now = new Date(new Date().getTime() + clockDrift),
                    policyDate;

                assert.ok(new Date(policyDoc.expiration).getTime() > now);
                policyDate = conditions["x-amz-date"];
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;
                assert.equal(uploadRequestParams["x-amz-date"], policyDate);
                done();
            });
        });

        it("converts all parameters (metadata) to lower case before sending them to S3, except for special params", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption
                }
            );

            uploader.setParams({
                mIxEdCaSe: "value",
                mIxEdCaSeFunc: function() {
                    return "value2";
                },
                "Content-Disposition": "attachment; filename=foo.bar;",
                "Cache-Control": "foo",
                "Content-Encoding": "bar"
            });

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadRequestParams;

                assert.equal(conditions["x-amz-meta-mixedcase"], "value");
                assert.equal(conditions["x-amz-meta-mixedcasefunc"], "value2");
                assert.equal(conditions["Content-Disposition"], "attachment; filename=foo.bar;");
                assert.equal(conditions["Cache-Control"], "foo");
                assert.equal(conditions["Content-Encoding"], "bar");
                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));

                uploadRequestParams = uploadRequest.requestBody.fields;

                assert.equal(uploadRequestParams["x-amz-meta-mixedcase"], "value");
                assert.equal(uploadRequestParams["x-amz-meta-mixedcasefunc"], "value2");
                assert.equal(uploadRequestParams["Content-Disposition"], "attachment; filename=foo.bar;");
                assert.equal(uploadRequestParams["Cache-Control"], "foo");
                assert.equal(uploadRequestParams["Content-Encoding"], "bar");

                done();
            });
        });

        it("respects the objectProperties.key option w/ a value of 'filename'", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                request: typicalRequestOption,
                signature: v2SignatureOption,
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

                done();
            });
        });

        it("respects the objectProperties.key option w/ a custom key generation function", function(done) {
            var customKeyPrefix = "testcustomkey_",
                uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
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

                done();
            });
        });

        describe("respects the objectProperties.key option w/ a custom key generation function that returns a promise", function() {
            var customKeyPrefix = "testcustomkey_";

            function runTest(keyFunc, done) {
                var uploader = new qq.s3.FineUploaderBasic({
                        request: typicalRequestOption,
                        signature: v2SignatureOption,
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
                        request: typicalRequestOption,
                        signature: v2SignatureOption,
                        objectProperties: {
                            key: keyFunc
                        }
                    }
                );

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    uploader.addFiles({name: "test.jpg", blob: blob});

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
                        request: typicalRequestOption,
                        signature: v2SignatureOption,
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
                    uploader.addFiles({name: "test.jpg", blob: blob});

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
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
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

                done();
            });
        });

        it("respects the objectProperties.acl option w/ a custom value set via API", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
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

                done();
            });
        });

        it("respects the objectProperties.reducedRedundancy option w/ a value of true", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
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

                done();
            });
        });

        it("respects the objectProperties.serverSideEncryption option w/ a value of true", function(done) {
            var uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
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

                done();
            });
        });

        it("respects custom headers to be sent with signature request", function(done) {
            var customHeader = {"test-header-name": "test-header-value"},
                customSignatureOptions = qq.extend({}, v2SignatureOption),
                uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: qq.extend(customSignatureOptions, {customHeaders: customHeader})
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                assert.equal(signatureRequest.requestHeaders["test-header-name"], customHeader["test-header-name"]);

                done();
            });
        });

        it("Sends uploadSuccess request after upload succeeds.  Also respects call to setUploadSuccessEndpoint method.", function(done) {
            var uploadSuccessUrl = "/upload/success",
                uploadSuccessParams = {"test-param-name": "test-param-value"},
                uploadSuccessHeaders = {"test-header-name": "test-header-value"},
                uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
                    uploadSuccess: {
                        endpoint: "foo/bar",
                        params: uploadSuccessParams,
                        customHeaders: uploadSuccessHeaders
                    }
                }
            );

            uploader.setUploadSuccessEndpoint(uploadSuccessUrl);
            uploader.setParams({foo: "bar"});

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
                assert.equal(uploadSuccessRequestParsedBody.foo, "bar");
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

        it("Declares an upload as a failure if uploadSuccess response indicates a problem with the file.  Also tests uploadSuccessRequest endpoint option.", function(done) {
            var uploadSuccessUrl = "/upload/success",
                uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
                    uploadSuccess: {
                        endpoint: uploadSuccessUrl
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadSuccessRequest;

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));
                uploadRequest.respond(200, null, null);

                uploadSuccessRequest = fileTestHelper.getRequests()[2];
                assert.equal(uploadSuccessRequest.url, uploadSuccessUrl);
                uploadSuccessRequest.respond(200, null, JSON.stringify({success: false}));
                assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);

                done();
            });
        });

        it("Allows upload success to be sent as something other than a POST.", function(done) {
            var uploadSuccessUrl = "/upload/success",
                uploader = new qq.s3.FineUploaderBasic({
                    request: typicalRequestOption,
                    signature: v2SignatureOption,
                    uploadSuccess: {
                        endpoint: uploadSuccessUrl,
                        method: "PUT"
                    }
                }
            );

            startTypicalTest(uploader, function(signatureRequest, policyDoc, uploadRequest, conditions) {
                var uploadSuccessRequest, uploadSuccessRequestParsedBody;

                signatureRequest.respond(200, null, JSON.stringify({policy: "thepolicy", signature: "thesignature"}));
                uploadRequest.respond(200, null, null);

                uploadSuccessRequest = fileTestHelper.getRequests()[2];
                assert.equal(uploadSuccessRequest.method, "PUT");
                uploadSuccessRequest.respond(200, null, null);
                assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_SUCCESSFUL);

                done();
            });
        });
    });
}
