/* globals describe, it, helpme, qq, assert, purl, beforeEach, $fixture */
describe("file list initialization tests", function() {
    "use strict";

    var fileHelper = helpme.setupFileTests(),
        sessionEndpoint = "/uploads/initial",
        thumbnailSrc = "http://" + window.location.hostname + ":3000/up.jpg";


    beforeEach(function() {
        fileHelper.mockXhr();
    });

    it("adds valid items to the initial file list", function(done) {
        assert.expect(23, done);

        var expectedSessionResponse = [
                {
                    name: "up.jpg",
                    uuid: "123",
                    size: 456
                },
                {
                    name: "up2.jpg",
                    uuid: "abc"
                }
            ],
            uploader = new qq.FineUploaderBasic({
                validation: {
                    itemLimit: 5
                },
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, expectedSessionResponse, "unexpected callback response");
                        assert.ok(success, "session request deemed failure");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];

            assert.equal(fileHelper.getRequests().length, 1, "unexpected # of requests");
            assert.equal(request.method, "GET", "wrong request method");
            assert.equal(purl(request.url).attr("path"), sessionEndpoint, "wrong session endpoint");
            /* jshint eqnull:true */
            assert.ok(purl(request.url).param("qqtimestamp") != null, "cache buster query param missing");

            request.respond(200, null, JSON.stringify(expectedSessionResponse));

            assert.equal(uploader.getUploads().length, 2, "wrong number of pre-populated uploads recorded");
            assert.equal(uploader.getUploads({status: qq.status.UPLOAD_SUCCESSFUL}).length, 2, "wrong status for one or more recorded files");

            assert.equal(uploader.getUuid(0), "123", "123 UUID was not recorded");
            assert.equal(uploader.getUuid(1), "abc", "abc UUID was not recorded");

            assert.equal(uploader.getSize(0), 456, "wrong size for first file");
            assert.equal(uploader.getSize(1), -1, "wrong size for second file");

            assert.equal(uploader.getName(0), "up.jpg", "wrong name for first file");
            assert.equal(uploader.getName(1), "up2.jpg", "wrong name for second file");

            assert.equal(uploader.getFile(0), null, "unexpected return value for getFile");
            assert.equal(uploader.getFile(1), null, "unexpected return value for getFile");

            assert.equal(uploader.getInProgress(), 0, "unexpected getInProgress value");
            assert.equal(uploader.getNetUploads(), 2, "unexpected getNetUploads value");

            assert.equal(uploader.getRemainingAllowedItems(), 3, "wrong number of remaining allowed items");

            uploader.setUuid(1, "foobar");
            assert.equal(uploader.getUuid(0), "123", "first UUID was changed unexpectedly");
            assert.equal(uploader.getUuid(1), "foobar", "UUID was not changed correctly");

            uploader.setName(0, "raynicholus");
            assert.equal(uploader.getName(0), "raynicholus", "name was not changed correctly");
            assert.equal(uploader.getName(1), "up2.jpg", "second file name was changed unexpectedly");
        }, 0);
    });

    // The <img> fails to load sometimes in older versions of IE for some unknown reason, so we have to exclude this test
    if (!qq.ie() || qq.ie10() || qq.ie11()) {
        it("drawThumbnail renders image properly if session response includes thumbnailUrl", function(done) {
            assert.expect(3, done);

            var img = document.createElement("img");

            var expectedSessionResponse = [
                    {
                        name: "up.jpg",
                        uuid: "123",
                        thumbnailUrl: thumbnailSrc
                    }
                ],
                uploader = new qq.FineUploaderBasic({
                    session: {
                        endpoint: sessionEndpoint
                    },
                    callbacks: {
                        onSessionRequestComplete: function(response, success, xhr) {
                            assert.deepEqual(response, expectedSessionResponse, "unexpected callback response");
                            assert.ok(success, "session request deemed failure");

                            uploader.drawThumbnail(0, img, 0, true).then(function(container) {
                                assert.equal(container.src, thumbnailSrc, "wrong thumbnail src");
                            }, function() {
                                assert.fail(null, null, "Thumbnail generation failed");
                            });
                        }
                    }
                }
            );

            setTimeout(function() {
                fileHelper.getRequests()[0].respond(200, null, JSON.stringify(expectedSessionResponse));
            }, 0);
        });
    }

    it("ignores response items that do not contain a valid UUID or name", function(done) {
        assert.expect(3, done);

        var expectedSessionResponse = [
                {
                    uuid: "123",
                    size: 456
                },
                {
                    name: "up2.jpg"
                }
            ],
            uploader = new qq.FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, expectedSessionResponse, "unexpected callback response");
                        assert.ok(!success, "session request deemed success unexpectedly");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];
            request.respond(200, null, JSON.stringify(expectedSessionResponse));
            assert.equal(uploader.getUploads().length, 0, "wrong number of pre-populated uploads recorded");
        }, 0);
    });

    it("properly handles non-200 response status", function(done) {
        assert.expect(3, done);

        var uploader = new qq.FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, [], "unexpected callback response");
                        assert.ok(!success, "session request deemed success unexpectedly");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];
            request.respond(400, null, "[]");
            assert.equal(uploader.getUploads().length, 0, "wrong number of pre-populated uploads recorded");
        }, 0);
    });

    it("does not cause problems if the response is empty or invalid", function(done) {
        assert.expect(3, done);

        var uploader = new qq.FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, null, "unexpected callback response");
                        assert.ok(!success, "session request deemed success unexpectedly");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];
            request.respond(200, null, "hi");
            assert.equal(uploader.getUploads().length, 0, "wrong number of pre-populated uploads recorded");
        }, 0);
    });

    it("re-queries for session data on reset if refreshOnReset is set to true", function(done) {
        assert.expect(7, done);

        var sessionRequestCount = 0,
            expectedSessionResponse1 = [
                {
                    name: "up.jpg",
                    uuid: "123"
                }
            ],
            expectedSessionResponse2 = [
                {
                    name: "up1.jpg",
                    uuid: "1234"
                }
            ],
            uploader = new qq.FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint,
                    refreshOnReset: true
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        sessionRequestCount++;

                        if (sessionRequestCount === 1) {
                            assert.deepEqual(response, expectedSessionResponse1, "unexpected callback response");
                        }
                        else {
                            assert.deepEqual(response, expectedSessionResponse2, "unexpected callback response");
                        }

                        assert.ok(success, "session request deemed success unexpectedly");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];
            request.respond(200, null, JSON.stringify(expectedSessionResponse1));
            assert.equal(uploader.getUploads().length, 1, "wrong number of pre-populated uploads recorded");

            uploader.reset();
            setTimeout(function() {
                assert.equal(fileHelper.getRequests().length, 2, "wrong number of requests");
                request = fileHelper.getRequests()[1];
                request.respond(200, null, JSON.stringify(expectedSessionResponse2));
                assert.equal(uploader.getUploads().length, 1, "wrong number of pre-populated uploads recorded");
            }, 0);
        }, 0);
    });

    it("sets proper delete endpoints & parameters based on response", function(done) {
        assert.expect(8, done);

        var expectedSessionResponse = [
                {
                    name: "up.jpg",
                    uuid: "123",
                    deleteFileParams: {foo: "bar"}
                },
                {
                    name: "up2.jpg",
                    uuid: "abc",
                    deleteFileEndpoint: "/deletefile/override1"
                }
            ],
            uploader = new qq.FineUploaderBasic({
                deleteFile: {
                    enabled: true,
                    endpoint: "/deletefile/original",
                    params: {ray: "nicholus"}
                },
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, expectedSessionResponse, "unexpected callback response");
                        assert.ok(success, "session request deemed failure");
                    }
                }
            }
        ),
            request;

        setTimeout(function() {
            request = fileHelper.getRequests()[0];
            request.respond(200, null, JSON.stringify(expectedSessionResponse));

            uploader.deleteFile(0);
            assert.equal(fileHelper.getRequests().length, 2, "1st delete request did not register");
            request = fileHelper.getRequests()[1];
            assert.equal(request.method, "DELETE", "1st delete request has unexpected method");
            assert.equal(request.url, "/deletefile/original/123?foo=bar", "wrong deleteFile url for first file");

            uploader.deleteFile(1);
            assert.equal(fileHelper.getRequests().length, 3, "2nd delete request did not register");
            request = fileHelper.getRequests()[2];
            assert.equal(request.method, "DELETE", "2nd delete request has unexpected method");
            assert.equal(request.url, "/deletefile/override1/abc?ray=nicholus", "wrong deleteFile url for first file");
        }, 0);
    });

    it("sends custom params and headers along with the GET request", function(done) {
        assert.expect(3, done);

        var uploader = new qq.FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint,
                    params: {foo: "bar"},
                    customHeaders: {"x-ray": "nicholus"}
                }
            }
        ),
            request;

        setTimeout(function() {
            assert.equal(fileHelper.getRequests().length, 1, "wrong # of requests");
            request = fileHelper.getRequests()[0];

            assert.equal(request.requestHeaders["x-ray"], "nicholus", "custom header invalid");
            assert.equal(purl(request.url).param("foo"), "bar", "custom param invalid");
        }, 0);
    });

    describe("non-traditional endpoint tests", function() {
        function runTest(namespace, requiredKeyName, done) {
            assert.expect(3, done);

            var expectedSessionResponse = [
                    {
                        uuid: "123",
                        name: "hi"
                    },
                    {
                        name: "up2.jpg",
                        uuid: "abc"
                    }
                ],
                uploader,
                request;


            expectedSessionResponse[0][requiredKeyName] = "raynicholus";

            uploader = new qq[namespace].FineUploaderBasic({
                session: {
                    endpoint: sessionEndpoint
                },
                callbacks: {
                    onSessionRequestComplete: function(response, success, xhr) {
                        assert.deepEqual(response, expectedSessionResponse, "unexpected callback response");
                        assert.ok(!success, "session request deemed success unexpectedly");
                    }
                }
            });

            setTimeout(function() {
                request = fileHelper.getRequests()[0];
                request.respond(200, null, JSON.stringify(expectedSessionResponse));
                assert.equal(uploader.getUploads().length, 1, "wrong number of pre-populated uploads recorded");
            }, 0);
        }

        it("ignores S3 response items that do not contain a valid key", function(done) {
            runTest("s3", "s3Key", done);
        });

        // Azure-based tests are irrelevant in "older" browsers since they don't support uploading to Azure
        if (qq.supportedFeatures.ajaxUploading) {
            it("ignores Azure response items that do not contain a valid blob name", function(done) {
                runTest("azure", "blobName", done);
            });
        }
    });
});
