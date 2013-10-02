qq.Exif = function(fileOrBlob) {
    var TAG_IDS = [274],
        TAG_INFO = {
            274: {
                name: "Orientation",
                bytes: 2
            }
        };

    function getAsHexBytes(buffer) {
        var bytesAsHex = "",
            bytes = new Uint8Array(buffer);


        qq.each(bytes, function(idx, byte) {
            var byteAsHexStr = byte.toString(16);

            if (byteAsHexStr.length < 2) {
                byteAsHexStr = "0" + byteAsHexStr;
            }

            bytesAsHex += byteAsHexStr.toUpperCase();
        });

        qq.log("GAHB IS STRING: " + qq.isString(bytesAsHex));
        qq.log("GAHB HEX: " + bytesAsHex);
        qq.log("GAHB LENGTH: " + bytesAsHex.length);

        return bytesAsHex;
    }

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

    function readToHexString(start, length) {
        qq.log("RTHS: " + length);
        var initialBlob = qq.sliceBlob(fileOrBlob, start, start + length),
            fileReader = new FileReader(),
            promise = new qq.Promise();

        qq.log("RTHS: initialBlobSize = " + initialBlob.size);

        fileReader.onload = function() {
            promise.success(getAsHexBytes(fileReader.result));
        };

        fileReader.readAsArrayBuffer(initialBlob);

        return promise;
    }

    function seekToApp1(offset, promise) {
        var theOffset = offset,
            thePromise = promise;
        if (theOffset === undefined) {
            theOffset = 2;
            thePromise = new qq.Promise();
        }

        readToHexString(theOffset, 4).then(function(hex) {
            var match = /^FFE([0-9])/.exec(hex);
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

        readToHexString(0, 6).then(function(hex) {
            if (hex.indexOf("FFD8") !== 0) {
                qq.log("Not a valid JPEG!");
            }
            else {
                seekToApp1().then(function(offset) {
                    promise.success(offset);
                },
                function(error) {
                    qq.log(error);
                });
            }
        });

        return promise;
    }

    function isLittleEndian(app1Start) {
        var promise = new qq.Promise();

        readToHexString(app1Start + 10, 2).then(function(hex) {
            qq.log("BYTE ORDER: " + hex);
            promise.success(hex === "4949");
        });

        return promise;
    }

    function getDirEntryCount(app1Start, littleEndian) {
        var promise = new qq.Promise();

        readToHexString(app1Start + 18, 2).then(function(hex) {
            qq.log(qq.format("DIR COUNT: little endian? {}, hex: {}", littleEndian, hex));
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
        var promise = new qq.Promise(),
            offset = app1Start + 20,
            bytes = dirEntries * 12,
            fileReader = new FileReader(),
            ifdBlob = qq.sliceBlob(fileOrBlob, offset, offset + bytes);

        qq.log("IFD offset = " + offset);
        qq.log("IFD end = " + (offset + bytes));
        fileReader.onload = function() {
            promise.success(getAsHexBytes(fileReader.result));
        };

        fileReader.readAsArrayBuffer(ifdBlob);

        return promise;
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
            var parser = new qq.Promise();

            getApp1Offset().then(function(app1Offset) {
                qq.log("Got App1");
                isLittleEndian(app1Offset).then(function(littleEndian) {
                    qq.log("Got Little Endian");
                    getDirEntryCount(app1Offset, littleEndian).then(function(dirEntryCount) {
                        qq.log("Got Dir Entry Count");
                        getIfd(app1Offset, dirEntryCount).then(function(ifdHex) {
                            qq.log("Got IFD");
                            var dirEntries = getDirEntries(ifdHex);

                            parser.success(getTagValues(littleEndian, dirEntries));
                        });
                    });
                });
            });

            return parser;
        }
    }
};
