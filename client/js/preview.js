/**
 * Draws a preview of a Blob/File onto an <img>.
 *
 * @returns {{generate: Function}}
 * @constructor
 */
qq.Preview = function() {
    "use strict";

    function registerPreviewListener(img, promise) {
        img.onload = function() {
            img.onload = null;
            img.onerror = null;
            promise.success(img);
        };

        img.onerror = function() {
            img.onload = null;
            img.onerror = null;
            qq.log("Problem drawing preview!", "error");
            promise.failure(img);
        };
    }

    // Draw the preview iff the current UA can natively display it.
    // Also rotate the image if necessary.
    function draw(fileOrBlob, targetImg, maxSize) {
        var drawPreview = new qq.Promise(),
            identifier = new qq.Identify(fileOrBlob);

        identifier.isPreviewable().then(
            function() {
                var exif = new qq.Exif(fileOrBlob),
                    mpImg = new MegaPixImage(fileOrBlob);

                registerPreviewListener(targetImg, drawPreview);

                exif.parse().then(
                    function(exif) {
                        var orientation = exif.Orientation;

                        mpImg.render(targetImg, {
                            maxWidth: maxSize,
                            maxHeight: maxSize,
                            orientation: orientation
                        });
                    },

                    function(failureMsg) {
                        qq.log(qq.format("EXIF data could not be parsed ({}).  Assuming orientation = 1.", failureMsg));

                        mpImg.render(targetImg, {
                            maxWidth: maxSize,
                            maxHeight: maxSize
                        });
                    }
                );
            },

            function() {
                qq.log("Not previewable");
                //TODO optionally include placeholder image
                drawPreview.failure();
            }
        );

        return drawPreview;
    }


    return {
        /**
         * Generate the preview.
         *
         * @param fileOrBlob
         * @param targetImg
         * @param maxSize
         * @returns qq.Promise fulfilled when the preview has been drawn, or the attempt has failed
         */
        generate: function(fileOrBlob, targetImg, maxSize) {
            return draw(fileOrBlob, targetImg, maxSize);
        }
    }
};
