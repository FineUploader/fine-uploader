if (qqtest.canDownloadFileAsBlob) {
    describe("expected upload behavior tests - core uploader", function() {
        var oldWrapCallbacks;

        before(function() {
            oldWrapCallbacks = qq.FineUploaderBasic.prototype._wrapCallbacks;

            // "Turn off" wrapping of callbacks that squelches errors.  We need AssertionErrors in callbacks to bubble.
            qq.FineUploaderBasic.prototype._wrapCallbacks = function() {};
        });

        after(function() {
            qq.FineUploaderBasic.prototype._wrapCallbacks = oldWrapCallbacks;
        });

        it("handles a simple blob submission correctly (autoUpload = false)", function(done) {
            var uploader = new qq.FineUploaderBasic({
                autoUpload: false,
                callbacks: {
                    onSubmit: function(id, name) {
                        callbackOrder.push("submit");
                        assert.equal(id, 0);
                        assert.equal(name, expectedName);
                    },
                    onSubmitted: function(id, name) {
                        callbackOrder.push("submitted");
                        assert.equal(id, 0);
                        assert.equal(name, expectedName);
                    },
                    onValidate: function(blobData) {
                        callbackOrder.push("validate");
                        assert.equal(blobData.name, expectedName);
                        assert.equal(blobData.size, expectedFileSize);
                    },
                    onValidateBatch: function(blobDataArray) {
                        callbackOrder.push("validateBatch");
                        assert.equal(blobDataArray.length, 1);
                        assert.equal(blobDataArray[0].name, expectedName);
                        assert.equal(blobDataArray[0].size, expectedFileSize);
                    },
                    onStatusChange: function(id, oldStatus, newStatus) {
                        assert.equal(id, 0);
                        statusChangeOrder.push(newStatus);
                    }
                }
            }),
                callbackOrder = [],
                statusChangeOrder = [],
                expectedFileSize = 3266,
                expectedName = "testname",
                expectedCallbackOrder = ["validateBatch", "validate", "submit", "submitted"],
                expectedStatusChangeOrder = [qq.status.SUBMITTING, qq.status.SUBMITTED];

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                uploader.addBlobs({blob: blob, name: expectedName});

                assert.deepEqual(callbackOrder, expectedCallbackOrder, "Callbacks invoked in wrong order");
                assert.deepEqual(statusChangeOrder, expectedStatusChangeOrder, "Status changed in wrong order");
                assert.equal(uploader.getName(0), expectedName, "Wrong filename");
                assert.equal(uploader.getNetUploads(), 0, "Wrong # of net uploads");
                assert.equal(uploader.getSize(0), expectedFileSize, "Wrong file size");
                assert.equal(uploader.getUploads().length, 1, "Wrong number of uploads");
                assert.equal(uploader.getUploads({id: 0}).name, expectedName, "Wrong filename");
                assert.equal(uploader.getUploads({id: 0}).originalName, expectedName, "Wrong original name");
                assert.equal(uploader.getUploads({id: 0}).size, expectedFileSize, "Wrong file size");
                assert.equal(uploader.getUploads({id: 0}).status, qq.status.SUBMITTED, "Wrong status");

                done();
            }, function() {
                assert.fail("Failed to download test file");
            });
        });
    });
}
