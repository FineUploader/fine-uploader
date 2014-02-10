/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("simple file uploads, mocked server/XHR", function() {
        "use strict";

        var testUploadEndpoint = "/test/upload",
            fileTestHelper = helpme.setupFileTests();

        function getSimpleUploader(autoUpload, mpe) {
            var uploader = new qq.FineUploaderBasic({
                autoUpload: autoUpload,
                request: {
                    endpoint: testUploadEndpoint,
                    paramsInBody: mpe,
                    forceMultipart: mpe
                },
                callbacks: {
                    onUpload: function(id, name) {
                        assert.equal(id, 0, "Wrong ID sent to onUpload");
                        assert.equal(name, "test", "Wrong name sent to onUpload");
                    },
                    onComplete: function(id, name, response, xhr) {
                        assert.deepEqual(response, {success: true}, "Server response parsing failed");
                        assert.equal(uploader.getUploads().length, 1, "Expected only 1 file");
                        assert.equal(uploader.getUploads({status: qq.status.UPLOAD_SUCCESSFUL}).length, 1, "Expected 1 successful file");
                        /* jshint eqnull:true */
                        assert.ok(xhr != null, "XHR not passed to onComplete");
                        assert.equal(uploader.getNetUploads(), 1, "Wrong # of net uploads");
                    },
                    onProgress: function(id, name, uploaded, total) {
                        assert.equal(id, 0, "Wrong ID sent to onProgress");
                        assert.equal(name, "test", "Wrong name sent to onProgress");
                        assert.ok(uploaded > 0, "Invalid onProgress uploaded param");
                        assert.ok(total > 0, "Invalid onProgress total param");
                    }
                }
            });

            return uploader;
        }

        it("handles a simple successful single MPE file upload request correctly", function(done) {
            assert.expect(18, done);

            var uploader = getSimpleUploader(false, true);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var request,
                    requestParams;

                uploader.addBlobs({name: "test", blob: blob});
                uploader.uploadStoredFiles();

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];
                requestParams = request.requestBody.fields;

                assert.equal(requestParams.qquuid, uploader.getUuid(0), "Wrong UUID param sent with request");
                assert.equal(requestParams.qqfilename, uploader.getName(0), "Wrong filename param sent with request");
                assert.equal(requestParams.qqtotalfilesize, uploader.getSize(0), "Wrong file size param sent with request");
                assert.ok(qq.isBlob(requestParams.qqfile), "File is incorrect");
                assert.equal(request.method, "POST", "Wrong request method");
                assert.equal(request.url, testUploadEndpoint, "Wrong request url");

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
            });
        });

        it("handles a simple successful single non-MPE file upload request correctly", function(done) {
            assert.expect(17, done);

            var uploader = getSimpleUploader(true, false);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var request, purlUrl;

                uploader.addBlobs({name: "test", blob: blob});

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];
                purlUrl = purl(request.url);

                assert.equal(request.requestHeaders["X-Mime-Type"], "image/jpeg", "Wrong X-Mime-Type");
                assert.equal(purlUrl.param("qquuid"), uploader.getUuid(0), "Wrong UUID param sent with request");
                assert.equal(purlUrl.param("qqfilename"), uploader.getName(0), "Wrong filename param sent with request");
                assert.equal(request.method, "POST", "Wrong request method");
                assert.equal(purlUrl.attr("path"), testUploadEndpoint, "Wrong request url");

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
            });
        });

        it("properly passes overridden default param names along with the request", function(done) {
            var inputParamName = "testinputname",
                uuidParamName = "testuuidname",
                totalFileSizeParamName = "testtotalfilesize",
                filenameParamName = "testfilename",
                uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint,
                        inputName: inputParamName,
                        uuidName: uuidParamName,
                        totalFileSizeName: totalFileSizeParamName,
                        filenameParam: filenameParamName
                    }
                }
            );

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var request, requestParams;

                uploader.addBlobs(blob);

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];
                requestParams = request.requestBody.fields;

                assert.equal(requestParams[uuidParamName], uploader.getUuid(0), "Wrong UUID param sent with request");
                assert.equal(requestParams[filenameParamName], uploader.getName(0), "Wrong filename param sent with request");
                assert.equal(requestParams[totalFileSizeParamName], uploader.getSize(0), "Wrong file size param sent with request");
                assert.ok(qq.isBlob(requestParams[inputParamName]), "File is incorrect");
                done();
            });
        });

        it("handles overriden UUID via API", function(done) {
            assert.expect(1, done);

            var uploader = new qq.FineUploaderBasic({
                autoUpload: false
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                uploader.addBlobs(blob);
                uploader.setUuid(0, "123");
                assert.equal(uploader.getUuid(0), "123");
            });
        });

        it("handles overriden UUID via response", function(done) {
            var newUuid = "12345";

            assert.expect(1, done);

            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                callbacks: {
                    onComplete: function(id, name, response, xhr) {
                        assert.equal(uploader.getUuid(0), newUuid);
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                uploader.addBlobs(blob);

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true, newUuid: newUuid}));
            });
        });

        it("handles overriden name via API", function(done) {
            var newName = "newname123";

            assert.expect(1, done);

            var uploader = new qq.FineUploaderBasic({
                autoUpload: false
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                uploader.addBlobs(blob);
                uploader.setName(0, newName);
                assert.equal(uploader.getName(0), newName);
            });
        });

        describe("QUEUED status tests to cover #1104", function() {
            function runQueuedStatusTest(autoUpload, done) {
                assert.expect(1, done);

                var uploader = new qq.FineUploaderBasic({
                    maxConnections: 1,
                    autoUpload: autoUpload,
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    callbacks: {
                        onStatusChange: function(id, oldStatus, newStatus) {
                            if (id === 1 && oldStatus === qq.status.SUBMITTED) {
                                assert.equal(newStatus, qq.status.QUEUED);
                            }
                        }
                    }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                    fileTestHelper.mockXhr();

                    uploader.addBlobs([blob, blob]);
                    setTimeout(function() {
                        autoUpload || uploader.uploadStoredFiles();
                    }, 0);
                });
            }

            it("reports 'waiting' files as QUEUED in auto upload mode", function(done) {
                runQueuedStatusTest(true, done);
            });

            it("reports 'waiting' files as QUEUED in manual upload mode after call to uploadStoredFiles()", function(done) {
                runQueuedStatusTest(false, done);
            });
        });

        it("handles an empty array of files or blobs appropriately", function(done) {
            assert.expect(2, done);

            var uploader = new qq.FineUploaderBasic({
                callbacks: {
                    onError: function(id) {
                        assert.ok(true);
                    }
                }
            });

            uploader.addBlobs([]);
            uploader.addFiles([]);
        });

        it("marks an upload as failed if the status indicates failure, even if the response body indicates success", function(done) {
            assert.expect(2, done);

            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: "/test/endpoint"
                },
                callbacks: {
                    onComplete: function(id, name, response, xhr) {
                        assert.ok(!response.success);
                        assert.equal(uploader.getUploads()[0].status, qq.status.UPLOAD_FAILED);
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                uploader.addBlobs(blob);
                fileTestHelper.getRequests()[0].respond(500, null, JSON.stringify({success: true}));
            });
        });
    });
}
