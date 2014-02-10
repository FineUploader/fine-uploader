/* globals qq */
qq.Scaler = function(spec) {
    "use strict";

    var sendOriginal = spec.sendOriginal,
        orient = spec.orient,
        sizes = spec.sizes;

    // Revealed API for instances of this module
    qq.extend(this, {
        // If no targeted sizes have been declared or if this browser doesn't support
        // client-side image preview generation, there is no scaling to do.
        enabled: qq.supportedFeatures.imagePreviews && sizes.length > 0
    });
};
