/* globals describe, beforeEach, $fixture, qq, assert, it */
describe("button.js", function () {
    "use strict";

    it("constructor works", function () {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            multiple: true,
            acceptFiles: "image/*,video/*,.test",
            name: "testFile"
        });

        var input = button.getInput();
        var $input = $(input);

        assert.notEqual(input, null,
            "a newed up upload button should have a non-null input element");
        assert.equal($input.attr("type"), "file",
                     "the input type should be `file`");
        assert.equal($input.attr("accept"), "image/*,video/*,.test",
                    "uploader should valid which files are accepted");
        assert.equal($input.attr("name"), "testFile",
                    "the name of the upload button should be set");
    });

    it("reset works", function () {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            multiple: true,
            ios8BrowserCrashWorkaround: false
        });

        var input = button.getInput();

        button.reset();
        assert.notEqual(input, button.getInput(),
               "resetting the button should clear the element from the DOM");
        assert.ok(qq(button.getInput()).hasAttribute("multiple"), "the multiple attribute should be added to new button after reset");
    });

    it("respects the 'title' option", function() {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            title: "foo-bar"
        });

        var input = button.getInput();
        assert.equal(button.getInput().title, "foo-bar");

        button.reset();
        assert.equal(button.getInput().title, "foo-bar");
    });

    it("does add an internal tracker ID to the input button, and re-adds it on reset", function() {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0]
        }),
            buttonId = button.getButtonId();

        /* jshint eqnull:true */
        assert.ok(buttonId != null);
        assert.equal(button.getInput().getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME), buttonId);

        button.reset();
        buttonId = button.getButtonId();
        assert.ok(buttonId != null);
        assert.equal(button.getInput().getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME), buttonId);
    });

    it("sets and removes hover class", function() {
        var hoverclass = "qq-upload-button-hover";
        var $button = $fixture.appendTo("<div id='button'></div>");

        var button = new qq.UploadButton({
            element: $button[0],
            hoverClass: hoverclass
        });

        $button.simulate("mouseenter", function (e) {
            var classes = $(this).attr("class").split(" ");
            assert.ok($.inArray(hoverclass, classes));

            $button.simulate("mouseleave", function (e) {
                classes = $(this).attr("class").split(" ");
                assert.ok(!$.inArray(hoverclass, classes));
            });
        });

    });

    if (qq.supportedFeatures.ajaxUploading) {
        it("sets multiple attribute", function () {
            var $button = $fixture.appendTo("<div></div>");

            var input;
            var button = new qq.UploadButton({
                element: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: false
                }
            });

            input = button.getInput();
            assert.ok(!input.hasAttribute("multiple"));

            button.setMultiple(true);
            assert.ok(input.hasAttribute("multiple"));
        });
    }

    if (qq.supportedFeatures.ajaxUploading) {
        it("sets accept files", function () {
            var $button = $fixture.appendTo("<div></div>");

            var input;
            var button = new qq.UploadButton({
                element: $button[0]
            });

            input = button.getInput();
            assert.ok(!input.hasAttribute("accept"));

            button.setAcceptFiles("audio/*");
            assert.equal(input.getAttribute("accept"), "audio/*");
        });
    }

});
