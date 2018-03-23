/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("chunked uploads", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            expectedFileSize = 3266,
            expectedChunks = 3,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            params = {
                foo: "bar",
                one: 2
            },
            overridenChunkingParamNames = {
                chunkSize: "testchunksize",
                partByteOffset: "testpartbyteoffset",
                partIndex: "testpartindex",
                totalParts: "testtotalparts"
            };

        function testChunkedUpload(spec) {
            var customParams = spec.customParams || {},
                chunkingParamNames = spec.chunkingParamNames || new qq.FineUploaderBasic({})._options.chunking.paramNames;

            assert.expect(3 + (expectedChunks * (20 + (Object.keys(customParams).length))), spec.done);

            var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint,
                        paramsInBody: !!spec.mpe,
                        forceMultipart: !!spec.mpe,
                        params: customParams
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize,
                        paramNames: chunkingParamNames
                    },
                    resume: {
                        enabled: !!spec.resume
                    },
                    callbacks: {
                        onUploadChunk: function (id, name, chunkData) {
                            chunksSent++;

                            assert.equal(id, 0, "Wrong ID passed to onUploadChunk");
                            assert.equal(name, uploader.getName(id), "Wrong name passed to onUploadChunk");
                            assert.equal(chunkData.partIndex, chunksSent - 1, "Wrong partIndex passed to onUploadChunk");
                            assert.equal(chunkData.startByte, (chunksSent - 1) * chunkSize + 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.endByte, chunksSent === expectedChunks ? expectedFileSize : chunkData.startByte + chunkSize - 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.totalParts, expectedChunks, "Wrong totalParts passed to onUploadChunk");

                            setTimeout(function () {
                                var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1];
                                request.respond(200, null, JSON.stringify({success: true, testParam: "testVal"}));
                            }, 10);
                        },
                        onAutoRetry: function(id, name, attemptNumber) {
                            assert.fail("This should not be called");
                        },
                        onUploadChunkSuccess: function (id, chunkData, response, xhr) {
                            var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1],
                                requestParams;

                            chunksSucceeded++;

                            if (spec.mpe) {
                                requestParams = request.requestBody.fields;
                            }
                            else {
                                requestParams = purl(request.url).param();
                            }

                            assert.equal(requestParams.qquuid, uploader.getUuid(id), "Wrong uuid param");
                            assert.equal(requestParams[chunkingParamNames.partIndex], chunksSent - 1, "Wrong part index param");
                            assert.equal(requestParams[chunkingParamNames.partByteOffset], (chunksSent - 1) * chunkSize, "Wrong part byte offset param");
                            assert.equal(requestParams.qqtotalfilesize, expectedFileSize, "Wrong total file size param");
                            assert.equal(requestParams[chunkingParamNames.totalParts], expectedChunks, "Wrong total parts param");
                            assert.equal(requestParams.qqfilename, uploader.getName(id), "Wrong filename param");
                            assert.equal(requestParams[chunkingParamNames.chunkSize], spec.mpe ? requestParams.qqfile.size : request.requestBody.size, "Wrong chunk size param");
                            assert.equal(id, 0, "Wrong ID passed to onUpoadChunkSuccess");

                            qq.each(customParams, function(key, val) {
                                assert.equal(requestParams[key], val, qq.format("Wrong value for {} param", key));
                            });

                            assert.equal(chunkData.partIndex, chunksSucceeded - 1, "Wrong partIndex passed to onUploadChunkSuccess");
                            assert.equal(chunkData.startByte, (chunksSent - 1) * chunkSize + 1, "Wrong startByte passed to onUploadChunkSuccess");
                            assert.equal(chunkData.endByte, chunksSucceeded === expectedChunks ? expectedFileSize : chunkData.startByte + chunkSize-1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.totalParts, expectedChunks, "Wrong totalParts passed to onUploadChunkSuccess");

                            assert.equal(response.testParam, "testVal");
                            assert.ok(xhr);
                        },
                        onComplete: function (id, name, response) {
                            assert.equal(expectedChunks, chunksSent, "Wrong # of chunks sent.");
                            assert.equal(expectedChunks, chunksSucceeded, "Wrong # of chunks succeeded");
                            assert.equal(response.testParam, "testVal");
                        }
                    }
                }),
                chunksSent = 0,
                chunksSucceeded = 0;

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addFiles({name: "test", blob: blob});
            });
        }

        function testChunkedFailureAndRecovery(restartAfterFailure, done) {
            if (restartAfterFailure) {
                assert.expect(6 + (expectedChunks * 17) + (15 * (expectedChunks-1)), done);
            }
            else {
                assert.expect(6 + (expectedChunks * 17), done);
            }

            var alreadyFailed = false,
                uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize
                    },
                    retry: {
                        autoAttemptDelay: 0,
                        enableAuto: true
                    },
                    callbacks: {
                        onUploadChunk: function (id, name, chunkData) {
                            chunksSent++;

                            assert.equal(id, 0, "Wrong ID passed to onUpoadChunk");
                            assert.equal(name, uploader.getName(id), "Wrong name passed to onUploadChunk");
                            assert.equal(chunkData.partIndex, chunksSent - 1, "Wrong partIndex passed to onUploadChunk");
                            assert.equal(chunkData.startByte, (chunksSent - 1) * chunkSize + 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.endByte, chunksSent === expectedChunks ? expectedFileSize : chunkData.startByte + chunkSize - 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.totalParts, expectedChunks, "Wrong totalParts passed to onUploadChunk");

                            setTimeout(function () {
                                var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1];

                                if (chunksSent === expectedChunks && !alreadyFailed) {
                                    alreadyFailed = true;

                                    if (restartAfterFailure) {
                                        chunksSent = 0;
                                        chunksSucceeded = 0;
                                        request.respond(500, null, JSON.stringify({reset: true, testParam: "testVal"}));
                                    }
                                    else {
                                        chunksSent--;
                                        request.respond(500, null, JSON.stringify({testParam: "testVal"}));
                                    }
                                }
                                else {
                                    request.respond(200, null, JSON.stringify({success: true, testParam: "testVal"}));
                                }
                            }, 10);
                        },
                        onAutoRetry: function(id, name, attemptNumber) {
                            assert.equal(id, 0, "Wrong ID passed to onAutoRetry");
                            assert.equal(name, uploader.getName(id), "Wrong name passed to onAutoRetry");
                            assert.equal(attemptNumber, 1, "Wrong auto retry attempt #");
                        },
                        onUploadChunkSuccess: function (id, chunkData, response, xhr) {
                            var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1],
                                requestParams = request.requestBody.fields;

                            chunksSucceeded++;

                            assert.equal(requestParams.qquuid, uploader.getUuid(id), "Wrong uuid param");
                            assert.equal(requestParams.qqpartindex, chunksSent - 1, "Wrong part index param");
                            assert.equal(requestParams.qqpartbyteoffset, (chunksSent - 1) * chunkSize, "Wrong part byte offset param");
                            assert.equal(requestParams.qqtotalfilesize, expectedFileSize, "Wrong total file size param");
                            assert.equal(requestParams.qqtotalparts, expectedChunks, "Wrong total parts param");
                            assert.equal(requestParams.qqfilename, uploader.getName(id), "Wrong filename param");
                            assert.equal(requestParams.qqchunksize, requestParams.qqfile.size, "Wrong chunk size param");
                            assert.equal(id, 0, "Wrong ID passed to onUpoadChunkSuccess");

                            assert.equal(response.testParam, "testVal");
                        },
                        onComplete: function (id, name, response) {
                            assert.equal(expectedChunks, chunksSent, "Wrong # of chunks sent.");
                            assert.equal(expectedChunks, chunksSucceeded, "Wrong # of chunks succeeded");
                            assert.equal(response.testParam, "testVal");
                        }
                    }
                }),
                chunksSent = 0,
                chunksSucceeded = 0;

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addFiles({name: "test", blob: blob});
            });
        }

        function testChunkedEveryFailureAndRecovery(done) {
            var alreadyFailed = false,
                uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize
                    },
                    retry: {
                        autoAttemptDelay: 0,
                        enableAuto: true
                    },
                    callbacks: {
                        onUploadChunk: function (id, name, chunkData) {
                            chunksSent++;

                            assert.equal(id, 0, "Wrong ID passed to onUpoadChunk");
                            assert.equal(name, uploader.getName(id), "Wrong name passed to onUploadChunk");
                            assert.equal(chunkData.partIndex, chunksSent - 1, "Wrong partIndex passed to onUploadChunk");
                            assert.equal(chunkData.startByte, (chunksSent - 1) * chunkSize + 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.endByte, chunksSent === expectedChunks ? expectedFileSize : chunkData.startByte + chunkSize - 1, "Wrong startByte passed to onUploadChunk");
                            assert.equal(chunkData.totalParts, expectedChunks, "Wrong totalParts passed to onUploadChunk");

                            setTimeout(function () {
                                var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1];

                                if (!alreadyFailed) {
                                    alreadyFailed = true;

                                    chunksSent--;
                                    request.respond(500, null, JSON.stringify({testParam: "testVal"}));
                                }
                                else {
                                    alreadyFailed = false;
                                    request.respond(200, null, JSON.stringify({success: true, testParam: "testVal"}));
                                }
                            }, 10);
                        },
                        onAutoRetry: function(id, name, attemptNumber) {
                            assert.equal(id, 0, "Wrong ID passed to onAutoRetry");
                            assert.equal(name, uploader.getName(id), "Wrong name passed to onAutoRetry");
                            assert.equal(attemptNumber, 1, "Wrong auto retry attempt #");
                        },
                        onUploadChunkSuccess: function (id, chunkData, response, xhr) {
                            var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1],
                                requestParams = request.requestBody.fields;

                            chunksSucceeded++;

                            assert.equal(requestParams.qquuid, uploader.getUuid(id), "Wrong uuid param");
                            assert.equal(requestParams.qqpartindex, chunksSent - 1, "Wrong part index param");
                            assert.equal(requestParams.qqpartbyteoffset, (chunksSent - 1) * chunkSize, "Wrong part byte offset param");
                            assert.equal(requestParams.qqtotalfilesize, expectedFileSize, "Wrong total file size param");
                            assert.equal(requestParams.qqtotalparts, expectedChunks, "Wrong total parts param");
                            assert.equal(requestParams.qqfilename, uploader.getName(id), "Wrong filename param");
                            assert.equal(requestParams.qqchunksize, requestParams.qqfile.size, "Wrong chunk size param");
                            assert.equal(id, 0, "Wrong ID passed to onUpoadChunkSuccess");

                            assert.equal(response.testParam, "testVal");
                        },
                        onComplete: function (id, name, response) {
                            assert.equal(expectedChunks, chunksSent, "Wrong # of chunks sent.");
                            assert.equal(expectedChunks, chunksSucceeded, "Wrong # of chunks succeeded");
                            assert.equal(response.testParam, "testVal");
                            assert.equal(response.success, true);

                            done();
                        }
                    }
                }),
                chunksSent = 0,
                chunksSucceeded = 0;

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                fileTestHelper.mockXhr();
                uploader.addFiles({name: "test", blob: blob});
            });
        }

        it("sends proper number of chunks when chunking is enabled, MPE", function(done) {
            testChunkedUpload({
                mpe: true,
                done: done
            });
        });

        it("sends proper number of chunks when chunking is enabled, non-MPE", function(done) {
            testChunkedUpload({done: done});
        });

        it("sends custom parameters along with each chunk, MPE", function(done) {
            testChunkedUpload({
                mpe: true,
                customParams: params,
                done: done
            });
        });

        it("sends custom parameters along with each chunk, non-MPE", function(done) {
            testChunkedUpload({
                customParams: params,
                done: done
            });
        });

        it("specifies custom values for the various chunking parameters, MPE", function(done) {
            testChunkedUpload({
                mpe: true,
                chunkingParamNames: overridenChunkingParamNames,
                done: done
            });
        });

        it("specifies custom values for the various chunking parameters, non-MPE", function(done) {
            testChunkedUpload({
                chunkingParamNames: overridenChunkingParamNames,
                done: done
            });
        });

        it("fails the last chunk once, then recovers", function(done) {
            testChunkedFailureAndRecovery(false, done);
        });

        it("fails the last chunk once, then restarts with the first chunk", function(done) {
            testChunkedFailureAndRecovery(true, done);
        });

        it("fails every chunk once, then recovers and ensure attemptNumber is 1", function(done) {
            testChunkedEveryFailureAndRecovery(done);
        });

        qq.supportedFeatures.resume && describe("resume feature tests", function() {
            var nativeLocalStorageSetItem = window.localStorage.setItem,
                acknowledgeRequests = function(endpoint) {
                    ackTimer = setTimeout(function() {
                        qq.each(fileTestHelper.getRequests(), function(idx, req) {
                            if (!req.ack && (!endpoint || endpoint === req.url)) {
                                req.ack = true;
                                req.respond(200, null, JSON.stringify({success: true, testParam: "testVal"}));
                            }
                        });
                    }, 10);
                }, ackTimer;

            afterEach(function() {
                window.localStorage.setItem = nativeLocalStorageSetItem;
                clearTimeout(ackTimer);
            });

            it("ensures failure to use localStorage does not prevent uploading", function(done) {
                window.localStorage.setItem = function() {
                    throw new qq.Error("Intentional localStorage error");
                };

                testChunkedUpload({
                    resume: true,
                    done: done
                });
            });

            it("getResumableFilesData", function(done) {
                var chunksUploaded = 0,
                    uploader = new qq.FineUploaderBasic({
                        request: {
                            endpoint: testUploadEndpoint
                        },
                        resume: {
                            enabled: true
                        },
                        chunking: {
                            enabled: true,
                            partSize: chunkSize
                        },
                        callbacks: {
                            onUploadChunk: function() {
                                acknowledgeRequests(testUploadEndpoint);
                            },
                            onUploadChunkSuccess: function(id) {
                                if (chunksUploaded++ === 1) {
                                    assert.ok(uploader.getResumableFilesData().length, "Empty resumable files data!");
                                    done();
                                }
                            }
                        }
                    });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                });
            });

            describe("resume records", function() {
                var uploader;

                function testResumeRecordsLogic(onUploadChunkSuccess, customKeys) {
                    uploader = new qq.FineUploaderBasic({
                        request: {
                            endpoint: testUploadEndpoint
                        },
                        resume: {
                            customKeys: customKeys || function() { return []; },
                            enabled: true
                        },
                        chunking: {
                            enabled: true,
                            mandatory: true,
                            partSize: expectedFileSize / 3
                        },
                        callbacks: {
                            onUploadChunk: function() {
                                acknowledgeRequests(testUploadEndpoint);
                            },

                            onUploadChunkSuccess: onUploadChunkSuccess
                        }
                    });

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        fileTestHelper.mockXhr();
                        uploader.addFiles({name: "test", blob: blob});
                    });
                }

                it("stores custom resume data with resume record", function(done){
                    testResumeRecordsLogic(
                        function(id, chunkData) {
                            if (chunkData.partIndex === 1) {
                                assert.deepEqual(uploader.getResumableFilesData()[0].customResumeData, { custom: "resumedata" });
                                done();
                            }
                            else {
                                uploader.setCustomResumeData(0, { custom: "resumedata" });
                            }
                        }
                    );
                });

                it("uses custom keys (if supplied) to create resume record key", function(done) {
                    testResumeRecordsLogic(
                        function(id, chunkData) {
                            if (chunkData.partIndex === 1) {
                                assert.ok(localStorage.key(0).indexOf("foo_customkey0") >= 0);
                                done();
                            }
                            else {
                                uploader.setCustomResumeData(0, { custom: "resumedata" });
                            }
                        },
                        function(id) {
                            return [
                                "foo_customkey" + id,
                                "bar_customkey" + id
                            ];
                        }
                    );
                });
            });
        });

        describe("chunking determination logic", function() {
            function testChunkingLogic(forceChunking, done) {
                var actualChunks = 0,
                    expectedChunks = forceChunking ? 1 : 0,
                    uploader = new qq.FineUploaderBasic({
                        request: {
                            endpoint: testUploadEndpoint
                        },
                        chunking: {
                            enabled: true,
                            mandatory: forceChunking,
                            partSize: expectedFileSize + 1
                        },
                        callbacks: {
                            onUploadChunk: function() {
                                actualChunks++;
                            },
                            onComplete: function() {
                                assert.equal(actualChunks, expectedChunks, "unexpected number of chunks!");
                                done();
                            }
                        }
                    });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                    fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                });
            }

            it("does NOT chunk a file that is smaller than chunking.partSize", function(done) {
                testChunkingLogic(false, done);
            });

            it("DOES chunk a file that is smaller than chunking.partSize IFF chunking.mandatory == true", function(done) {
                testChunkingLogic(true, done);
            });
        });

        describe("chunking.success option", function() {
            function testChunkingLogic(chunkingSuccess, onComplete) {
                var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        mandatory: true,
                        partSize: expectedFileSize + 1,
                        success: chunkingSuccess
                    },
                    callbacks: { onComplete: onComplete }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                    fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                    fileTestHelper.getRequests()[1].respond(200);
                });
            }

            describe("endpoint", function() {
                it("string value - calls the endpoint after all chunks have been uploaded", function(done) {
                    testChunkingLogic(
                        { endpoint: "/test/chunkingsuccess" },
                        function() {
                            assert.equal(fileTestHelper.getRequests().length, 2);
                            assert.equal(fileTestHelper.getRequests()[1].url, "/test/chunkingsuccess");
                            done();
                        }
                    );
                });

                it("function value - calls the endpoint after all chunks have been uploaded", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: function(id) {
                                return "/test/" + id;
                            }
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests().length, 2);
                            assert.equal(fileTestHelper.getRequests()[1].url, "/test/0");
                            done();
                        }
                    );
                });
            });

            describe("headers", function() {
                it("calls the endpoint with the provided headers", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            headers: function(id) {
                                return { Foo: "bar" + id };
                            }
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests()[1].requestHeaders.Foo, "bar0");
                            done();
                        }
                    );
                });
            });

            describe("jsonPayload + custom params", function() {
                it("true - calls the endpoint with params in the payload as application/json", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            jsonPayload: true,
                            params: function(id) {
                                return { Foo: "bar" + id };
                            }
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests()[1].requestHeaders["Content-Type"], "application/json;charset=utf-8");
                            assert.equal(fileTestHelper.getRequests()[1].requestBody, JSON.stringify({ Foo: "bar0" }));
                            done();
                        }
                    );
                });

                it("false (default) - calls the endpoint with params in the payload as url-encoded", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            params: function(id) {
                                return { Foo: "bar@_" + id };
                            }
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests()[1].requestHeaders["Content-Type"], "application/x-www-form-urlencoded;charset=utf-8");
                            assert.equal(fileTestHelper.getRequests()[1].requestBody, "Foo=bar%40_0");
                            done();
                        }
                    );
                });
            });

            describe("method", function() {
                it("(default) calls the endpoint using POST method", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess"
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests()[1].method, "POST");
                            done();
                        }
                    );
                });

                it("calls the endpoint using custom method", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            method: "PUT"
                        },
                        function() {
                            assert.equal(fileTestHelper.getRequests()[1].method, "PUT");
                            done();
                        }
                    );
                });
            });

            describe("resetOnStatus", function() {
                var uploader;

                function testChunkingLogic(chunkingSuccess, onComplete, chunkingSuccessStatus) {
                    uploader = new qq.FineUploaderBasic({
                        request: {
                            endpoint: testUploadEndpoint
                        },
                        resume: {
                            enabled: true
                        },
                        chunking: {
                            enabled: true,
                            mandatory: true,
                            partSize: expectedFileSize + 1,
                            success: chunkingSuccess
                        },
                        callbacks: { onComplete: onComplete }
                    });

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                        fileTestHelper.mockXhr();
                        uploader.addFiles({name: "test", blob: blob});
                        fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                        fileTestHelper.getRequests()[1].respond(chunkingSuccessStatus);
                    });
                }

                it("resets the file to upload starting with the first chunk if the success endpoint responds with the provided status code", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            resetOnStatus: [404]
                        },
                        function(id, name, response) {
                            assert.ok(!response.success);
                            assert.ok(!uploader.isResumable(0));
                            done();
                        },
                        404
                    );
                });

                it("does not reset the file to upload starting with the first chunk if the success endpoint does not responds with the provided status code", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: "/test/chunkingsuccess",
                            resetOnStatus: [404]
                        },
                        function(id, name, response) {
                            assert.ok(!response.success);
                            assert.ok(uploader.isResumable(0));
                            done();
                        },
                        500
                    );
                });
            });
        });

        describe("request options", function() {
            var uploader;

            function testChunkingLogic(request, onComplete, sinonResponse) {
                uploader = new qq.FineUploaderBasic({
                    request: request,
                    chunking: {
                        enabled: true,
                        mandatory: true,
                        partSize: expectedFileSize + 1
                    },
                    callbacks: { onComplete: onComplete }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});

                    if (sinonResponse) {
                        var request = fileTestHelper.getRequests()[0];

                        request.respond.apply(request, sinonResponse);
                    }
                    else {
                        fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                    }
                });
            }

            describe("request.omitDefaultParams", function() {
                it("(true) omits default params in upload requests", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint,
                            omitDefaultParams: true,
                            paramsInBody: false
                        },
                        function() {
                            var chunkUploadRequest = fileTestHelper.getRequests()[0];
                            assert.equal(chunkUploadRequest.url, "/test/upload?");
                            done();
                        }
                    );
                });

                it("(default) includes default params in upload requests", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint,
                            paramsInBody: false
                        },
                        function() {
                            var chunkUploadRequest = fileTestHelper.getRequests()[0];
                            var uuid = uploader.getUuid(0);

                            assert.equal(chunkUploadRequest.url, "/test/upload?qqpartindex=0&qqpartbyteoffset=0&qqchunksize=3266&qqtotalparts=1&qqtotalfilesize=3266&qqfilename=test&qquuid=" + uuid);
                            done();
                        }
                    );
                });
            });

            describe("request.requireSuccessJson", function() {
                it("(false) fails if response status indicates failure but payload contains { 'success': true } in payload", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint,
                            requireSuccessJson: false
                        },
                        function(id, name, response) {
                            assert.ok(!response.success);
                            done();
                        },
                        [
                            500,
                            null,
                            JSON.stringify({ success: true })
                        ]
                    );
                });

                it("(false) succeeds if response status indicates success, even without JSON payload containing { 'success' true }", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint,
                            requireSuccessJson: false
                        },
                        function(id, name, response) {
                            assert.ok(response.success);
                            done();
                        },
                        [
                            200,
                            null,
                            null
                        ]
                    );
                });

                it("(default) fails if response status is 200 and does not contain { 'success': true } in payload", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint
                        },
                        function(id, name, response) {
                            assert.ok(!response.success);
                            done();
                        },
                        [
                            200,
                            null,
                            null
                        ]
                    );
                });

                it("(false) succeeds if response payload contains { 'success': true }", function(done) {
                    testChunkingLogic(
                        {
                            endpoint: testUploadEndpoint
                        },
                        function(id, name, response) {
                            assert.ok(response.success);
                            done();
                        },
                        [
                            200,
                            null,
                            JSON.stringify({ success: true })
                        ]
                    );
                });
            });
        });

        describe("onUploadChunk w/ Promise return value", function() {
            var uploader;

            function testOnUploadChunkLogic(callbacks, options) {
                var omitDefaultParams = !!(options && options.omitDefaultParams);

                uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint,
                        omitDefaultParams: omitDefaultParams,
                        paramsInBody: false
                    },
                    chunking: {
                        enabled: true,
                        mandatory: true,
                        partSize: expectedFileSize + 1
                    },
                    callbacks: callbacks
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test", blob: blob});
                });
            }

            it("fails the upload if the Promise is rejected", function(done) {
                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && !result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        return window.Promise.reject();
                    }
                });
            });

            it("uploads the next chunk if the Promise is resolved", function(done) {
                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        setTimeout(function() {
                            fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve();
                    }
                });
            });

            it("sends all headers passed to the resolved Promise for the upload chunk request", function(done) {
                var headersToSend = {
                    "X-Foo": "bar"
                };

                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        setTimeout(function() {
                            var uploadChunkRequest = fileTestHelper.getRequests()[0];

                            delete uploadChunkRequest.requestHeaders["Content-Type"];
                            assert.deepEqual(uploadChunkRequest.requestHeaders, headersToSend);

                            uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve({ headers: headersToSend });
                    }
                });
            });

            it("sends only params passed to the resolved Promise for the upload chunk request", function(done) {
                var expectedUrlEncodedParams = "Foo-Param=bar",
                    paramsToSend = {
                        "Foo-Param": "bar"
                    };

                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        setTimeout(function() {
                            var uploadChunkRequest = fileTestHelper.getRequests()[0];

                            assert.deepEqual(uploadChunkRequest.url, testUploadEndpoint + "?" + expectedUrlEncodedParams);

                            uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve({ params: paramsToSend });
                    }
                }, { omitDefaultParams: true });
            });

            it("sends default params and params passed to the resolved Promise for the upload chunk request", function(done) {
                var expectedCustomUrlEncodedParams = "Foo-Param=bar",
                    paramsToSend = {
                        "Foo-Param": "bar"
                    };

                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function(id, name, chunkData) {
                        setTimeout(function() {
                            var uploadChunkRequest = fileTestHelper.getRequests()[0],
                                expectedUrlParams = expectedCustomUrlEncodedParams +
                                    "&qqpartindex=" + chunkData.partIndex +
                                    "&qqpartbyteoffset=" + (chunkData.startByte - 1) +
                                    "&qqchunksize=" + (chunkData.endByte - chunkData.startByte + 1) +
                                    "&qqtotalparts=" + chunkData.totalParts +
                                    "&qqtotalfilesize=" + expectedFileSize +
                                    "&qqfilename=" + name +
                                    "&qquuid=" + uploader.getUuid(id);

                            assert.deepEqual(uploadChunkRequest.url, testUploadEndpoint + "?" + expectedUrlParams);

                            uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve({ params: paramsToSend });
                    }
                });
            });

            it("uses the method passed to the resolved Promise for the upload chunk request", function(done) {
                var requestMethod = "PATCH";

                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        setTimeout(function() {
                            var uploadChunkRequest = fileTestHelper.getRequests()[0];

                            assert.deepEqual(uploadChunkRequest.method, requestMethod);

                            uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve({ method: requestMethod });
                    }
                });
            });

            it("uses the endpoint passed to the resolved Promise for the upload chunk request", function(done) {
                var requestUrl = "/test/overriden/onuploadchunkendpoint";

                testOnUploadChunkLogic({
                    onComplete: function(id, name, result) {
                        if (id === 0 && result.success) {
                            done();
                        }
                    },

                    onUploadChunk: function() {
                        setTimeout(function() {
                            var uploadChunkRequest = fileTestHelper.getRequests()[0];

                            assert.deepEqual(uploadChunkRequest.url, requestUrl + "?");

                            uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                        }, 10);

                        return window.Promise.resolve({ endpoint: requestUrl });
                    }
                }, { omitDefaultParams: true });
            });
        });

        describe("variable chunk size", function() {
            it("allows an alternate chunk size to be specified for each file", function(done) {
                var uploader = new qq.FineUploaderBasic({
                    maxConnections: 1,
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    chunking: {
                        enabled: true,
                        partSize: function(id) {
                            if (id === 0) {
                                return expectedFileSize / 2;
                            }

                            return expectedFileSize / 3;
                        }
                    },
                    callbacks: {
                        onUploadChunk: function(id, name, chunkData) {
                            setTimeout(function() {
                                var uploadChunkRequest;

                                if (id === 0) {
                                    uploadChunkRequest = fileTestHelper.getRequests()[chunkData.partIndex];
                                }
                                else if (id === 1) {
                                    uploadChunkRequest = fileTestHelper.getRequests()[2 + chunkData.partIndex];
                                }

                                uploadChunkRequest.respond(200, null, JSON.stringify({success: true}));
                            }, 10);

                            if (id === 0) {
                                assert.equal(chunkData.totalParts, 2);
                            }
                            else if (id === 1) {
                                assert.equal(chunkData.totalParts, 3);

                                if (chunkData.partIndex === 2) {
                                    done();
                                }
                            }
                        }
                    }
                });

                qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function (blob) {
                    fileTestHelper.mockXhr();
                    uploader.addFiles({name: "test0", blob: blob});
                    uploader.addFiles({name: "test1", blob: blob});
                });
            });
        });
    });
}
