/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("no-server S3 upload tests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testS3Endpoint = "https://mytestbucket.s3.amazonaws.com",
            testAccessKey = "testAccessKey",
            testSecretKey = "testSecretKey",
            testSessionToken = "testSessionToken";

        it("test simple upload with only mandatory credentials specified as options", function(done) {
            assert.expect(14, done);

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
                uploader.addBlobs({name: "test", blob: blob});

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
                assert.equal(requestParams.key, uploader.getKey(0));
                assert.equal(requestParams.AWSAccessKeyId, testAccessKey);
                assert.equal(requestParams.acl, "private");
                assert.ok(requestParams.file);


                assert.ok(requestParams.signature);
                assert.ok(requestParams.policy);
            });
        });

        it("test simple upload with all credential options specified", function(done) {
            assert.expect(1, done);

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
                uploader.addBlobs({name: "test", blob: blob});

                request = fileTestHelper.getRequests()[0];
                requestParams = request.requestBody.fields;

                assert.equal(requestParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME], testSessionToken);
            });
        });

        it("test simple upload with credentials only specified via API method", function(done) {
            assert.expect(14, done);

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
                uploader.addBlobs({name: "test", blob: blob});

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
                assert.equal(requestParams.key, uploader.getKey(0));
                assert.equal(requestParams.AWSAccessKeyId, testAccessKey);
                assert.equal(requestParams.acl, "private");
                assert.ok(requestParams.file);


                assert.ok(requestParams.signature);
                assert.ok(requestParams.policy);
            });
        });

        it("test credentialsExpired callback", function(done) {
            assert.expect(15, done);

            var testExpiration = new Date(Date.now() - 1000),
                testAccessKeyFromCallback = "testAccessKeyFromCallback",
                testSessionTokenFromCallback = "testSessionTokenFromCallback",
                uploader = new qq.s3.FineUploaderBasic({
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
                    onCredentialsExpired: function() {
                        assert.ok(true);

                        var promise = new qq.Promise();
                        promise.success({
                            accessKey: testAccessKeyFromCallback,
                            secretKey: testSecretKey,
                            expiration: new Date(Date.now() + 10000),
                            sessionToken: testSessionTokenFromCallback
                        });
                        return promise;
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                var request, requestParams;

                fileTestHelper.mockXhr();
                uploader.addBlobs({name: "test", blob: blob});

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
                assert.equal(requestParams.key, uploader.getKey(0));
                assert.equal(requestParams.AWSAccessKeyId, testAccessKeyFromCallback);
                assert.equal(requestParams.acl, "private");
                assert.ok(requestParams.file);


                assert.ok(requestParams.signature);
                assert.ok(requestParams.policy);
            });
        });
    });
}

describe("non-file-based tests", function() {
    "use strict";

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
