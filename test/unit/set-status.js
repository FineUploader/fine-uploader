/* globals describe, beforeEach, qq, qqtest, assert, helpme, it */

describe("set-status.js", function() {
    "use strict";

    var testUploadEndpoint = "/test/upload",
        fileTestHelper = helpme.setupFileTests();

    var initialFiles = [{
        name: "left.jpg",
        uuid: "e109af57-848b-4c2a-bca8-051374d01db1"
    }, {
        name: "right.jpg",
        uuid: "949d16c3-727a-4c3c-8c0f-23404dcd6f3b"
    }];

    it("testing status change of DELETED with initialFiles", function() {
        var uploader = new qq.FineUploaderBasic();
        uploader.addInitialFiles(initialFiles);

        var uploaderFiles = uploader.getUploads();
        var file = uploaderFiles[0];

        uploader.setStatus(file.id, qq.status.DELETED);

        uploaderFiles = uploader.getUploads();
        file = uploaderFiles[0];

        assert.equal(1, uploader.getNetUploads());
        assert.equal(qq.status.DELETED, file.status);

        // ensure same file can't be "deleted" twice
        uploader.setStatus(file.id, qq.status.DELETED);
        assert.equal(1, uploader.getNetUploads());
    });

    it("testing status change of DELETE_FAILED with initialFiles", function() {
        var uploader = new qq.FineUploaderBasic();
        uploader.addInitialFiles(initialFiles);

        var uploaderFiles = uploader.getUploads();
        var file = uploaderFiles[1];

        uploader.setStatus(file.id, qq.status.DELETE_FAILED);

        uploaderFiles = uploader.getUploads();
        file = uploaderFiles[1];

        assert.equal(2, uploader.getNetUploads());
        assert.equal(qq.status.DELETE_FAILED, file.status);
    });

    it("testing status change of DELETED with mock uploader", function(done) {
        var uploader = new qq.FineUploaderBasic({
            autoUpload: true,
            request: {
                endpoint: testUploadEndpoint
            }
        });

        qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
            fileTestHelper.mockXhr();

            uploader.addFiles({name: "test", blob: blob});
            uploader.uploadStoredFiles();
            fileTestHelper.getRequests()[0].respond(201, null, JSON.stringify({success: true}));

            var uploaderFiles = uploader.getUploads();
            var file = uploaderFiles[0];

            uploader.setStatus(file.id, qq.status.DELETED);

            uploaderFiles = uploader.getUploads();
            file = uploaderFiles[0];

            assert.equal(0, uploader.getNetUploads());
            assert.equal(qq.status.DELETED, file.status);
            done();
        });

    });

    it("testing status change of DELETED with mock uploader", function(done) {
        var uploader = new qq.FineUploaderBasic({
            autoUpload: true,
            request: {
                endpoint: testUploadEndpoint
            }
        });

        qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
            fileTestHelper.mockXhr();

            uploader.addFiles({name: "test", blob: blob});
            uploader.uploadStoredFiles();
            fileTestHelper.getRequests()[0].respond(201, null, JSON.stringify({success: true}));

            var uploaderFiles = uploader.getUploads();
            var file = uploaderFiles[0];

            uploader.setStatus(file.id, qq.status.DELETE_FAILED);

            uploaderFiles = uploader.getUploads();
            file = uploaderFiles[0];

            assert.equal(1, uploader.getNetUploads());
            assert.equal(qq.status.DELETE_FAILED, file.status);
            done();
        });

    });

});
