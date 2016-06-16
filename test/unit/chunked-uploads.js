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

        describe("resume feature tests", function() {
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

            qq.supportedFeatures.resume && it("getResumableFilesData", function(done) {
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
    });
}
