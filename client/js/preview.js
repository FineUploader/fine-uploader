qq.Preview = function() {
    "use strict";

    function drawOnCanvas(sourceImg, canvasEl, orientation, maxSize) {
        var landscape = sourceImg.width >= sourceImg.height,
            aspectRatio = sourceImg.width / sourceImg.height,
            canvasContext = canvasEl.getContext("2d"),
            drawWidthMultipier = qq.ios() ? 2.041 : 1,// iOS subsampling issue workaround,
            height = maxSize,
            width = Math.round(maxSize * aspectRatio);


        // If this is naturally landscape, but will be rotated to be a portrait...
        if (landscape && qq.indexOf([5,6,7,8], orientation) >= 0) {
            height = maxSize;
            width = Math.round(maxSize / aspectRatio);
        }
         // If this is naturally a landscape, and will remain as such after transformations...
        else if (landscape) {
            height = Math.round(maxSize / aspectRatio);
            width =  maxSize;
        }

        canvasEl.width = width;
        canvasEl.height = height;

        switch(orientation) {
            case 1:
                canvasContext.drawImage(sourceImg, 0, 0, width, height * drawWidthMultipier);
                break;
            case 2:
                canvasContext.translate(width, 0);
                canvasContext.scale(-1, 1);
                canvasContext.drawImage(sourceImg, 0, 0, width, height * drawWidthMultipier);
                break;
            case 3:
                canvasContext.translate(width, height);
                canvasContext.rotate(Math.PI);
                canvasContext.drawImage(sourceImg, 0, 0, width, height * drawWidthMultipier);
                break;
            case 4:
                canvasContext.translate(0, height);
                canvasContext.scale(1, -1);
                canvasContext.drawImage(sourceImg, 0, 0, width, height * drawWidthMultipier);
                break;
            case 5:
                canvasContext.rotate(Math.PI / 2);
                canvasContext.scale(1, -1);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 6:
                canvasContext.rotate(Math.PI / 2);
                canvasContext.translate(0, -width);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 7:
                canvasContext.rotate(Math.PI / 2);
                canvasContext.translate(height, -width);
                canvasContext.scale(-1, 1);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 8:
                canvasContext.rotate(-Math.PI / 2);
                canvasContext.translate(-height, 0);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            default:
                qq.log(qq.format("{} is not a recognized orientation value!", orientation), "error");
        }
    }

    function draw(fileOrBlob, targetImg, maxSize) {
        var drawPreview = new qq.Promise(),
            fileReader = new FileReader(),
            canvasEl = document.createElement("canvas"),
            fullSizedImg = document.createElement("img"),
            identifier = new qq.Identify(fileOrBlob);

        identifier.isPreviewable().then(function(mime) {
            qq.log("Identified as " + mime);
            fileReader.onload = function(event) {
                fullSizedImg.onload = function() {
                    var exif = new qq.Exif(fileOrBlob);

                    fullSizedImg.onload = null;

                    exif.parse().then(
                        function(exif) {
                            var orientation = exif.Orientation;

                            drawOnCanvas(fullSizedImg, canvasEl, orientation, maxSize);

                            targetImg.src = canvasEl.toDataURL();
                            drawPreview.success(orientation);
                        },
                        function(failureMsg) {
                            qq.log(qq.format("EXIF data could not be parsed ({}).  Assuming orientation = 1.", failureMsg));
                            drawOnCanvas(fullSizedImg, canvasEl, 1, maxSize);
                            targetImg.src = canvasEl.toDataURL();
                            drawPreview.success(1);
                        }
                    );
                };

                fullSizedImg.onerror = function() {
                    //TODO img.src = placeholder based on MIME type
                    qq.log("Client-side preview is not possible.");
                    drawPreview.failure();
                };

                fullSizedImg.src = event.target.result;
            };

            fileReader.readAsDataURL(fileOrBlob);
        }, function() {
            qq.log("Not previewable");
            drawPreview.failure();
        });

        return drawPreview;
    }


    return {
        generate: function(fileOrBlob, targetImg, maxSize) {
            return draw(fileOrBlob, targetImg, maxSize);
        }
    }
};
