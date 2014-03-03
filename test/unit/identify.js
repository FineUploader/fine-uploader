/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qq.supportedFeatures.imagePreviews && qqtest.canDownloadFileAsBlob) {
    describe("identify.js", function() {
        "use strict";

        function testPreviewability(expectedToBePreviewable, key, expectedMime, done) {
            qqtest.downloadFileAsBlob(key, expectedMime).then(function(blob) {
                new qq.Identify(blob, function() {}).isPreviewable().then(function(mime) {
                    !expectedToBePreviewable && assert.fail();
                    assert.equal(mime, expectedMime);
                    done();
                }, function() {
                    expectedToBePreviewable && assert.fail();
                    assert.ok(true);
                    done();
                });
            }, function() {
                assert.fail("Problem downloading test file");
            });
        }

        it("classifies gif as previewable", function(done) {
            testPreviewability(true, "drop-background.gif", "image/gif", done);
        });

        it("classifies jpeg as previewable", function(done) {
            testPreviewability(true, "fearless.jpeg", "image/jpeg", done);
        });

        it("classifies bmp as previewable", function(done) {
            testPreviewability(true, "g04.bmp", "image/bmp", done);
        });

        it("classifies png as previewable", function(done) {
            testPreviewability(true, "not-available_l.png", "image/png", done);
        });

        it("classifies tiff as previewable", function(done) {
            testPreviewability(qq.supportedFeatures.tiffPreviews, "sample.tif", "image/tiff", done);
        });

        it("marks a non-image as not previewable", function(done) {
            testPreviewability(false, "simpletext.txt", null, done);
        });
    });
}
