/*globals qq */
qq.UploadData = function(uploaderProxy) {
    "use strict";

    var data = [],
        byUuid = {},
        byStatus = {},
        byProxyGroupId = {},
        byBatchId = {};


    function getDataByIds(idOrIds) {
        if (qq.isArray(idOrIds)) {
            var entries = [];

            qq.each(idOrIds, function(idx, id) {
                entries.push(data[id]);
            });

            return entries;
        }

        return data[idOrIds];
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

    qq.extend(this, {
        /**
         * Adds a new file to the data cache for tracking purposes.
         *
         * @param uuid Initial UUID for this file.
         * @param name Initial name of this file.
         * @param size Size of this file, -1 if this cannot be determined
         * @param opt_status Initial `qq.status` for this file.  If null/undefined, `qq.status.SUBMITTING`.
         * @param opt_batchId ID of the batch this file belongs to
         * @param opt_proxyGroupId ID of the proxy group associated with this file
         * @returns {number} Internal ID for this file.
         */
        addFile: function(uuid, name, size, opt_batchId, opt_proxyGroupId, opt_status) {
            opt_status = opt_status || qq.status.SUBMITTING;

            var id = data.push({
                name: name,
                originalName: name,
                uuid: uuid,
                size: size,
                status: opt_status
            }) - 1;

            if (opt_batchId) {
                data[id].batchId = opt_batchId;

                if (byBatchId[opt_batchId] === undefined) {
                    byBatchId[opt_batchId] = [];
                }
                byBatchId[opt_batchId].push(id);
            }

            if (opt_proxyGroupId) {
                data[id].proxyGroupId = opt_proxyGroupId;

                if (byProxyGroupId[opt_proxyGroupId] === undefined) {
                    byProxyGroupId[opt_proxyGroupId] = [];
                }
                byProxyGroupId[opt_proxyGroupId].push(id);
            }

            data[id].id = id;
            byUuid[uuid] = id;

            if (byStatus[opt_status] === undefined) {
                byStatus[opt_status] = [];
            }
            byStatus[opt_status].push(id);

            uploaderProxy.onStatusChange(id, null, opt_status);

            return id;
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
            byUuid = {};
            byStatus = {};
            byBatchId = {};
        },

        setStatus: function(id, newStatus) {
            var oldStatus = data[id].status,
                byStatusOldStatusIndex = qq.indexOf(byStatus[oldStatus], id);

            byStatus[oldStatus].splice(byStatusOldStatusIndex, 1);

            data[id].status = newStatus;

            if (byStatus[newStatus] === undefined) {
                byStatus[newStatus] = [];
            }
            byStatus[newStatus].push(id);

            uploaderProxy.onStatusChange(id, oldStatus, newStatus);
        },

        uuidChanged: function(id, newUuid) {
            var oldUuid = data[id].uuid;

            data[id].uuid = newUuid;
            byUuid[newUuid] = id;
            delete byUuid[oldUuid];
        },

        updateName: function(id, newName) {
            data[id].name = newName;
        },

        updateSize: function(id, newSize) {
            data[id].size = newSize;
        },

        // Only applicable if this file has a parent that we may want to reference later.
        setParentId: function(targetId, parentId) {
            data[targetId].parentId = parentId;
        },

        getIdsInProxyGroup: function(id) {
            var proxyGroupId = data[id].proxyGroupId;

            if (proxyGroupId) {
                return byProxyGroupId[proxyGroupId];
            }
            return [];
        },

        getIdsInBatch: function(id) {
            var batchId = data[id].batchId;

            return byBatchId[batchId];
        }
    });
};

qq.status = {
    SUBMITTING: "submitting",
    SUBMITTED: "submitted",
    REJECTED: "rejected",
    QUEUED: "queued",
    CANCELED: "canceled",
    PAUSED: "paused",
    UPLOADING: "uploading",
    UPLOAD_RETRYING: "retrying upload",
    UPLOAD_SUCCESSFUL: "upload successful",
    UPLOAD_FAILED: "upload failed",
    DELETE_FAILED: "delete failed",
    DELETING: "deleting",
    DELETED: "deleted"
};
