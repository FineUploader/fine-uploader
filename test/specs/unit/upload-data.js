var assert = chai.assert
  , expect = chai.expect;

describe('upload-data.js', function () {

    function createUploadData(onStatusChange) {
        return new qq.UploadData({
            getUuid: function(id) {
                return id + "_uuid";
            },

            getName: function(id) {
                return id + "_name";
            },

            getSize: function(id) {
                return 1980;
            },

            onStatusChange: function(id, oldStatus, newStatus) {
                if (onStatusChange !== undefined) {
                    onStatusChange(id, oldStatus, newStatus);
                }
            }
        });
    }

    var id, expectedOldStatus, expectedNewStatus, onStatusChange, uploadData;

    it("should make the correct callbacks", function () {
        id = 0
        expectedOldStatus = undefined,
        expectedNewStatus = qq.status.SUBMITTING,
        onStatusChange = function (relatedId, oldStatus, newStatus) { 
            assert.equal(relatedId, id);
            assert.equal(oldStatus, expectedOldStatus);
            assert.equal(newStatus, expectedNewStatus);
        },
        uploadData = createUploadData(onStatusChange);
        uploadData.added(id);
        expectedOldStatus = expectedNewStatus;
        expectedNewStatus = qq.status.UPLOAD_SUCCESSFUL;

        uploadData.setStatus(id, qq.status.UPLOAD_SUCCESSFUL);

        expectedOldStatus = expectedNewStatus;
        expectedNewStatus = qq.status.DELETED;
        uploadData.setStatus(id, qq.status.DELETED);
    });

    it("should work for overriden uuids", function () {
        var uploadData = createUploadData();
        uploadData.added(0);

        assert.equal(uploadData.retrieve({ id: 0 }).uuid, "0_uuid");

        uploadData.uuidChanged(0, "foobar");
        assert.equal(uploadData.retrieve({ id: 0 }).uuid, "foobar");
    });

    it("should properly reset", function () {
        var uploadData = createUploadData();

        uploadData.added(0);
        uploadData.reset();
        assert.equal(uploadData.retrieve().length, 0);
    });

    it("should properly retrive by id and ids", function () {
        var uploadData = createUploadData();

        uploadData.added(0);
        uploadData.added(0);
        var uploadDataItem = uploadData.retrieve({id: 0});
        assert.equal(uploadDataItem.id, 0);
        assert.equal(uploadDataItem.uuid, "0_uuid");
        assert.equal(uploadDataItem.name, "0_name");
        assert.equal(uploadDataItem.size, 1980);

        assert.equal(uploadData.retrieve({id: 1}), undefined);

        uploadData.added(2);
        var uploadDataItems = uploadData.retrieve({id: [0, 2]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[1].id, 2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "2_name");
    });

    it("should retrieve by status and statuses", function() {
        var uploadData = createUploadData();

        uploadData.added(0);
        var uploadDataItems = uploadData.retrieve({status: qq.status.SUBMITTING});

        uploadData.added(2);
        uploadData.setStatus(2, qq.status.CANCELED)

        assert.equal(uploadDataItems.length, 1);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[0].uuid, "0_uuid");
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[0].size, 1980);


        assert.equal(uploadData.retrieve({status: "foobar"}).length, 0);


        uploadDataItems = uploadData.retrieve({status: [qq.status.SUBMITTING, qq.status.CANCELED]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[1].id, 2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "2_name");
    });

    it("should retrieve without filter", function() {
        var uploadData = createUploadData();

        uploadData.added(0);
        uploadData.added(2);

        var uploadDataItems = uploadData.retrieve();
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[1].id, 2);
    });
    
});
