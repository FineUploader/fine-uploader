/* globals describe, assert, it, qq */
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
});
