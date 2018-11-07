/*globals qq */
/**
 * EXIF image data parser.  Currently only parses the Orientation tag value,
 * but this may be expanded to other tags in the future.
 *
 * @param fileOrBlob Attempt to parse EXIF data in this `Blob`
 * @constructor
 */
qq.Exif = function(fileOrBlob, log) {
    "use strict";

    // Orientation is the only tag parsed here at this time.
    var TAG_IDS = [274],
        TAG_INFO = {
            274: {
                name: "Orientation",
                bytes: 2
            }
        };

    // Convert a little endian (hex string) to big endian (decimal).
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

    // Find the byte offset, of Application Segment 1 (EXIF).
    // External callers need not supply any arguments.
    function seekToApp1(offset) {
        var theOffset = offset === undefined ? 2 : offset;

        return new Promise(function(resolve, reject) {
            qq.readBlobToHex(fileOrBlob, theOffset, 4).then(function(hex) {
                var match = /^ffe([0-9])/.exec(hex),
                    segmentLength;

                if (match) {
                    if (match[1] !== "1") {
                        segmentLength = parseInt(hex.slice(4, 8), 16);
                        seekToApp1(theOffset + segmentLength + 2).then(resolve, reject);
                    }
                    else {
                        resolve(theOffset);
                    }
                }
                else {
                    reject(new Error("No EXIF header to be found!"));
                }
            });
        });
    }

    // Find the byte offset of Application Segment 1 (EXIF) for valid JPEGs only.
    function getApp1Offset() {
        return new Promise(function(resolve, reject) {
            qq.readBlobToHex(fileOrBlob, 0, 6).then(function(hex) {
                if (hex.indexOf("ffd8") !== 0) {
                    reject(new Error("Not a valid JPEG!"));
                }
                else {
                    seekToApp1().then(resolve, reject);
                }
            });
        });
    }

    // Determine the byte ordering of the EXIF header.
    function isLittleEndian(app1Start) {
        return new Promise(function(resolve) {
            qq.readBlobToHex(fileOrBlob, app1Start + 10, 2).then(function(hex) {
                resolve(hex === "4949");
            });
        });
    }

    // Determine the number of directory entries in the EXIF header.
    function getDirEntryCount(app1Start, littleEndian) {
        return new Promise(function(resolve) {
            qq.readBlobToHex(fileOrBlob, app1Start + 18, 2).then(function(hex) {
                if (littleEndian) {
                    resolve(parseLittleEndian(hex));
                }
                else {
                    resolve(parseInt(hex, 16));
                }
            });
        });
    }

    // Get the IFD portion of the EXIF header as a hex string.
    function getIfd(app1Start, dirEntries) {
        var offset = app1Start + 20,
            bytes = dirEntries * 12;

        return qq.readBlobToHex(fileOrBlob, offset, bytes);
    }

    // Obtain an array of all directory entries (as hex strings) in the EXIF header.
    function getDirEntries(ifdHex) {
        var entries = [],
            offset = 0;

        while (offset + 24 <= ifdHex.length) {
            entries.push(ifdHex.slice(offset, offset + 24));
            offset += 24;
        }

        return entries;
    }

    // Obtain values for all relevant tags and return them.
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
                tagValHex = entry.slice(TAG_VAL_OFFSET, TAG_VAL_OFFSET + (tagValLength * 2));
                vals[tagName] = littleEndian ? parseLittleEndian(tagValHex) : parseInt(tagValHex, 16);

                tagsToFind.splice(tagsToFindIdx, 1);
            }

            if (tagsToFind.length === 0) {
                return false;
            }
        });

        return vals;
    }

    qq.extend(this, {
        /**
         * Attempt to parse the EXIF header for the `Blob` associated with this instance.
         *
         * @returns {Promise} To be resolved when the parsing is complete.
         * If successful, the parsed EXIF header as an object will be included.
         */
        parse: function() {
            return new Promise(function(resolve, reject) {
                function onParseFailure(error) {
                    log(qq.format("EXIF header parse failed: '{}' ", error.message));
                    reject(error);
                }

                getApp1Offset().then(function(app1Offset) {
                    log(qq.format("Moving forward with EXIF header parsing for '{}'", fileOrBlob.name === undefined ? "blob" : fileOrBlob.name));

                    isLittleEndian(app1Offset).then(function(littleEndian) {

                        log(qq.format("EXIF Byte order is {} endian", littleEndian ? "little" : "big"));

                        getDirEntryCount(app1Offset, littleEndian).then(function(dirEntryCount) {

                            log(qq.format("Found {} APP1 directory entries", dirEntryCount));

                            getIfd(app1Offset, dirEntryCount).then(function(ifdHex) {
                                var dirEntries = getDirEntries(ifdHex),
                                    tagValues = getTagValues(littleEndian, dirEntries);

                                log("Successfully parsed some EXIF tags");

                                resolve(tagValues);
                            }, onParseFailure);
                        }, onParseFailure);
                    }, onParseFailure);
                }, onParseFailure);
            });
        }
    });

    /*<testing>*/
    this._testing = {};
    this._testing.parseLittleEndian = parseLittleEndian;
    /*</testing>*/
};
