/* globals qq */
/**
 * Placeholder for a Blob that will be generated on-demand.
 *
 * @param originalFile Parent of the generated blob
 * @param onCreate Function to invoke when the blob must be created.  Must be promissory.
 * @constructor
 */
qq.BlobProxy = function(originalFile, onCreate) {
    "use strict";

    qq.extend(this, {
        create: function() {
            return onCreate(originalFile);
        }
    });
};
