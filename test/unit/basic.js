/* globals describe, beforeEach, $fixture, qq, assert, it */
describe("uploader.basic.js", function () {
    "use strict";

    var $fineUploader, $button, $extraButton, $extraButton2, $extraButton3,
        isIos8 = qq.ios() && navigator.userAgent.indexOf(" OS 8_") !== -1;

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

    it("Excludes the multiple attribute on the file input element by default only in iOS7+ AND when MOV files can be submitted", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
            validation: {
                allowedExtensions: ["gif", "mov"]
            }
        });

        var multipleExpected = (!qq.ios() && qq.supportedFeatures.ajaxUploading) ||
            qq.ios6() ||
            (isIos8 && qq.iosChrome());

        assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), multipleExpected);
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

    it("Includes the multiple attribute on the file input element by default (where supported) except in iOS7+ with the default alloweExtensions value", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0]
        });

        var multipleExpected = (!qq.ios() && qq.supportedFeatures.ajaxUploading) ||
            qq.ios6() ||
            (isIos8 && qq.iosChrome());

        assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), qq.supportedFeatures.ajaxUploading && !qq.ios7());
    });

    it("Excludes the multiple attribute on the file input element if requested, unless iOS8 Chrome", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
            multiple: false
        });

        var multipleExpected = isIos8 && qq.iosChrome();

        assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), multipleExpected);
    });

    it("Excludes or includes the multiple attribute on 'extra' file input elements appropriately, taking OS and extraButton properties into consideration", function() {
        var uploader = new qq.FineUploaderBasic({
            element: $fixture[0],
            button: $button[0],
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

        var multipleExpectedForBtn1 = (!qq.ios() && qq.supportedFeatures.ajaxUploading) ||
            qq.ios6() ||
            (isIos8 && qq.iosChrome());

        var multipleExpectedForBtn2 = isIos8 && qq.iosChrome();

        var multipleExpectedForBtn3 = qq.supportedFeatures.ajaxUploading;

        assert.equal(qq(getFileInput($extraButton)).hasAttribute("multiple"), multipleExpectedForBtn1);
        assert.equal(qq(getFileInput($extraButton2)).hasAttribute("multiple"), multipleExpectedForBtn2);
        assert.equal(qq(getFileInput($extraButton3)).hasAttribute("multiple"), multipleExpectedForBtn3);
    });
});
