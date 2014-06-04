/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("deleting files", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            testDeleteEndpoint = "/test/deletefile",
            deleteParams = {
                foo: "bar",
                one: 2,
                thefunc: function() {
                    return "thereturn";
                }
            },
            deleteCustomHeaders = {
                one: "1",
                two: "2"
            };

        function testDeleteFile(done, expectedMethod, deleteEnabled, successful, reject, expectedParams, setParamsViaOptions, expectedHeaders, setHeadersViaOptions) {
            var expectedAssertions = 0;

            expectedParams = expectedParams || {};
            expectedHeaders = expectedHeaders || {};

            if (!deleteEnabled) {
                expectedAssertions = 2;
            }
            else if (reject) {
                expectedAssertions = 3;
            }
            else {
                if (expectedMethod === "POST") {
                    expectedAssertions = 12 + Object.keys(expectedParams).length;
                }
                else {
                    expectedAssertions = 10 + Object.keys(expectedParams).length;
                }
            }

            if (Object.keys(expectedHeaders).length) {
                expectedAssertions += 2;
            }

            assert.expect(expectedAssertions, done);

            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint
                },
                deleteFile: {
                    enabled: deleteEnabled,
                    endpoint: testDeleteEndpoint,
                    method: expectedMethod,
                    params: (function() {
                        if (setParamsViaOptions && expectedParams) {
                            return expectedParams;
                        }

                        return {};
                    }()),
                    customHeaders: (function() {
                        if (setHeadersViaOptions && expectedHeaders) {
                            return expectedHeaders;
                        }

                        return {};
                    }())
                },
                callbacks: {
                    onComplete: function(id) {
                        var uuid = uploader.getUuid(id),
                            deleteRequest, deleteRequestPurl, deleteRequestBodyPurl;

                        uploader.deleteFile(id);

                        deleteRequest = fileTestHelper.getRequests()[1];

                        if (deleteEnabled && !reject) {
                            deleteRequestPurl = purl(deleteRequest.url);

                            assert.equal(fileTestHelper.getRequests().length, 2, "Wrong # of requests");
                            assert.equal(deleteRequest.method, expectedMethod, "Wrong method for delete request");

                            if (expectedMethod === "DELETE") {
                                assert.equal(deleteRequestPurl.attr("path"), testDeleteEndpoint + "/" + uuid, "Wrong endpoint for delete request");

                                if (Object.keys(expectedParams).length) {
                                    assert.equal(deleteRequestPurl.param("foo"), expectedParams.foo, "Wrong 'foo' parameter");
                                    assert.equal(deleteRequestPurl.param("one"), expectedParams.one, "Wrong 'one' parameter");
                                    assert.equal(deleteRequestPurl.param("thefunc"), expectedParams.thefunc(), "Wrong 'thefunc' parameter");
                                }
                            }
                            else {
                                deleteRequestBodyPurl = purl("?" + deleteRequest.requestBody);
                                assert.equal(deleteRequestPurl.attr("path"), testDeleteEndpoint, "Wrong endpoint for delete request");
                                assert.equal(deleteRequestBodyPurl.param("_method"), "DELETE", "Wrong _method param");
                                assert.equal(deleteRequestBodyPurl.param("qquuid"), uuid, "Wrong qquuid param");

                                if (Object.keys(expectedParams).length) {
                                    assert.equal(deleteRequestBodyPurl.param("foo"), expectedParams.foo, "Wrong 'foo' parameter");
                                    assert.equal(deleteRequestBodyPurl.param("one"), expectedParams.one, "Wrong 'one' parameter");
                                    assert.equal(deleteRequestBodyPurl.param("thefunc"), expectedParams.thefunc(), "Wrong 'thefunc' parameter");
                                }
                            }

                            if (Object.keys(expectedHeaders).length) {
                                assert.equal(deleteRequest.requestHeaders.one, expectedHeaders.one, "Wrong 'one' header");
                                assert.equal(deleteRequest.requestHeaders.two, expectedHeaders.two, "Wrong 'two' header");
                            }

                            deleteRequest.respond(successful ? 200 : 500, null, null);
                        }
                        else {
                            /* jshint eqnull:true */
                            assert.ok(deleteRequest == null, "delete request may have been sent");
                        }
                    },
                    onSubmitDelete: function(id) {
                        assert.equal(id, 0, "Wrong ID passed to onSubmitDelete");

                        if (reject) {
                            setTimeout(function() {
                                assert.deepEqual(statuses, expectedStatusOrder, "Unexpected status");
                            }, 10);
                            return false;
                        }

                        !setParamsViaOptions && uploader.setDeleteFileParams(expectedParams);
                        !setHeadersViaOptions && uploader.setDeleteFileCustomHeaders(expectedHeaders);
                    },
                    onDelete: function(id) {
                        assert.equal(id, 0, "Wrong ID passed to onDelete");
                    },
                    onDeleteComplete: function(id, xhr, isError) {
                        /* jshint eqnull:true */
                        assert.equal(id, 0, "Wrong ID passed to onDeleteComplete");
                        assert.ok(xhr != null, "Invalid XHR passed to onDeleteComplete");
                        assert.ok(isError !== successful, "Unexpected delete status");
                        assert.deepEqual(statuses, expectedStatusOrder, "Unexpected status");
                    },
                    onStatusChange: function(id, oldStatus, newStatus) {
                        statuses.push(newStatus);
                    }
                }
            }),
                statuses = [],
                expectedStatusOrder = [qq.status.SUBMITTING, qq.status.SUBMITTED, qq.status.UPLOADING, qq.status.UPLOAD_SUCCESSFUL, qq.status.DELETING];

            if (successful && !reject) {
                expectedStatusOrder.push(qq.status.DELETED);
            }
            else if (!reject) {
                expectedStatusOrder.push(qq.status.DELETE_FAILED);
            }
            else {
                expectedStatusOrder.pop();
            }

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var request;

                uploader.addFiles({name: "test", blob: blob});

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];
                request.respond(200, null, JSON.stringify({success: true}));
            });
        }

        it("ignores delete requests if the feature is disabled", function(done) {
            testDeleteFile(done, "DELETE", true, false, false);
        });

        it("handles simple delete of successfully uploaded file", function(done) {
            testDeleteFile(done, "DELETE", true, true, false);
        });

        it("handles simple failed delete of successfully uploaded file", function(done) {
            testDeleteFile(done, "DELETE", false, true);
        });

        it("ignores delete requests that are rejected via callback", function(done) {
            testDeleteFile(done, "DELETE", true, true, true);
        });

        it("handles simple delete w/ method changed to POST", function(done) {
            testDeleteFile(done, "POST", true, true, false);
        });

        it("properly passes parameters specified via options only for DELETE request", function(done) {
            testDeleteFile(done, "DELETE", true, true, false, deleteParams, true);
        });

        it("properly passes parameters specified via options only for POST request", function(done) {
            testDeleteFile(done, "POST", true, true, false, deleteParams, true);
        });

        it("properly passes parameters specified via API only for DELETE request", function(done) {
            testDeleteFile(done, "DELETE", true, true, false, deleteParams);
        });

        it("properly passes parameters specified via API only for POST request", function(done) {
            testDeleteFile(done, "POST", true, true, false, deleteParams);
        });

        it("properly passes headers specified via options", function(done) {
            testDeleteFile(done, "POST", true, true, false, null, null, deleteCustomHeaders, true);
        });

        it("properly passes headers specified via API", function(done) {
            testDeleteFile(done, "POST", true, true, false, null, null, deleteCustomHeaders, false);
        });
    });
}
