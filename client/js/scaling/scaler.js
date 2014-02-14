/* globals qq */
/**
 * Controls generation of scaled images based on a reference image encapsulated in a `File` or `Blob`.
 * Scaled images are generated and converted to blobs on-demand.
 * Multiple scaled images per reference image with varying sizes and other properties are supported.
 *
 * @param spec Information about the scaled images to generate.
 * @param log Logger instance
 * @constructor
 */
qq.Scaler = function(spec, log) {
    "use strict";

    var self = this,
        sendOriginal = spec.sendOriginal,
        orient = spec.orient,
        sizes = this._getSortedSizes(spec.sizes);

    // Revealed API for instances of this module
    qq.extend(this, {
        // If no targeted sizes have been declared or if this browser doesn't support
        // client-side image preview generation, there is no scaling to do.
        enabled: qq.supportedFeatures.imagePreviews && sizes.length > 0,

        getFileRecords: function(originalFileUuid, originalFileName, originalBlobOrBlobData) {
            var self = this,
                records = [],
                originalBlob = originalBlobOrBlobData.blob ? originalBlobOrBlobData.blob : originalBlobOrBlobData;

            // Create records for each scaled version & add them to the records array, smallest first.
            qq.each(sizes, function(idx, sizeRecord) {
                records.push({
                    uuid: qq.getUniqueId(),
                    name: self._getName(originalFileName, {
                        name: sizeRecord.name,
                        type: sizeRecord.type,
                        refType: originalBlob.type
                    }),
                    blob: new qq.BlobProxy(originalBlob,
                        qq.bind(self._generateScaledImage, self, sizeRecord.max, orient, log))
                });
            });

            // Finally, add a record for the original file
            records.push({
                uuid: originalFileUuid,
                name: originalFileName,
                blob: originalBlob
            });

            return records;
        }
    });
};

qq.extend(qq.Scaler.prototype, {
    // Get a file name for a generated scaled file record, based on the provided scaled image description
    _getName: function(originalName, scaledVersionProperties) {
        "use strict";

        var startOfExt = originalName.lastIndexOf("."),
            nameAppendage = " (" + scaledVersionProperties.name + ")",
            versionType = scaledVersionProperties.type || "image/png",
            referenceType = scaledVersionProperties.refType,
            scaledName = "",
            scaledExt = qq.getExtension(originalName);

        if (startOfExt >= 0) {
            scaledName = originalName.substr(0, startOfExt);

            if (referenceType !== versionType) {
                scaledExt = versionType.split("/")[1];
            }

            scaledName += nameAppendage + "." + scaledExt;
        }
        else {
            scaledName = originalName + nameAppendage;
        }

        return scaledName;
    },

    // We want the smallest scaled file to be uploaded first
    _getSortedSizes: function(sizes) {
        "use strict";

        sizes = qq.extend([], sizes);

        return sizes.sort(function(a, b) {
            if (a.max > b.max) {
                return 1;
            }
            if (a.max < b.max) {
                return -1;
            }
            return 0;
        });
    },

    _generateScaledImage: function(size, orient, log, sourceFile) {
        "use strict";

        var self = this,
            scalingEffort = new qq.Promise(),
            imageGenerator = new qq.ImageGenerator(log),
            canvas = document.createElement("canvas");

        imageGenerator.generate(sourceFile, canvas, {maxSize: size, orient: orient}).then(function() {
            var dataUri = canvas.toDataURL(),
                blob = self._dataUriToBlob(dataUri);

            scalingEffort.success(blob);
        });

        return scalingEffort;
    },


    _dataUriToBlob: function(dataUri) {
        "use strict";

        var byteString, mimeString, arrayBuffer, intArray;

        // convert base64 to raw binary data held in a string
        if (dataUri.split(",")[0].indexOf("base64") >= 0) {
            byteString = atob(dataUri.split(",")[1]);
        }
        else {
            byteString = decodeURI(dataUri.split(",")[1]);
        }

        // extract the MIME
        mimeString = dataUri.split(",")[0]
            .split(":")[1]
            .split(";")[0];

        // write the bytes of the binary string to an ArrayBuffer
        arrayBuffer = new ArrayBuffer(byteString.length);
        intArray = new Uint8Array(arrayBuffer);
        qq.each(byteString, function(idx, char) {
            intArray[idx] = char.charCodeAt(0);
        });

        return this._createBlob(arrayBuffer, mimeString);
    },

    _createBlob: function(data, mime) {
        "use strict";

        var BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder ||
                window.MSBlobBuilder,
            blobBuilder = BlobBuilder && new BlobBuilder();

        if (blobBuilder) {
            blobBuilder.append(data);
            return blobBuilder.getBlob(mime);
        }
        else {
            return new Blob([data], {type: mime});
        }
    }
});
