/*global qq, define */
/*jshint strict:false,bitwise:false,nonew:false,asi:true,-W064,-W116,-W089 */
/**
 * Mega pixel image rendering library for iOS6+
 *
 * Fixes iOS6+'s image file rendering issue for large size image (over mega-pixel),
 * which causes unexpected subsampling when drawing it in canvas.
 * By using this library, you can safely render the image with proper stretching.
 *
 * Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>
 * Released under the MIT license
 *
 * Heavily modified by Widen for Fine Uploader
 */
(function() {

    /**
     * Detect subsampling in loaded image.
     * In iOS, larger images than 2M pixels may be subsampled in rendering.
     */
    function detectSubsampling(img) {
        var iw = img.naturalWidth,
            ih = img.naturalHeight,
            canvas = document.createElement("canvas"),
            ctx;

        if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
            canvas.width = canvas.height = 1;
            ctx = canvas.getContext("2d");
            ctx.drawImage(img, -iw + 1, 0);
            // subsampled image becomes half smaller in rendering size.
            // check alpha channel value to confirm image is covering edge pixel or not.
            // if alpha value is 0 image is not covering, hence subsampled.
            return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
        } else {
            return false;
        }
    }

    /**
     * Detecting vertical squash in loaded image.
     * Fixes a bug which squash image vertically while drawing into canvas for some images.
     */
    function detectVerticalSquash(img, iw, ih) {
        var canvas = document.createElement("canvas"),
            sy = 0,
            ey = ih,
            py = ih,
            ctx, data, alpha, ratio;

        canvas.width = 1;
        canvas.height = ih;
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        data = ctx.getImageData(0, 0, 1, ih).data;

        // search image edge pixel position in case it is squashed vertically.
        while (py > sy) {
            alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py;
            } else {
                sy = py;
            }
            py = (ey + sy) >> 1;
        }

        ratio = (py / ih);
        return (ratio === 0) ? 1 : ratio;
    }

    /**
     * Rendering image element (with resizing) and get its data URL
     */
    function renderImageToDataURL(img, options, doSquash) {
        var canvas = document.createElement("canvas"),
            mime = options.mime || "image/jpeg";

        renderImageToCanvas(img, canvas, options, doSquash);
        return canvas.toDataURL(mime, options.quality || 0.8);
    }

    function maybeCalculateDownsampledDimensions(spec) {
        var maxPixels = 5241000; //iOS specific value

        if (!qq.ios()) {
            throw new qq.Error("Downsampled dimensions can only be reliably calculated for iOS!");
        }

        if (spec.origHeight * spec.origWidth > maxPixels) {
            return {
                newHeight: Math.round(Math.sqrt(maxPixels * (spec.origHeight / spec.origWidth))),
                newWidth: Math.round(Math.sqrt(maxPixels * (spec.origWidth / spec.origHeight)))
            }
        }
    }

    /**
     * Rendering image element (with resizing) into the canvas element
     */
    function renderImageToCanvas(img, canvas, options, doSquash) {
        var iw = img.naturalWidth,
            ih = img.naturalHeight,
            width = options.width,
            height = options.height,
            ctx = canvas.getContext("2d"),
            modifiedDimensions;

        ctx.save();

        if (!qq.supportedFeatures.unlimitedScaledImageSize) {
            modifiedDimensions = maybeCalculateDownsampledDimensions({
                origWidth: width,
                origHeight: height
            });

            if (modifiedDimensions) {
                qq.log(qq.format("Had to reduce dimensions due to device limitations from {}w / {}h to {}w / {}h",
                    width, height, modifiedDimensions.newWidth, modifiedDimensions.newHeight),
                "warn");

                width = modifiedDimensions.newWidth;
                height = modifiedDimensions.newHeight;
            }
        }

        transformCoordinate(canvas, width, height, options.orientation);

        // Fine Uploader specific: Save some CPU cycles if not using iOS
        // Assumption: This logic is only needed to overcome iOS image sampling issues
        if (qq.ios()) {
            (function() {
                if (detectSubsampling(img)) {
                    iw /= 2;
                    ih /= 2;
                }

                var d = 1024, // size of tiling canvas
                    tmpCanvas = document.createElement("canvas"),
                    vertSquashRatio = doSquash ? detectVerticalSquash(img, iw, ih) : 1,
                    dw = Math.ceil(d * width / iw),
                    dh = Math.ceil(d * height / ih / vertSquashRatio),
                    sy = 0,
                    dy = 0,
                    tmpCtx, sx, dx;

                tmpCanvas.width = tmpCanvas.height = d;
                tmpCtx = tmpCanvas.getContext("2d");

                while (sy < ih) {
                    sx = 0,
                    dx = 0;
                    while (sx < iw) {
                        tmpCtx.clearRect(0, 0, d, d);
                        tmpCtx.drawImage(img, -sx, -sy);
                        ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                        sx += d;
                        dx += dw;
                    }
                    sy += d;
                    dy += dh;
                }
                ctx.restore();
                tmpCanvas = tmpCtx = null;
            }())
        }
        else {
            ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.qqImageRendered && canvas.qqImageRendered();
    }

    /**
     * Transform canvas coordination according to specified frame size and orientation
     * Orientation value is from EXIF tag
     */
    function transformCoordinate(canvas, width, height, orientation) {
        switch (orientation) {
            case 5:
            case 6:
            case 7:
            case 8:
                canvas.width = height;
                canvas.height = width;
                break;
            default:
                canvas.width = width;
                canvas.height = height;
        }
        var ctx = canvas.getContext("2d");
        switch (orientation) {
            case 2:
                // horizontal flip
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
                break;
            case 3:
                // 180 rotate left
                ctx.translate(width, height);
                ctx.rotate(Math.PI);
                break;
            case 4:
                // vertical flip
                ctx.translate(0, height);
                ctx.scale(1, -1);
                break;
            case 5:
                // vertical flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.scale(1, -1);
                break;
            case 6:
                // 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(0, -height);
                break;
            case 7:
                // horizontal flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(width, -height);
                ctx.scale(-1, 1);
                break;
            case 8:
                // 90 rotate left
                ctx.rotate(-0.5 * Math.PI);
                ctx.translate(-width, 0);
                break;
            default:
                break;
        }
    }

    /**
     * MegaPixImage class
     */
    function MegaPixImage(srcImage, errorCallback) {
        var self = this;

        if (window.Blob && srcImage instanceof Blob) {
            (function() {
                var img = new Image(),
                    URL = window.URL && window.URL.createObjectURL ? window.URL :
                        window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL : null;
                if (!URL) { throw Error("No createObjectURL function found to create blob url"); }
                img.src = URL.createObjectURL(srcImage);
                self.blob = srcImage;
                srcImage = img;
            }());
        }
        if (!srcImage.naturalWidth && !srcImage.naturalHeight) {
            srcImage.onload = function() {
                var listeners = self.imageLoadListeners;
                if (listeners) {
                    self.imageLoadListeners = null;
                    // IE11 doesn't reliably report actual image dimensions immediately after onload for small files,
                    // so let's push this to the end of the UI thread queue.
                    setTimeout(function() {
                        for (var i = 0, len = listeners.length; i < len; i++) {
                            listeners[i]();
                        }
                    }, 0);
                }
            };
            srcImage.onerror = errorCallback;
            this.imageLoadListeners = [];
        }
        this.srcImage = srcImage;
    }

    /**
     * Rendering megapix image into specified target element
     */
    MegaPixImage.prototype.render = function(target, options) {
        options = options || {};

        var self = this,
            imgWidth = this.srcImage.naturalWidth,
            imgHeight = this.srcImage.naturalHeight,
            width = options.width,
            height = options.height,
            maxWidth = options.maxWidth,
            maxHeight = options.maxHeight,
            doSquash = !this.blob || this.blob.type === "image/jpeg",
            tagName = target.tagName.toLowerCase(),
            opt;

        if (this.imageLoadListeners) {
            this.imageLoadListeners.push(function() { self.render(target, options) });
            return;
        }

        if (width && !height) {
            height = (imgHeight * width / imgWidth) << 0;
        } else if (height && !width) {
            width = (imgWidth * height / imgHeight) << 0;
        } else {
            width = imgWidth;
            height = imgHeight;
        }
        if (maxWidth && width > maxWidth) {
            width = maxWidth;
            height = (imgHeight * width / imgWidth) << 0;
        }
        if (maxHeight && height > maxHeight) {
            height = maxHeight;
            width = (imgWidth * height / imgHeight) << 0;
        }

        opt = { width: width, height: height },
        qq.each(options, function(optionsKey, optionsValue) {
            opt[optionsKey] = optionsValue;
        });

        if (tagName === "img") {
            (function() {
                var oldTargetSrc = target.src;
                target.src = renderImageToDataURL(self.srcImage, opt, doSquash);
                oldTargetSrc === target.src && target.onload();
            }())
        } else if (tagName === "canvas") {
            renderImageToCanvas(this.srcImage, target, opt, doSquash);
        }
        if (typeof this.onrender === "function") {
            this.onrender(target);
        }
    };

    qq.MegaPixImage = MegaPixImage;
})();
