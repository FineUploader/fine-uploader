/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("sending params and headers with upload requests", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            params = {
                foo: "bar",
                one: 2,
                thefunc: function() {
                    return "thereturn";
                }
            },
            headers = {
                one: "1",
                two: "2"
            };

        function getSimpleParamsUploader(mpe, paramsAsOptions) {
            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint,
                    paramsMode: mpe ? qq.paramsMode.paramsInBody : qq.paramsMode.paramsInUrl,
                    forceMultipart: mpe,
                    params: paramsAsOptions ? params : {},
                    autoUpload: false
                }
            });

            !paramsAsOptions && uploader.setParams(params);
            return uploader;
        }

        function getSimpleParamsInHeaderUploader(paramsAsOptions, headerParamPrefix) {
            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint,
                    paramsMode: qq.paramsMode.paramsInHeader,
                    headerParamPrefix: headerParamPrefix,
                    forceMultipart: true,
                    params: paramsAsOptions ? params : {},
                    autoUpload: false
                }
            });

            !paramsAsOptions && uploader.setParams(params);
            return uploader;
        }

        function getSimpleHeadersUploader(headersAsOptions) {
            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: testUploadEndpoint,
                    customHeaders: headersAsOptions ? headers : {},
                    autoUpload: false
                }
            });

            !headersAsOptions && uploader.setCustomHeaders(headers);
            return uploader;
        }

        function assertParamsInRequest(uploader, paramsMode, done, overrideParams) {
            assert.expect(4, done);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {

                fileTestHelper.mockXhr();

                var request,
                    requestParams,
                    purlUrl,
                    theparams = overrideParams || params,
                    headerParamPrefix = headerParamPrefix || "";

                uploader.addFiles({name: "test", blob: blob});
                uploader.uploadStoredFiles();

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];
                requestParams = request.requestBody.fields;
                purlUrl = purl(request.url);

                if (paramsMode === qq.paramsMode.paramsInBody) {
                  assert.equal(requestParams.foo, theparams.foo, "'foo' param value incorrect");
                  assert.equal(requestParams.one, theparams.one, "'one' param value incorrect");
                  assert.equal(requestParams.thefunc, theparams.thefunc(), "'thefunc' param value incorrect");
                }
                else if (paramsMode === qq.paramsMode.paramsInUrl) {
                  assert.equal(purlUrl.param("foo"), theparams.foo, "'foo' param value incorrect");
                  assert.equal(purlUrl.param("one"), theparams.one, "'one' param value incorrect");
                  assert.equal(purlUrl.param("thefunc"), theparams.thefunc(), "'thefunc' param value incorrect");
                }
                else if (paramsMode === qq.paramsMode.paramsInHeader) {
                  assert.equal(request.requestHeaders.foo, theparams.foo, "'foo' param value incorrect");
                  assert.equal(request.requestHeaders.one, theparams.one, "'one' param value incorrect");
                  assert.equal(request.requestHeaders.thefunc, theparams.thefunc, "'thefunc' param value incorrect");
                }

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
            });
        }


        function assertHeadersInRequest(uploader, done) {
            assert.expect(3, done);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var request;

                uploader.addFiles({name: "test", blob: blob});
                uploader.uploadStoredFiles();

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                request = fileTestHelper.getRequests()[0];

                assert.equal(request.requestHeaders.one, headers.one, "Wrong 'one' header");
                assert.equal(request.requestHeaders.two, headers.two, "Wrong 'two' header");

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
            });
        }

        it("sends correct params in request for MPE uploads w/ params specified as options only", function(done) {
            var uploader = getSimpleParamsUploader(true, true);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInBody, done);
        });

        it("sends correct params in request for non-MPE uploads w/ params specified as options only", function(done) {
            var uploader = getSimpleParamsUploader(false, true);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInUrl, done);
        });

        it("sends correct params in header of request for MPE uploads w/ params specified as options only", function(done) {
            var uploader = getSimpleParamsInHeaderUploader(true, "");
            assertParamsInRequest(uploader, qq.paramsMode.paramsInHeader, done);
        });

        it("sends correct params in header of request with prefix for MPE uploads w/ params specified as options only", function(done) {
            var headerParamPrefix = "x-upload-data-",
            uploader = getSimpleParamsInHeaderUploader(true, headerParamPrefix);

            assert.expect(4, done);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                fileTestHelper.mockXhr();

                var requestHeaders;

                uploader.addFiles({name: "test", blob: blob});
                uploader.uploadStoredFiles();

                assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");
                requestHeaders = fileTestHelper.getRequests()[0].requestHeaders;

                assert.equal(requestHeaders[headerParamPrefix + "foo"], params.foo, "'foo' param value incorrect");
                assert.equal(requestHeaders[headerParamPrefix + "one"], params.one, "'one' param value incorrect");
                assert.equal(requestHeaders[headerParamPrefix + "thefunc"], params.thefunc, "'thefunc' param value incorrect");

                fileTestHelper.getRequests()[0].respond(200, null, JSON.stringify({success: true}));
            });
        });

        it("Sends correct params in request for MPE uploads w/ params specified via API only", function(done) {
            var uploader = getSimpleParamsUploader(true, false);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInBody, done);
        });

        it("sends correct params in request for non-MPE uploads w/ params specified as options only", function(done) {
            var uploader = getSimpleParamsUploader(false, false);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInUrl, done);
        });

        it("sends correct params in request for MPE uploads w/ params initially specified via options then overriden via API", function(done) {
            var uploader = getSimpleParamsUploader(true, true),
                overridenParams = qq.extend({one: 3}, params);

            uploader.setParams(overridenParams);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInBody, done, overridenParams);
        });

        it("sends correct params in request for non-MPE uploads w/ params initially specified via options then overriden via API", function(done) {
            var uploader = getSimpleParamsUploader(false, true),
                overridenParams = qq.extend({foo: "abc"}, params);

            uploader.setParams(overridenParams);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInUrl, done, overridenParams);
        });

        it("sends correct params in request for MPE uploads when params are overriden via API for specific files", function(done) {
            var uploader = getSimpleParamsUploader(true, true),
                overridenParams = qq.extend({one: 3}, params);

            uploader.setParams(overridenParams, 0);
            uploader.setParams({}, 1);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInBody, done, overridenParams);
        });

        it("sends correct params in request for non-MPE uploads when params are overriden via API for specific files", function(done) {
            var uploader = getSimpleParamsUploader(false, true),
                overridenParams = qq.extend({one: 3}, params);

            uploader.setParams(overridenParams, 0);
            uploader.setParams({}, 1);
            assertParamsInRequest(uploader, qq.paramsMode.paramsInUrl, done, overridenParams);
        });

        it("sends correct headers in request w/ headers specified as options", function(done) {
            var uploader = getSimpleHeadersUploader(true);
            assertHeadersInRequest(uploader, done);
        });

        it("sends correct headers in request w/ headers specified via API", function(done) {
            var uploader = getSimpleHeadersUploader();
            assertHeadersInRequest(uploader, done);
        });
    });
}
