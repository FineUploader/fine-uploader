qq.Preview = function() {
    "use strict";

    function draw(fileOrBlob, targetImg, maxSize) {
        var drawPreview = new qq.Promise(),
            identifier = new qq.Identify(fileOrBlob);

        identifier.isPreviewable().then(
            function() {
                var exif = new qq.Exif(fileOrBlob),
                    mpImg = new MegaPixImage(fileOrBlob);

                exif.parse().then(
                    function(exif) {
                        var orientation = exif.Orientation;

                        mpImg.render(targetImg, {
                            maxWidth: maxSize,
                            maxHeight: maxSize,
                            orientation: orientation
                        });

                        drawPreview.success(orientation);
                    },

                    function(failureMsg) {
                        qq.log(qq.format("EXIF data could not be parsed ({}).  Assuming orientation = 1.", failureMsg));

                        mpImg.render(targetImg, {
                            maxWidth: maxSize,
                            maxHeight: maxSize
                        });

                        drawPreview.success(1);
                    }
                );
            },

            function() {
                qq.log("Not previewable");
                drawPreview.failure();
            }
        );

        return drawPreview;
    }


    return {
        generate: function(fileOrBlob, targetImg, maxSize) {
            return draw(fileOrBlob, targetImg, maxSize);
        }
    }
};
