/* globals describe, assert, it, qq, qqtest, helpme, $fixture */
describe("test form support", function() {
    "use strict";

    it("switches to manual upload mode if a form is attached", function() {
        var uploader = new qq.FineUploaderBasic({
            form: {
                element: document.createElement("form")
            }
        });

        assert.ok(!uploader._options.autoUpload);
    });

    it("switches to auto upload mode if a form is attached & form.autoUpload is set to true", function() {
        var uploader = new qq.FineUploaderBasic({
            form: {
                element: document.createElement("form"),
                autoUpload: true
            }
        });

        assert.ok(uploader._options.autoUpload);
    });

    if (qqtest.canDownloadFileAsBlob) {
        describe("verify params sent with upload requests", function() {

            var fileTestHelper = helpme.setupFileTests(),
                testUploadEndpoint = "/test/upload",
                formHtml = "<form id='qq-form'><input type='text' name='text_test' value='test'></form>",
                $form = $(formHtml),
                testUploadWithForm = function(uploader, done) {
                    assert.expect(3, done);

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                        fileTestHelper.mockXhr();

                        var request, requestParams;

                        uploader.addBlobs(blob);

                        assert.equal(fileTestHelper.getRequests().length, 0, "Wrong # of requests");
                        uploader.uploadStoredFiles();
                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        request = fileTestHelper.getRequests()[0];
                        requestParams = request.requestBody.fields;
                        assert.equal(requestParams.text_test, "test");
                    });
                };

            it("attaches to form automatically if all conventions are used", function(done) {
                $fixture.append($form);

                var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    }
                });

                testUploadWithForm(uploader, done);
            });

            it("attaches to form automatically if an alternate form ID is specified", function(done) {
                var $newForm = $form.clone().attr("id", "qq-form-test");
                $fixture.append($newForm);

                var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    form: {
                        element: "qq-form-test"
                    }
                });

                testUploadWithForm(uploader, done);
            });

            it("attaches to form automatically if an element is specified", function(done) {
                var $newForm = $form.clone().removeAttr("id");
                $fixture.append($newForm);

                var uploader = new qq.FineUploaderBasic({
                    request: {
                        endpoint: testUploadEndpoint
                    },
                    form: {
                        element: $newForm[0]
                    }
                });

                testUploadWithForm(uploader, done);
            });
        });
    }
});
