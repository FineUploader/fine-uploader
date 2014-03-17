/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
if (qqtest.canDownloadFileAsBlob) {
    describe("multi-chunked uploads", function() {
        "use strict";

        var fileTestHelper = helpme.setupFileTests(),
            testUploadEndpoint = "/test/upload",
            expectedFileSize = 3266,
            expectedChunks = 3,
            chunkSize = Math.round(expectedFileSize / expectedChunks),
            params = {
                foo: "bar",
                one: 2
            },
            overridenChunkingParamNames = {
                chunkSize: "testchunksize",
                partByteOffset: "testpartbyteoffset",
                partIndex: "testpartindex",
                totalParts: "testtotalparts"
            };

        it("TBD", function() {

        });
    });
}
