/* globals qq */
/**
 * Placeholder for a Blob that will be generated on-demand.
 *
 * @param referenceBlob Parent of the generated blob
 * @param onCreate Function to invoke when the blob must be created.  Must be promissory.
 * @constructor
 */
qq.BlobProxy = function(referenceBlob, onCreate) {
    "use strict";

    qq.extend(this, {
        referenceBlob: referenceBlob,

        create: function() {
            return onCreate(referenceBlob);
        }
    });
};
