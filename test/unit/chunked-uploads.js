/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
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

        function testChunkedUpload(mpe, customParams, chunkingParamNames, done) {
            customParams = customParams || {};
            chunkingParamNames = chunkingParamNames || new qq.FineUploaderBasic({})._options.chunking.paramNames;

            assert.expect(3 + (expectedChunks * (20 + (Object.keys(customParams).length))), done);

            var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint,
                        paramsInBody: mpe,
                        forceMultipart: mpe,
                        params: customParams
                    },
                    chunking: {
                        enabled: true,
                        partSize: chunkSize,
                        paramNames: chunkingParamNames
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
                                request.respond(200, null, JSON.stringify({success: true, testParam: "testVal"}));
                            }, 10);
                        },
                        onUploadChunkSuccess: function (id, chunkData, response, xhr) {
                            var request = fileTestHelper.getRequests()[fileTestHelper.getRequests().length - 1],
                                requestParams;

                            chunksSucceeded++;

                            if (mpe) {
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
                            assert.equal(requestParams[chunkingParamNames.chunkSize], mpe ? requestParams.qqfile.size : request.requestBody.size, "Wrong chunk size param");
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
                uploader.addBlobs({name: "test", blob: blob});
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
                uploader.addBlobs({name: "test", blob: blob});
            });
        }

        it("sends proper number of chunks when chunking is enabled, MPE", function(done) {
            testChunkedUpload(true, null, null, done);
        });

        it("sends proper number of chunks when chunking is enabled, non-MPE", function(done) {
            testChunkedUpload(false, null, null, done);
        });

        it("sends custom parameters along with each chunk, MPE", function(done) {
            testChunkedUpload(true, params, null, done);
        });

        it("sends custom parameters along with each chunk, non-MPE", function(done) {
            testChunkedUpload(false, params, null, done);
        });

        it("specifies custom values for the various chunking parameters, MPE", function(done) {
            testChunkedUpload(true, null, overridenChunkingParamNames, done);
        });

        it("specifies custom values for the various chunking parameters, non-MPE", function(done) {
            testChunkedUpload(false, null, overridenChunkingParamNames, done);
        });

        it("fails the last chunk once, then recovers", function(done) {
            testChunkedFailureAndRecovery(false, done);
        });

        it("fails the last chunk once, then restarts with the first chunk", function(done) {
            testChunkedFailureAndRecovery(true, done);
        });
    });
}
