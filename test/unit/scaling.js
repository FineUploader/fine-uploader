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

    it("creates properly ordered and constructed file records on demand", function() {
        var sizes = [
                {
                    name: "small",
                    max: 100
                },
                {
                    name: "large",
                    max: 300
                },
                {
                    name: "medium",
                    max: 200
                }
            ],
            originalFile = {dummy: "blob"},
            scaler = new qq.Scaler(({sizes: sizes})),
            records = scaler.getFileRecords("originalUuid", "originalName.jpeg", originalFile);

        assert.equal(records.length, 4);

        assert.equal(records[0].name, "originalName (small).jpeg");
        assert.notEqual(records[0].uuid, "originalUuid");
        assert.ok(records[0].blob instanceof qq.BlobProxy);

        assert.equal(records[1].name, "originalName (medium).jpeg");
        assert.notEqual(records[1].uuid, "originalUuid");
        assert.ok(records[1].blob instanceof qq.BlobProxy);

        assert.equal(records[2].name, "originalName (large).jpeg");
        assert.notEqual(records[2].uuid, "originalUuid");
        assert.ok(records[2].blob instanceof qq.BlobProxy);

        assert.equal(records[3].name, "originalName.jpeg");
        assert.equal(records[3].uuid, "originalUuid");
        assert.equal(records[3].blob, originalFile);
    });

    it("handles extensionless filenames correctly", function() {
        var sizes = [
                {
                    name: "small",
                    max: 100
                }
            ],
            scaler = new qq.Scaler(({sizes: sizes})),
            records = scaler.getFileRecords("originalUuid", "originalName", {});

        assert.equal(records[0].name, "originalName (small)");
    });
});
