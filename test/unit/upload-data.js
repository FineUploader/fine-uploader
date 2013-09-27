describe("upload-data.js", function () {

    it.skip("has working callbacks", 9, function() {
       /* jshint -W080 */
        var id, expectedOldStatus, expectedNewStatus, onStatusChange;

        id = 0;
        expectedOldStatus = undefined;
        expectedNewStatus = qq.status.SUBMITTING;
        onStatusChange = function(relatedId, oldStatus, newStatus) {
            assert.equal(relatedId, id, "make sure status change is for correct item");
            assert.equal(oldStatus, expectedOldStatus, "make sure old status is as expected");
            assert.equal(newStatus, expectedNewStatus, "make sure new status is as expected");
        };

        var uploadData = helpme.createUploadData(onStatusChange);

        uploadData.added(id);

        expectedOldStatus = expectedNewStatus;
        expectedNewStatus = qq.status.UPLOAD_SUCCESSFUL;

        uploadData.setStatus(id, qq.status.UPLOAD_SUCCESSFUL)


        expectedOldStatus = expectedNewStatus;
        expectedNewStatus = qq.status.DELETED;

        uploadData.setStatus(id, qq.status.DELETED);
    });

    it("allows overriden uuids", function() {
        var uploadData = helpme.createUploadData();

        uploadData.added(0);
        assert.equal(uploadData.retrieve({id: 0}).uuid, "0_uuid", "checking initial uuid");

        uploadData.uuidChanged(0, "foobar");
        assert.equal(uploadData.retrieve({id: 0}).uuid, "foobar", "checking new uuid");
    });

    it("allows override name", function() {
        var uploadData = helpme.createUploadData();

        uploadData.added(0);
        assert.equal(uploadData.retrieve({id: 0}).name, "0_name", "checking initial name");

        uploadData.nameChanged(0, "foobar");
        assert.equal(uploadData.retrieve({id: 0}).name, "foobar", "checking new name");
        assert.equal(uploadData.retrieve({id: 0}).originalName, "0_name", "checking original name");
    });

    it("resets properly", function() {
        var uploadData = helpme.createUploadData();

        uploadData.added(0);
        uploadData.reset();
        assert.equal(uploadData.retrieve().length, 0, "ensuring upload data has been cleared");
    });

    it("retrieves by id and ids", function() {
        var uploadData = helpme.createUploadData();

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

    it("test retrieve by uuid and uuids", function() {
        var uploadData = helpme.createUploadData();

        uploadData.added(0);
        var uploadDataItem = uploadData.retrieve({uuid: "0_uuid"});
        assert.equal(uploadDataItem.id, 0);
        assert.equal(uploadDataItem.uuid, "0_uuid");
        assert.equal(uploadDataItem.name, "0_name");
        assert.equal(uploadDataItem.size, 1980);

        assert.equal(uploadData.retrieve({uuid: "foobar"}), undefined);

        uploadData.added(2);
        var uploadDataItems = uploadData.retrieve({uuid: ["0_uuid", "2_uuid"]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[1].id, 2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "2_name");
    });

    it("retrieves by status and statuses", function() {
        var uploadData = helpme.createUploadData();

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

    it("retrieves without filter", function() {
        var uploadData = helpme.createUploadData();

        uploadData.added(0);
        uploadData.added(2);

        var uploadDataItems = uploadData.retrieve();
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, 0);
        assert.equal(uploadDataItems[1].id, 2);
    });
});

