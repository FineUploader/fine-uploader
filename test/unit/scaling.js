/* globals describe, it, qq, assert */
describe("scaling module tests", function() {
    "use strict";

    it("is disabled if no sizes are specified", function() {
        var scaler = new qq.Scaler({sizes: []});

        assert.ok(!scaler.enabled);
    });

    it("is disabled if the current browsers doesn't support the File API", function() {
        var scaler = new qq.Scaler({sizes: [{max: 100}]}),
            supportsPreviews = qq.supportedFeatures.imagePreviews;

        assert.equal(scaler.enabled, supportsPreviews);
    });
});
