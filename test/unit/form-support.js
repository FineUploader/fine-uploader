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

    it("uses action attribute as endpoint", function() {
        var uploader = new qq.FineUploaderBasic({
            form: {
                element: (function() {
                    var form = document.createElement("form");
                    form.setAttribute("action", "form/action/endpoint");
                    return form;
                }()),
                autoUpload: true
            }
        });

        assert.equal(uploader._options.request.endpoint, "form/action/endpoint");
    });

    if (qqtest.canDownloadFileAsBlob) {
        describe("verify params sent with upload requests", function() {

            var fileTestHelper = helpme.setupFileTests(),
                testUploadEndpoint = "/test/upload",
                formHtml = "<form id='qq-form'><input type='text' name='text_test' value='test'></form>",
                $form = $(formHtml),
                testUploadWithForm = function(uploader, endopint, done) {
                    assert.expect(4, done);

                    qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                        fileTestHelper.mockXhr();

                        var request, requestParams;

                        uploader.addBlobs(blob);

                        assert.equal(fileTestHelper.getRequests().length, 0, "Wrong # of requests");
                        uploader.uploadStoredFiles();
                        assert.equal(fileTestHelper.getRequests().length, 1, "Wrong # of requests");

                        request = fileTestHelper.getRequests()[0];
                        assert.equal(request.url, endopint);
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

                testUploadWithForm(uploader, testUploadEndpoint, done);
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

                testUploadWithForm(uploader, testUploadEndpoint, done);
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

                testUploadWithForm(uploader, testUploadEndpoint, done);
            });

            it("uses action attribute as endpoint, if specified", function(done) {
                var $newForm = $form.clone().attr("action", "/form/action");
                $fixture.append($newForm);

                var uploader = new qq.FineUploaderBasic({});

                testUploadWithForm(uploader, "/form/action", done);
            });
        });
    }
});
