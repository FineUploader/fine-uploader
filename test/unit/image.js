describe("image.js", function() {
    var imageGenerator,
        isIe7 = navigator.userAgent.indexOf('MSIE 7') !== -1,
        isIe8 = navigator.userAgent.indexOf('MSIE 8') !== -1,
        canvasSupported = function() {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }();

    beforeEach(function() {
        imageGenerator = new qq.ImageGenerator({
            log: function() {}
        });
    });

    describe("isImg", function() {
        it("Properly identify img tag", function() {
            var img = document.createElement("img"),
                div = document.createElement("div");

            assert.ok(imageGenerator._testing.isImg(img));
            assert.ok(!imageGenerator._testing.isImg(div));
        });
    });

    if (canvasSupported) {
        describe("isCanvas", function() {
            it("Properly identify canvas tag", function() {
                var canvas = document.createElement("canvas"),
                    div = document.createElement("div");

                assert.ok(imageGenerator._testing.isCanvas(canvas));
                assert.ok(!imageGenerator._testing.isCanvas(div));
            });
        });
    }

    if (!isIe7 && !isIe8) {
        describe("isCrossOrigin", function() {
            it("ensures a cross-origin URL is properly identified", function() {
                assert.ok(!imageGenerator._testing.isCrossOrigin(window.location.href));
                assert.ok(imageGenerator._testing.isCrossOrigin("http://foobar.com"));
            });
        });
    }

    describe("determineMimeOfFileName", function() {
        it("identifies all renderable image formats", function() {
            var pathsAndExpectedTypes = {
                "http://example.com/hmm/ha/test.jpg": "image/jpeg",
                "http://example.com/hmm/ha/test.jpeg": "image/jpeg",
                "test.jpg": "image/jpeg",
                "test.jpeg": "image/jpeg",
                "http://example.com/hmm/ha/test.png": "image/png",
                "test.png": "image/png",
                "http://example.com/hmm/ha/test.bmp": "image/bmp",
                "test.bmp": "image/bmp",
                "http://example.com/hmm/ha/test.gif": "image/gif",
                "test.gif": "image/gif",
                "http://example.com/hmm/ha/test.tiff": "image/tiff",
                "http://example.com/hmm/ha/test.tif": "image/tiff",
                "test.tif": "image/tiff",
                "test.tif": "image/tiff",
                "http://example.com/hmm/ha/test": null,
                "test": null
            };

            qq.each(pathsAndExpectedTypes, function(path, expectedType) {
                assert.equal(imageGenerator._testing.determineMimeOfFileName(path), expectedType);
            });
        })
    });
});
