describe("exif.js", function () {

    describe("parseLittleEndian", function() {
        it("converts little endian hex string to big endian decimal", function () {
            var exif = new qq.Exif(),
                maybeBigEndian = exif._testing.parseLittleEndian("012345AB"),
                expectedBigEndian = parseInt("AB452301", 16);

            assert.equal(maybeBigEndian, expectedBigEndian);
        });
    });

});
