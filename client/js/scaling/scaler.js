/* globals qq */
qq.Scaler = function(spec) {
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

        getFileRecords: function(originalFileUuid, originalFileName, originalBlob) {
            var records = [];

            // Create records for each scaled version & add them to the records array, smallest first.
            qq.each(sizes, function(idx, sizeRecord) {
                records.push({
                    uuid: qq.getUniqueId(),
                    name: self._getName(originalFileName, sizeRecord.name),
                    blob: new qq.BlobProxy()
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
    _getName: function(originalName, scaledModifier) {
        "use strict";

        var startOfExt = originalName.lastIndexOf("."),
            scaledName = "";

        scaledModifier = " (" + scaledModifier + ")";

        if (startOfExt >= 0) {
            scaledName = originalName.substr(0, startOfExt);
            scaledName += scaledModifier + "." + qq.getExtension(originalName);
        }
        else {
            scaledName = originalName + scaledModifier;
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
    }
});
