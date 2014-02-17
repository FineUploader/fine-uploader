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

    var includeReference = spec.sendOriginal,
        orient = spec.orient,
        defaultType = spec.defaultType,
        defaultQuality = spec.defaultQuality / 100,
        failedToScaleText = spec.failureText,
        sizes = this._getSortedSizes(spec.sizes);

    // Revealed API for instances of this module
    qq.extend(this, {
        // If no targeted sizes have been declared or if this browser doesn't support
        // client-side image preview generation, there is no scaling to do.
        enabled: qq.supportedFeatures.imagePreviews && sizes.length > 0,

        getFileRecords: function(originalFileUuid, originalFileName, originalBlobOrBlobData) {
            var self = this,
                records = [],
                originalBlob = originalBlobOrBlobData.blob ? originalBlobOrBlobData.blob : originalBlobOrBlobData,
                idenitifier = new qq.Identify(originalBlob, log);

            // If the reference file cannot be rendered natively, we can't create scaled versions.
            if (idenitifier.isPreviewableSync()) {
                // Create records for each scaled version & add them to the records array, smallest first.
                qq.each(sizes, function(idx, sizeRecord) {
                    var outputType = self._determineOutputType({defaultType: defaultType, requestedType: sizeRecord.type});

                    records.push({
                        uuid: qq.getUniqueId(),
                        name: self._getName(originalFileName, {
                            name: sizeRecord.name,
                            type: outputType,
                            refType: originalBlob.type
                        }),
                        blob: new qq.BlobProxy(originalBlob,
                            qq.bind(self._generateScaledImage, self, {
                                size: sizeRecord.max,
                                orient: orient,
                                type: outputType,
                                quality: defaultQuality,
                                failedText: failedToScaleText,
                                log: log
                            }))
                        }
                    );
                });
            }

            // Finally, add a record for the original file (if requested)
            includeReference && records.push({
                uuid: originalFileUuid,
                name: originalFileName,
                blob: originalBlob
            });

            return records;
        }
    });
};

qq.extend(qq.Scaler.prototype, {
    // Returns the requested type unless it's not specified or not applicable, otherwise return the default type.
    // NOTE: We cannot reliably determine at this time if the UA supports a specific MIME type for the target format.
    // image/jpeg and image/png are the only safe choices at this time.
    _determineOutputType: function(spec) {
        "use strict";

        var requestedType = spec.requestedType,
            defaultType = spec.defaultType;

        if (!requestedType) {
            return defaultType;
        }

        // If requested type is recognized, use it, as long as this recognized type is supported by the current UA
        if (qq.indexOf(Object.keys(qq.Identify.prototype.PREVIEWABLE_MIME_TYPES), requestedType) >= 0) {
            if (requestedType === "image/tiff") {
                return qq.supportedFeatures.tiffPreviews ? requestedType : defaultType;
            }

            return requestedType;
        }

        return defaultType;
    },

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

    _generateScaledImage: function(spec, sourceFile) {
        "use strict";

        var self = this,
            log = spec.log,
            size = spec.size,
            orient = spec.orient,
            type = spec.type,
            quality = spec.quality,
            failedText = spec.failedText,
            scalingEffort = new qq.Promise(),
            imageGenerator = new qq.ImageGenerator(log),
            canvas = document.createElement("canvas");

        imageGenerator.generate(sourceFile, canvas, {maxSize: size, orient: orient}).then(function() {
            var dataUri = canvas.toDataURL(type, quality),
                blob = self._dataUriToBlob(dataUri);

            scalingEffort.success(blob);
        }, function() {
            scalingEffort.failure(failedText);
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
