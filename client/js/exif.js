qq.Exif = function(fileOrBlob) {
    var TAG_IDS = [274],
        TAG_INFO = {
            274: {
                name: "Orientation",
                bytes: 2
            }
        };

    function parseLittleEndian(hex) {
        var result = 0,
            pow = 0;

        while (hex.length > 0) {
            result += parseInt(hex.substring(0, 2), 16) * Math.pow(2, pow);
            hex = hex.substring(2, hex.length);
            pow += 8;
        }

        return result;
    }

    function seekToApp1(offset, promise) {
        var theOffset = offset,
            thePromise = promise;
        if (theOffset === undefined) {
            theOffset = 2;
            thePromise = new qq.Promise();
        }

        qq.readBlobToHex(fileOrBlob, theOffset, 4).then(function(hex) {
            var match = /^ffe([0-9])/.exec(hex);
            if (match) {
                if (match[1] !== "1") {
                    var segmentLength = parseInt(hex.slice(4, 8), 16);
                    seekToApp1(theOffset + segmentLength + 2, thePromise);
                }
                else {
                    thePromise.success(theOffset);
                }
            }
            else {
                thePromise.failure("No EXIF header to be found!");
            }
        });

        return thePromise;
    }

    function getApp1Offset() {
        var promise = new qq.Promise();

        qq.readBlobToHex(fileOrBlob, 0, 6).then(function(hex) {
            if (hex.indexOf("ffd8") !== 0) {
                promise.failure("Not a valid JPEG!");
            }
            else {
                seekToApp1().then(function(offset) {
                    promise.success(offset);
                },
                function(error) {
                    promise.failure(error);
                });
            }
        });

        return promise;
    }

    function isLittleEndian(app1Start) {
        var promise = new qq.Promise();

        qq.readBlobToHex(fileOrBlob, app1Start + 10, 2).then(function(hex) {
            promise.success(hex === "4949");
        });

        return promise;
    }

    function getDirEntryCount(app1Start, littleEndian) {
        var promise = new qq.Promise();

        qq.readBlobToHex(fileOrBlob, app1Start + 18, 2).then(function(hex) {
            if (littleEndian) {
                return promise.success(parseLittleEndian(hex));
            }
            else {
                promise.success(parseInt(hex, 16));
            }
        });

        return promise;
    }

    function getIfd(app1Start, dirEntries) {
        var offset = app1Start + 20,
            bytes = dirEntries * 12;

        return qq.readBlobToHex(fileOrBlob, offset, bytes);
    }

    function getDirEntries(ifdHex) {
        var entries = [],
            offset = 0;

        while (offset+24 <= ifdHex.length) {
            entries.push(ifdHex.slice(offset, offset + 24));
            offset += 24;
        }

        return entries;
    }

    function getTagValues(littleEndian, dirEntries) {
        var TAG_VAL_OFFSET = 16,
            tagsToFind = qq.extend([], TAG_IDS),
            vals = {};

        qq.each(dirEntries, function(idx, entry) {
            var idHex = entry.slice(0, 4),
                id = littleEndian ? parseLittleEndian(idHex) : parseInt(idHex, 16),
                tagsToFindIdx = tagsToFind.indexOf(id),
                tagValHex, tagName, tagValLength;

            if (tagsToFindIdx >= 0) {
                tagName = TAG_INFO[id].name;
                tagValLength = TAG_INFO[id].bytes;
                tagValHex = entry.slice(TAG_VAL_OFFSET, TAG_VAL_OFFSET + (tagValLength*2));
                vals[tagName] = littleEndian ? parseLittleEndian(tagValHex) : parseInt(tagValHex, 16);

                tagsToFind.splice(tagsToFindIdx, 1);
            }

            if (tagsToFind.length === 0) {
                return false;
            }
        });

        return vals;


    }

    return {
        parse: function() {
            var parser = new qq.Promise(),
                onParseFailure = function(message) {
                    parser.failure(message);
                };

            getApp1Offset().then(function(app1Offset) {
                isLittleEndian(app1Offset).then(function(littleEndian) {
                    getDirEntryCount(app1Offset, littleEndian).then(function(dirEntryCount) {
                        getIfd(app1Offset, dirEntryCount).then(function(ifdHex) {
                            var dirEntries = getDirEntries(ifdHex);
                            parser.success(getTagValues(littleEndian, dirEntries));
                        }, onParseFailure);
                    }, onParseFailure);
                }, onParseFailure);
            }, onParseFailure);

            return parser;
        }
    }
};
