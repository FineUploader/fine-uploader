/* globals describe, it, qq, assert, qqtest */
if (qq.supportedFeatures.imagePreviews) {
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

        it("generates a properly scaled image for a reference image", function(done) {
            assert.expect(3, done);

            var scalerContext = qq.extend({}, qq.Scaler.prototype),
                scale = qq.bind(qq.Scaler.prototype._generateScaledImage, scalerContext);

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                scale(50, function(){}, blob).then(function(scaledBlob) {
                    var URL = window.URL && window.URL.createObjectURL ? window.URL :
                              window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL :
                              null,
                        img = document.createElement("img");


                    assert.ok(qq.isBlob(scaledBlob));

                    img.onload = function() {
                        assert.ok(this.width <= 50);
                        assert.ok(this.height <= 50);
                    };

                    img.onerror = function() {
                        assert.fail(null, null, "Image failed to render!");
                    };

                    img.src = URL.createObjectURL(scaledBlob);
                });
            });
        });
    });
}
