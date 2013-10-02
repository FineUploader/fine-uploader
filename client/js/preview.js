qq.Preview = function() {
    "use strict";

    function drawOnCanvas(sourceImg, canvasEl, orientation, maxSize) {
        var landscape = sourceImg.width >= sourceImg.height,
            aspectRatio = sourceImg.width / sourceImg.height,
            canvasContext = canvasEl.getContext("2d"),
            // iOS subsampling issue
            drawWidthMultipier = qq.ios() ? 2.041 : 1,
            height, width;


        // If this is naturally landscape, but will be rotated to be a portrait...
        if (landscape && qq.indexOf([5,6,7,8], orientation) >= 0) {
            height = maxSize;
            width = Math.round(maxSize/aspectRatio);
        }
         // If this is naturally a landscape, and will remain as such after transformations...
        else if (landscape) {
            height = Math.round(maxSize/aspectRatio);
            width =  maxSize;
        }
        // If this is naturally a portrait, and will remain as such after transformation...
        else {
            height = maxSize;
            width = Math.round(maxSize*aspectRatio);
        }

        qq.log(qq.format("orig w x h = {} x {}", sourceImg.width, sourceImg.height));
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
                canvasContext.rotate( (90 * Math.PI) / 180);
                canvasContext.scale(1, -1);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 6:
                canvasContext.rotate( (90 * Math.PI) / 180);
                canvasContext.translate(0, -width);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 7:
                canvasContext.rotate( (90 * Math.PI) / 180);
                canvasContext.translate(height, -width);
                canvasContext.scale(-1, 1);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            case 8:
                canvasContext.rotate( -(90 * Math.PI) / 180);
                canvasContext.translate(-height, 0);
                canvasContext.drawImage(sourceImg, 0, 0, height, width * drawWidthMultipier);
                break;
            default:
                qq.log(qq.format("{} is not a recognized Orientation EXIF value!", exif.Orientation), "error");
        }
    }

    function draw(fileOrBlob, img, maxSize) {
        var promise = new qq.Promise(),
            fileReader = new FileReader(),
            canvasEl = document.createElement("canvas"),
            tempImg = document.createElement("img");

        fileReader.onload = function(event) {
            tempImg.onload = function() {
                var exif = new qq.Exif(fileOrBlob);

                tempImg.onload = null;

                exif.parse().then(function(exif) {
                    qq.log("exif.Orientation = " + exif.Orientation);

                    drawOnCanvas(tempImg, canvasEl, exif.Orientation, maxSize);
                    img.src = canvasEl.toDataURL();

                    promise.success(exif.Orientation);
                }, function() {
                    drawOnCanvas(tempImg, canvasEl, 1, maxSize);
                    img.src = canvasEl.toDataURL();
                });
            };

            tempImg.onerror = function() {
                //TODO img.src = placeholder based on MIME type

                promise.failure();
            };

//            qq(tempImg).insertBefore(img);
            tempImg.src = event.target.result;
        };

        fileReader.readAsDataURL(fileOrBlob);

        return promise;
    }


    return {
        generate: function(fileOrBlob, img, maxSize) {
            return draw(fileOrBlob, img, maxSize);
        }
    }
};
