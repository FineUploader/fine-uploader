/**
 * Draws a preview of a Blob/File onto an <img> or <canvas>.
 *
 * @returns {{generate: Function}}
 * @constructor
 */
qq.Preview = function() {
    "use strict";

    function registerImgLoadListeners(img, promise) {
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

    function registerCanvasDrawImageListener(canvas, promise) {
        var context = canvas.getContext("2d"),
            oldDrawImage = context.drawImage;

        // The image is drawn on the canvas by a third-party library,
        // and we want to know when this happens so we can fulfill the associated promise.
        context.drawImage = function() {
            oldDrawImage.apply(this, arguments);
            promise.success(canvas);
            context.drawImage = oldDrawImage;
        }
    }

    function registerPreviewListener(imgOrCanvas, promise) {
        var containerTagName = imgOrCanvas.tagName.toLowerCase(),
            isImg = containerTagName === "img",
            isCanvas = containerTagName === "canvas",
            registered = isImg || isCanvas;

        if (isImg) {
            registerImgLoadListeners(imgOrCanvas, promise);
        }
        else if (isCanvas) {
            registerCanvasDrawImageListener(imgOrCanvas, promise);
        }
        else {
            promise.fail(imgOrCanvas);
            qq.log(qq.format("Element container of type {} is not supported!", containerTagName), "error");
        }

        return registered;
    }

    // Draw the preview iff the current UA can natively display it.
    // Also rotate the image if necessary.
    function draw(fileOrBlob, container, maxSize) {
        var drawPreview = new qq.Promise(),
            identifier = new qq.Identify(fileOrBlob);

        identifier.isPreviewable().then(
            function() {
                var exif = new qq.Exif(fileOrBlob),
                    mpImg = new MegaPixImage(fileOrBlob);

                if (registerPreviewListener(container, drawPreview)) {
                    exif.parse().then(
                        function(exif) {
                            var orientation = exif.Orientation;

                            mpImg.render(container, {
                                maxWidth: maxSize,
                                maxHeight: maxSize,
                                orientation: orientation
                            });
                        },

                        function(failureMsg) {
                            qq.log(qq.format("EXIF data could not be parsed ({}).  Assuming orientation = 1.", failureMsg));

                            mpImg.render(container, {
                                maxWidth: maxSize,
                                maxHeight: maxSize
                            });
                        }
                    );
                }
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
         * @param container <img> or <canvas> to contain the preview
         * @param maxSize
         * @returns qq.Promise fulfilled when the preview has been drawn, or the attempt has failed
         */
        generate: function(fileOrBlob, container, maxSize) {
            return draw(fileOrBlob, container, maxSize);
        }
    }
};
