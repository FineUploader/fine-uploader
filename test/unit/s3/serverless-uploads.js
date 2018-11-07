/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl, Q */
describe("S3 serverless upload tests", function() {
    "use strict";

    if (qqtest.canDownloadFileAsBlob) {
        describe("no-server S3 upload tests", function() {

            var fileTestHelper = helpme.setupFileTests(),
                testS3Endpoint = "https://mytestbucket.s3.amazonaws.com",
                testAccessKey = "testAccessKey",
                testSecretKey = "testSecretKey",
                testSessionToken = "testSessionToken";

            describe("v4 signatures", function() {
                it("test simple upload with only mandatory credentials specified as options", function(done) {
                    var testExpiration = new Date(Date.now() + 10000),
                        uploader = new qq.s3.FineUploaderBasic({
                            request: {
                                endpoint: testS3Endpoint
                            },
                            signature: {
                                version: 4
                            },
                            credentials: {
                                accessKey: testAccessKey,
                                secretKey: testSecretKey,
                                expiration: testExpiration
                            }
                        });

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        var request, requestParams;

                        fileTestHelper.mockXhr();
                        uploader.addFiles({name: "test", blob: blob});
                        setTimeout(function () {
                            assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                            request = fileTestHelper.getRequests()[0];
                            requestParams = request.requestBody.fields;

                            assert.equal(request.url, testS3Endpoint);
                            assert.equal(request.method, "POST");

                            assert.equal(requestParams["Content-Type"], "image/jpeg");
                            assert.equal(requestParams.success_action_status, 200);
                            assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], null);
                            assert.equal(requestParams["x-amz-storage-class"], null);
                            assert.equal(requestParams["x-amz-meta-qqfilename"], "test");
                            uploader.getKey(0).then(function(key0) {
                                assert.equal(requestParams.key, key0);
                                assert.equal(requestParams.acl, "private");
                                assert.ok(requestParams.file);

                                assert.equal(requestParams["x-amz-algorithm"], "AWS4-HMAC-SHA256");
                                assert.ok(new RegExp(testAccessKey + "\\/\\d{8}\\/us-east-1\\/s3\\/aws4_request").test(requestParams["x-amz-credential"]));
                                assert.ok(requestParams["x-amz-date"]);
                                assert.ok(requestParams["x-amz-signature"]);
                                assert.ok(requestParams.policy);

                                done();
                            });
                        }, 0);
                    });
                });
            });

            it("test simple upload with only mandatory credentials specified as options", function(done) {
                var testExpiration = new Date(Date.now() + 10000),
                    uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            endpoint: testS3Endpoint
                        },
                        credentials: {
                            accessKey: testAccessKey,
                            secretKey: testSecretKey,
                            expiration: testExpiration
                        }
                    });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var request, requestParams;

                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                    setTimeout(function () {
                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        request = fileTestHelper.getRequests()[0];
                        requestParams = request.requestBody.fields;

                        assert.equal(request.url, testS3Endpoint);
                        assert.equal(request.method, "POST");

                        assert.equal(requestParams["Content-Type"], "image/jpeg");
                        assert.equal(requestParams.success_action_status, 200);
                        assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], null);
                        assert.equal(requestParams["x-amz-storage-class"], null);
                        assert.equal(requestParams["x-amz-meta-qqfilename"], "test");
                        uploader.getKey(0).then(function(key0) {
                            assert.equal(requestParams.key, key0);
                            assert.equal(requestParams.AWSAccessKeyId, testAccessKey);
                            assert.equal(requestParams.acl, "private");
                            assert.ok(requestParams.file);

                            assert.ok(requestParams.signature);
                            assert.ok(requestParams.policy);

                            done();
                        });
                    }, 0);
                });
            });

            it("test simple upload with all credential options specified", function(done) {
                var testExpiration = new Date(Date.now() + 10000).toISOString(),
                    uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            endpoint: testS3Endpoint
                        },
                        credentials: {
                            accessKey: testAccessKey,
                            secretKey: testSecretKey,
                            expiration: testExpiration,
                            sessionToken: testSessionToken
                        }
                    });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var request, requestParams;

                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                    setTimeout(function () {
                        request = fileTestHelper.getRequests()[0];
                        requestParams = request.requestBody.fields;

                        assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], testSessionToken);
                        done();
                    }, 0);
                });
            });

            it("test simple upload with credentials only specified via API method", function(done) {
                var testExpiration = new Date(Date.now() + 10000),
                    uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            endpoint: testS3Endpoint
                        }
                    });

                uploader.setCredentials({
                    accessKey: testAccessKey,
                    secretKey: testSecretKey,
                    expiration: testExpiration,
                    sessionToken: testSessionToken
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    var request, requestParams;

                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                    setTimeout(function () {
                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        request = fileTestHelper.getRequests()[0];
                        requestParams = request.requestBody.fields;

                        assert.equal(request.url, testS3Endpoint);
                        assert.equal(request.method, "POST");

                        assert.equal(requestParams["Content-Type"], "image/jpeg");
                        assert.equal(requestParams.success_action_status, 200);
                        assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], testSessionToken);
                        assert.equal(requestParams["x-amz-storage-class"], null);
                        assert.equal(requestParams["x-amz-meta-qqfilename"], "test");
                        uploader.getKey(0).then(function (key0) {
                            assert.equal(requestParams.key, key0);
                            assert.equal(requestParams.AWSAccessKeyId, testAccessKey);
                            assert.equal(requestParams.acl, "private");
                            assert.ok(requestParams.file);

                            assert.ok(requestParams.signature);
                            assert.ok(requestParams.policy);
                            done();
                        });
                    }, 0);
                });
            });

            describe("test credentialsExpired callback", function() {
                var testExpiration = new Date(Date.now() - 1000),
                    testAccessKeyFromCallback = "testAccessKeyFromCallback",
                    testSessionTokenFromCallback = "testSessionTokenFromCallback";

                function runTest(callback, done) {
                    var uploader = new qq.s3.FineUploaderBasic({
                        request: {
                            endpoint: testS3Endpoint
                        },
                        credentials: {
                            accessKey: testAccessKey,
                            secretKey: testSecretKey,
                            expiration: testExpiration,
                            sessionToken: testSessionToken
                        },
                        callbacks: {
                            onCredentialsExpired: callback
                        }
                    });

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        var request, requestParams;

                        fileTestHelper.mockXhr();
                        uploader.addFiles({name: "test", blob: blob});

                        setTimeout(function() {
                            assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                            request = fileTestHelper.getRequests()[0];
                            requestParams = request.requestBody.fields;

                            assert.equal(request.url, testS3Endpoint);
                            assert.equal(request.method, "POST");

                            assert.equal(requestParams["Content-Type"], "image/jpeg");
                            assert.equal(requestParams.success_action_status, 200);
                            assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], testSessionTokenFromCallback);
                            assert.equal(requestParams["x-amz-storage-class"], null);
                            assert.equal(requestParams["x-amz-meta-qqfilename"], "test");
                            uploader.getKey(0).then(function(key0) {
                                assert.equal(requestParams.key, key0);
                                assert.equal(requestParams.AWSAccessKeyId, testAccessKeyFromCallback);
                                assert.equal(requestParams.acl, "private");
                                assert.ok(requestParams.file);

                                assert.ok(requestParams.signature);
                                assert.ok(requestParams.policy);

                                done();
                            });
                        }, 10);
                    });
                }

                it("Promise", function(done) {
                    var callback = function() {
                        assert.ok(true);

                        return Promise.resolve({
                            accessKey: testAccessKeyFromCallback,
                            secretKey: testSecretKey,
                            expiration: new Date(Date.now() + 10000),
                            sessionToken: testSessionTokenFromCallback
                        });
                    };

                    runTest(callback, done);
                });
            });
        });
    }

    describe("non-file-based tests", function() {
        it("enforces mandatory credentials", function() {
            var uploader = new qq.s3.FineUploaderBasic({});

            assert.doesNotThrow(
                function() {
                    uploader.setCredentials({
                        accessKey: "ak",
                        secretKey: "sk",
                        expiration: new Date()
                    });
                }
            );

            assert.throws(
                function() {
                    uploader.setCredentials({
                        accessKey: "ak",
                        secretKey: "sk"
                    });
                }, qq.Error
            );

            assert.throws(
                function() {
                    uploader.setCredentials({
                        accessKey: "ak",
                        expiration: new Date()
                    });
                }, qq.Error
            );

            assert.throws(
                function() {
                    uploader.setCredentials({
                        secretKey: "sk",
                        expiration: new Date()
                    });
                }, qq.Error
            );
        });

    });
});
