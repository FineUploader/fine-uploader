/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
// The file fails to download when using the Android emulator via Selenium, so we have to exclude it here.
if (qq.supportedFeatures.imageValidation && qqtest.canDownloadFileAsBlob) {
    describe("validation.image.js", function() {
        "use strict";

        this.timeout(4000);

        var testImgKey = "GPN-2000-001635.jpg",
            testImgType = "image/jpeg",
            testImgWidth = 615,
            testImgHeight = 484,
            log = function() {};

        function validate(done, expectedErrorCode, limits) {
            qqtest.downloadFileAsBlob(testImgKey, testImgType).then(function(blob) {
                var imageValidator = new qq.ImageValidation(blob, log),
                    result = imageValidator.validate(limits);

                result.then(function() {
                    if (expectedErrorCode) {
                        assert.ok(false);
                    }
                    else {
                        assert.ok(true);
                    }

                    done();
                },
                function(code) {
                    assert.equal(code, expectedErrorCode);
                    done();
                });
            });
        }

        it("Accepts an image with no limits", function(done) {
            validate(done, null, {});
        });

        it("Accepts an image with all zero limits", function(done) {
            validate(done, null, {
                maxWidth: 0,
                maxHeight: 0,
                minWidth: 0,
                minHeight: 0
            });
        });

        it("Rejects an image that is too tall", function(done) {
            validate(done, "maxHeight", {
                maxHeight: testImgHeight - 1,
                maxWidth: testImgWidth
            });
        });

        it("Rejects an image that is too wide", function(done) {
            validate(done, "maxWidth", {
                maxHeight: testImgHeight,
                maxWidth: testImgWidth - 1
            });
        });

        it("Rejects an image that is not tall enough", function(done) {
            validate(done, "minHeight", {
                minHeight: testImgHeight + 1,
                minWidth: testImgWidth
            });
        });

        it("Rejects an image that is not wide enough", function(done) {
            validate(done, "minWidth", {
                minHeight: testImgHeight,
                minWidth: testImgWidth + 1
            });
        });
    });
}
