/*globals qq */
qq.Identify = function(fileOrBlob, log) {
    "use strict";

    var PREVIEWABLE_MIME_TYPES = [
            "image/jpeg",
            "image/gif",
            "image/png",
            "image/bmp",
            "image/tiff"
        ],
        PREVIEWABLE_MAGIC_BYTES = {
            "image/jpeg": "ffd8ff",
            "image/gif": "474946",
            "image/png": "89504e",
            "image/bmp": "424d",
            "image/tiff": ["49492a00", "4d4d002a"]
        };

    function isIdentifiable(magicBytes, questionableBytes) {
        var identifiable = false,
            magicBytesEntries = [].concat(magicBytes);

        qq.each(magicBytesEntries, function(idx, magicBytesArrayEntry) {
            if (questionableBytes.indexOf(magicBytesArrayEntry) === 0) {
                identifiable = true;
                return false;
            }
        });

        return identifiable;
    }

    qq.extend(this, {
        /**
         * Determines if a Blob can be displayed natively in the current browser.  This is done by reading magic
         * bytes in the beginning of the file, so this is an asynchronous operation.
         *
         * @returns {qq.Promise} Promise that is fulfilled when identification is complete.
         * If successful, the MIME string is passed to the success handler.
         */
        isPreviewable: function() {
            var idenitifer = new qq.Promise(),
                previewable = false,
                name = fileOrBlob.name === undefined ? "blob" : fileOrBlob.name;

            log(qq.format("Attempting to determine if {} can be rendered in this browser", name));

            qq.readBlobToHex(fileOrBlob, 0, 4).then(function(hex) {
                qq.each(PREVIEWABLE_MAGIC_BYTES, function(mime, bytes) {
                    if (isIdentifiable(bytes, hex)) {
                        // Safari is the only supported browser that can deal with TIFFs natively,
                        // so, if this is a TIFF and the UA isn't Safari, declare this file "non-previewable".
                        if (mime !== "image/tiff" || qq.supportedFeatures.tiffPreviews) {
                            previewable = true;
                            idenitifer.success(mime);
                        }

                        return false;
                    }
                });

                log(qq.format("'{}' is {} able to be rendered in this browser", name, previewable ? "" : "NOT"));

                if (!previewable) {
                    idenitifer.failure();
                }
            });

            return idenitifer;
        },

        /**
         * Determines if a Blob can be displayed natively in the current browser.  This is done by checking the
         * blob's type attribute.  This is a synchronous operation, useful for situations where an asynchronous operation
         * would be challenging to support.  Note that the blob's type property is not as accurate as reading the
         * file's magic bytes.
         *
         * @returns {Boolean} true if the blob can be rendered in the current browser
         */
        isPreviewableSync: function() {
            var fileMime = fileOrBlob.type,
                isRecognizedImage = qq.indexOf(PREVIEWABLE_MIME_TYPES, fileMime) >= 0;

            if (isRecognizedImage) {
                if (fileMime === "image/tiff") {
                    return qq.supportedFeatures.tiffPreviews;
                }
                return true;
            }
            return false;
        }
    });
};
