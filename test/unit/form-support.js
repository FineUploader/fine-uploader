/* globals describe, assert, it, qq, qqtest, helpme, $fixture, before, after */
describe("test form support", function() {
    "use strict";
    var fakeLog = function() {};


    describe("qq.FormSupport._form2obj", function() {
        it("should properly parse all standard input elements with values", function() {
            var form = $("<form></form>"),
                checkbox = $("<input type='checkbox' name='test_checkbox' checked='checked' value='test-checkbox'>"),
                hidden = $("<input type='hidden' name='test_hidden'>"),
                password = $("<input type='password' name='test_password'>"),
                radio = $("<input type='radio' name='test_radio' checked='checked' value='test-radio'>"),
                text = $("<input type='text' name='test_text'>"),
                select = $("<select name='test_select'><option value='one'></option><option value='two' selected></option></select>"),
                expectedObj = {
                    test_checkbox: "test-checkbox",
                    test_hidden: "hidden_text",
                    test_password: "password_text",
                    test_radio: "test-radio",
                    test_text: "text_text",
                    test_select: "two"
                };

            form.append(checkbox).append(hidden).append(password).append(radio).append(text).append(select);

            checkbox.prop("checked", expectedObj.test_checkbox);
            hidden.val("hidden_text", expectedObj.test_hidden);
            password.val("password_text", expectedObj.test_password);
            radio.prop("checked", expectedObj.test_radio);
            text.val("text_text", expectedObj.test_text);

            assert.deepEqual(qq.FormSupport.prototype._form2Obj(form[0]), expectedObj);
        });

        it("should ignore all non-input elements", function() {
            var form = $("<form></form>"),
                text = $("<input type='text' name='test_text' value='test_text'>"),
                label = $("<label>test</label>"),
                span = $("<span>test2</span>"),
                expectedObj = {
                    test_text: "test_text"
                };

            form.append(label).append(text).append(span);

            assert.deepEqual(qq.FormSupport.prototype._form2Obj(form[0]), expectedObj);
        });

        it("should ignore only irrelevant input elements", function() {
            var form = $("<form></form>"),
                text = $("<input type='text' name='test_text' value='test_text'>"),
                checkbox = $("<input type='checkbox' name='test_checkbox'>"),
                radio = $("<input type='radio' name='test_radio'>"),
                button = $("<input type='button' name='test_button' value='button'>"),
                file = $("<input type='file' name='test_file'>"),
                image = $("<input type='image' name='test_image' scr='some/img'>"),
                reset = $("<input type='reset' name='test_reset'>"),
                submit = $("<input type='submit' name='test_submit' value='submit'>"),
                textarea = $("<textarea name='test_textarea'>test textarea text</textarea>"),
                disabledAndNotHidden = $("<input type='text' name='test_text_disabled' disabled=true>"),
                disabledAndHidden = $("<input type='hidden' name='test_hidden_disabled' value='foo' disabled=true>"),
                expectedObj = {
                    test_text: "test_text",
                    test_hidden_disabled: "foo",
                    test_textarea: "test textarea text"
                };

            form.append(checkbox).append(radio).append(text).append(button).append(file).append(image).append(reset).append(submit).append(disabledAndNotHidden).append(disabledAndHidden).append(textarea);

            assert.deepEqual(qq.FormSupport.prototype._form2Obj(form[0]), expectedObj);
        });
    });

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


    it("uploads files on form submit by default", function(done) {
        assert.expect(1, done);

        var startUpload = function() {
                assert.ok(true);
            },
            form = document.createElement("form"),
            formSupport = new qq.FormSupport({interceptSubmit: true, autoUpload: false, element: form}, startUpload, fakeLog);

        $(form).submit();
    });

    // Ignore test if Conditions API is not supported, or if this is Firefox,
    // which will simply not trigger the submit event or allow the submit function to be invoked
    // if the form is invalid.
    if (document.createElement("form").checkValidity && !qq.firefox()) {
        it("doesn't upload file if form validation fails", function(done) {
            assert.expect(1, done);

            var form = $("<form><input type='text' name='test_text' required></form>")[0],
                startUpload = function() {
                    assert.fail(null, null, "Files should not have been uploaded");
                },
                formSupport;

            form.submit = function() {
                assert.ok(true);
            };
            formSupport = new qq.FormSupport({interceptSubmit: true, autoUpload: false, element: form}, startUpload, fakeLog);

            $(form).submit();
        });
    }

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
