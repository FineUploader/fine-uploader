module("upload data module");

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

test("test callbacks", 9, function() {
    var id = 0,
        expectedOldStatus = undefined,
        expectedNewStatus = qq.status.SUBMITTING,
        onStatusChange = function(relatedId, oldStatus, newStatus) {
            equal(relatedId, id, "make sure status change is for correct item");
            equal(oldStatus, expectedOldStatus, "make sure old status is as expected");
            equal(newStatus, expectedNewStatus, "make sure new status is as expected");
        },
        uploadData = createUploadData(onStatusChange);

    uploadData.added(id);


    expectedOldStatus = expectedNewStatus;
    expectedNewStatus = qq.status.UPLOAD_SUCCESSFUL;

    uploadData.setStatus(id, qq.status.UPLOAD_SUCCESSFUL)


    expectedOldStatus = expectedNewStatus;
    expectedNewStatus = qq.status.DELETED;

    uploadData.setStatus(id, qq.status.DELETED)
});

test("test overriden uuid", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    equal(uploadData.retrieve({id: 0}).uuid, "0_uuid", "checking initial uuid");

    uploadData.uuidChanged(0, "foobar");
    equal(uploadData.retrieve({id: 0}).uuid, "foobar", "checking new uuid");
});

test("test reset", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    uploadData.reset();
    equal(uploadData.retrieve().length, 0, "ensuring upload data has been cleared");
});

test("test retrieve by id and ids", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    var uploadDataItem = uploadData.retrieve({id: 0});
    equal(uploadDataItem.id, 0);
    equal(uploadDataItem.uuid, "0_uuid");
    equal(uploadDataItem.name, "0_name");
    equal(uploadDataItem.size, 1980);

    equal(uploadData.retrieve({id: 1}), undefined);

    uploadData.added(2);
    var uploadDataItems = uploadData.retrieve({id: [0, 2]});
    equal(uploadDataItems.length, 2);
    equal(uploadDataItems[0].id, 0);
    equal(uploadDataItems[1].id, 2);
    equal(uploadDataItems[0].name, "0_name");
    equal(uploadDataItems[1].name, "2_name");
});

test("test retrieve by uuid and uuids", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    var uploadDataItem = uploadData.retrieve({uuid: "0_uuid"});
    equal(uploadDataItem.id, 0);
    equal(uploadDataItem.uuid, "0_uuid");
    equal(uploadDataItem.name, "0_name");
    equal(uploadDataItem.size, 1980);

    equal(uploadData.retrieve({uuid: "foobar"}), undefined);

    uploadData.added(2);
    var uploadDataItems = uploadData.retrieve({uuid: ["0_uuid", "2_uuid"]});
    equal(uploadDataItems.length, 2);
    equal(uploadDataItems[0].id, 0);
    equal(uploadDataItems[1].id, 2);
    equal(uploadDataItems[0].name, "0_name");
    equal(uploadDataItems[1].name, "2_name");
});

test("test retrieve by status and statuses", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    var uploadDataItems = uploadData.retrieve({status: qq.status.SUBMITTING});

    uploadData.added(2);
    uploadData.setStatus(2, qq.status.CANCELED)

    equal(uploadDataItems.length, 1);
    equal(uploadDataItems[0].id, 0);
    equal(uploadDataItems[0].uuid, "0_uuid");
    equal(uploadDataItems[0].name, "0_name");
    equal(uploadDataItems[0].size, 1980);


    equal(uploadData.retrieve({status: "foobar"}).length, 0);


    uploadDataItems = uploadData.retrieve({status: [qq.status.SUBMITTING, qq.status.CANCELED]});
    equal(uploadDataItems.length, 2);
    equal(uploadDataItems[0].id, 0);
    equal(uploadDataItems[1].id, 2);
    equal(uploadDataItems[0].name, "0_name");
    equal(uploadDataItems[1].name, "2_name");
});
test("test retrieve without filter", function() {
    var uploadData = createUploadData();

    uploadData.added(0);
    uploadData.added(2);

    var uploadDataItems = uploadData.retrieve();
    equal(uploadDataItems.length, 2);
    equal(uploadDataItems[0].id, 0);
    equal(uploadDataItems[1].id, 2);
});