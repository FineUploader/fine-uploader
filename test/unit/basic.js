/* globals describe, beforeEach, $fixture, qq, assert, it */
describe("uploader.basic.js", function () {
    "use strict";

    var $fineUploader, $button, $extraButton, $extraButton2, $extraButton3;

    function getFileInput($containerEl) {
        return $containerEl.find("INPUT")[0];
    }

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $fineUploader = $fixture.find("#fine-uploader");

        $fixture.append("<div id='test-button'></div>");
        $button = $fixture.find("#test-button");

        $fixture.append("<div id='test-button2'></div>");
        $extraButton = $fixture.find("#test-button2");

        $fixture.append("<div id='test-button3'></div>");
        $extraButton2 = $fixture.find("#test-button3");

        $fixture.append("<div id='test-button4'></div>");
        $extraButton3 = $fixture.find("#test-button4");
    });

    it("Includes the multiple attribute on the file input element by default in all supported browsers (even iOS7+) when MOV files cannot be submitted", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
            validation: {
                allowedExtensions: ["gif", "jpeg"]
            }
        });

        assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), qq.supportedFeatures.ajaxUploading);
    });

    it("Includes the multiple attribute on the file input element by default (where supported)", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0]
        });

        assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), qq.supportedFeatures.ajaxUploading && !qq.ios());
    });

    it("Excludes the multiple attribute on the file input element if requested", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
            multiple: false,
            workarounds: {
                ios8BrowserCrash: false,
                iosEmptyVideos: false
            }
        });

        assert.ok(!qq(getFileInput($button)).hasAttribute("multiple"));
    });

    qq.supportedFeatures.ajaxUploading && it("Excludes or includes the multiple attribute on 'extra' file input elements appropriately, taking extraButton properties into consideration", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
            workarounds: {
                ios8BrowserCrash: false,
                iosEmptyVideos: false
            },
            validation: {
                allowedExtensions: ["gif", "mov"]
            },
            extraButtons: [
                {
                    element: $extraButton[0]
                },
                {
                    element: $extraButton2[0],
                    multiple: false
                },
                {
                    element: $extraButton3[0],
                    validation: {
                        allowedExtensions: ["gif"]
                    }
                }
            ]
        });

        assert.equal(qq(getFileInput($extraButton)).hasAttribute("multiple"), true);
        assert.equal(qq(getFileInput($extraButton2)).hasAttribute("multiple"), false);
        assert.equal(qq(getFileInput($extraButton3)).hasAttribute("multiple"), true);
    });

    it("applies the correct title attribute to a file input", function() {
        var uploader = new qq.FineUploaderBasic({
            text: {
                fileInputTitle: "default title"
            },
            extraButtons: [
                {
                    element: $extraButton[0]
                },
                {
                    element: $extraButton2[0],
                    fileInputTitle: "extrabutton2"
                }
            ]
        });

        assert.equal(getFileInput($extraButton).title, "default title");
        assert.equal(getFileInput($extraButton2).title, "extrabutton2");
    });
});
