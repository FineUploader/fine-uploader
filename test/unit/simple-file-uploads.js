if (qqtest.canDownloadFileAsBlob) {
    describe("simple file uploads, mocked server/XHR", function() {
        var xhr,
            oldWrapCallbacks,
            requests;

        beforeEach(function() {
            mockFormData();

            requests = [];
            oldWrapCallbacks = qq.FineUploaderBasic.prototype._wrapCallbacks;

            // "Turn off" wrapping of callbacks that squelches errors.  We need AssertionErrors in callbacks to bubble.
            qq.FineUploaderBasic.prototype._wrapCallbacks = function() {};
        });

        afterEach(function() {
            unmockXhr();
            unmockFormData();

            qq.FineUploaderBasic.prototype._wrapCallbacks = oldWrapCallbacks;
        });

        function mockXhr() {
            xhr = sinon.useFakeXMLHttpRequest();
            xhr.onCreate = function(req) {
                requests.push(req);
            };
        }

        function unmockXhr() {
            xhr && xhr.restore();
        }

        it("handles a simple successful single MPE file upload request correctly", function(done) {
            assert.expect(16, done);

            var uploader = new qq.FineUploaderBasic({
                autoUpload: false,
                request: {
                    endpoint: "/test/upload"
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

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                mockXhr();

                var requestParams;

                uploader.addBlobs({name: "test", blob: blob});
                uploader.uploadStoredFiles();

                assert.equal(requests.length, 1, "Wrong # of requests");
                requestParams = requests[0].requestBody.fields;

                assert.equal(requestParams.qquuid, uploader.getUuid(0), "Wrong UUID param sent with request");
                assert.equal(requestParams.qqfilename, uploader.getName(0), "Wrong filename param sent with request");
                assert.equal(requestParams.qqtotalfilesize, uploader.getSize(0), "Wrong file size param sent with request");
                assert.ok(qq.isBlob(requestParams.qqfile), "File is incorrect");

                requests[0].respond(200, null, JSON.stringify({success: true}));
            });
        });
    });
}
