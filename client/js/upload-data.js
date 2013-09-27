qq.UploadData = function(uploaderProxy) {
    var data = [],
        byId = {},
        byUuid = {},
        byStatus = {},
        api;

    function getDataByIds(ids) {
        if (qq.isArray(ids)) {
            var entries = [];

            qq.each(ids, function(idx, id) {
                entries.push(data[byId[id]]);
            });

            return entries;
        }

        return data[byId[ids]];
    }

    function getDataByUuids(uuids) {
        if (qq.isArray(uuids)) {
            var entries = [];

            qq.each(uuids, function(idx, uuid) {
                entries.push(data[byUuid[uuid]]);
            });

            return entries;
        }

        return data[byUuid[uuids]];
    }

    function getDataByStatus(status) {
        var statusResults = [],
            statuses = [].concat(status);

        qq.each(statuses, function(index, statusEnum) {
            var statusResultIndexes = byStatus[statusEnum];

            if (statusResultIndexes !== undefined) {
                qq.each(statusResultIndexes, function(i, dataIndex) {
                    statusResults.push(data[dataIndex]);
                });
            }
        });

        return statusResults;
    }

    api = {
        added: function(id) {
            var uuid = uploaderProxy.getUuid(id),
                name = uploaderProxy.getName(id),
                size = uploaderProxy.getSize(id),
                status = qq.status.SUBMITTING;

            var index = data.push({
                id: id,
                name: name,
                originalName: name,
                uuid: uuid,
                size: size,
                status: status
            }) - 1;

            byId[id] = index;

            byUuid[uuid] = index;

            if (byStatus[status] === undefined) {
                byStatus[status] = [];
            }
            byStatus[status].push(index);

            uploaderProxy.onStatusChange(id, undefined, status);
        },

        retrieve: function(optionalFilter) {
            if (qq.isObject(optionalFilter) && data.length)  {
                if (optionalFilter.id !== undefined) {
                    return getDataByIds(optionalFilter.id);
                }

                else if (optionalFilter.uuid !== undefined) {
                    return getDataByUuids(optionalFilter.uuid);
                }

                else if (optionalFilter.status) {
                    return getDataByStatus(optionalFilter.status);
                }
            }
            else {
                return qq.extend([], data, true);
            }
        },

        reset: function() {
            data = [];
            byId = {};
            byUuid = {};
            byStatus = {};
        },

        setStatus: function(id, newStatus) {
            var dataIndex = byId[id],
                oldStatus = data[dataIndex].status,
                byStatusOldStatusIndex = qq.indexOf(byStatus[oldStatus], dataIndex);

            byStatus[oldStatus].splice(byStatusOldStatusIndex, 1);

            data[dataIndex].status = newStatus;

            if (byStatus[newStatus] === undefined) {
                byStatus[newStatus] = [];
            }
            byStatus[newStatus].push(dataIndex);

            uploaderProxy.onStatusChange(id, oldStatus, newStatus);
        },

        uuidChanged: function(id, newUuid) {
            var dataIndex = byId[id],
                oldUuid = data[dataIndex].uuid;

            data[dataIndex].uuid = newUuid;
            byUuid[newUuid] = dataIndex;
            delete byUuid[oldUuid];
        },

        nameChanged: function(id, newName) {
            var dataIndex = byId[id];

            data[dataIndex].name = newName;
        }
    };

    return api;
};

qq.status = {
    SUBMITTING: "submitting",
    SUBMITTED: "submitted",
    REJECTED: "rejected",
    QUEUED: "queued",
    CANCELED: "canceled",
    UPLOADING: "uploading",
    UPLOAD_RETRYING: "retrying upload",
    UPLOAD_SUCCESSFUL: "upload successful",
    UPLOAD_FAILED: "upload failed",
    DELETE_FAILED: "delete failed",
    DELETING: "deleting",
    DELETED: "deleted"
};
