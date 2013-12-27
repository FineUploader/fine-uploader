/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("exif.js", function () {
    "use strict";

    describe("parseLittleEndian", function() {
        it("converts little endian hex string to big endian decimal", function () {
            var exif = new qq.Exif(),
                maybeBigEndian = exif._testing.parseLittleEndian("012345AB"),
                expectedBigEndian = parseInt("AB452301", 16);

            assert.equal(maybeBigEndian, expectedBigEndian);
        });
    });

    if (qq.supportedFeatures.imagePreviews && qqtest.canDownloadFileAsBlob) {
        describe("JPEG Orientation tag extraction", function() {

            function testOrientation(key, expectedOrientation, done) {
                qqtest.downloadFileAsBlob(key, "image/jpeg").then(function(blob) {
                    new qq.Exif(blob, function() {}).parse().then(function(tagVals) {
                        assert.equal(tagVals.Orientation, expectedOrientation);
                        done();
                    }, function() {
                        assert.fail("Failed to extract EXIF data!");
                    });
                }, function() {
                    assert.fail("Problem downloading test file");
                });
            }

            it("Correctly parses Orientation for 1-oriented image", function(done) {
                testOrientation("up.jpg", 1, done);
            });

            it("Correctly parses Orientation for 2-oriented image", function(done) {
                testOrientation("up-mirrored.jpg", 2, done);
            });

            it("Correctly parses Orientation for 3-oriented image", function(done) {
                testOrientation("down.jpg", 3, done);
            });

            it("Correctly parses Orientation for 4-oriented image", function(done) {
                testOrientation("down-mirrored.jpg", 4, done);
            });

            it("Correctly parses Orientation for 5-oriented image", function(done) {
                testOrientation("left-mirrored.jpg", 5, done);
            });

            it("Correctly parses Orientation for 6-oriented image", function(done) {
                testOrientation("left.jpg", 6, done);
            });

            it("Correctly parses Orientation for 7-oriented image", function(done) {
                testOrientation("right-mirrored.jpg", 7, done);
            });

            it("Correctly parses Orientation for 8-oriented image", function(done) {
                testOrientation("right.jpg", 8, done);
            });
        });
    }
});
