qq.Identify = function(fileOrBlob, log) {
    var PREVIEWABLE_MAGIC_BYTES = {
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

    return {
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
                        if (mime !== "image/tiff" || qq.safari()) {
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
        }
    }
};
