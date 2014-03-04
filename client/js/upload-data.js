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
         * @param spec Data that describes this file.  Possible properties are:
         *
         * - uuid: Initial UUID for this file.
         * - name: Initial name of this file.
         * - size: Size of this file, omit if this cannot be determined
         * - status: Initial `qq.status` for this file.  Omit for `qq.status.SUBMITTING`.
         * - batchId: ID of the batch this file belongs to
         * - proxyGroupId: ID of the proxy group associated with this file
         *
         * @returns {number} Internal ID for this file.
         */
        addFile: function(spec) {
            var status = spec.status || qq.status.SUBMITTING;

            var id = data.push({
                name: spec.name,
                originalName: spec.name,
                uuid: spec.uuid,
                size: spec.size || -1,
                status: status
            }) - 1;

            if (spec.batchId) {
                data[id].batchId = spec.batchId;

                if (byBatchId[spec.batchId] === undefined) {
                    byBatchId[spec.batchId] = [];
                }
                byBatchId[spec.batchId].push(id);
            }

            if (spec.proxyGroupId) {
                data[id].proxyGroupId = spec.proxyGroupId;

                if (byProxyGroupId[spec.proxyGroupId] === undefined) {
                    byProxyGroupId[spec.proxyGroupId] = [];
                }
                byProxyGroupId[spec.proxyGroupId].push(id);
            }

            data[id].id = id;
            byUuid[spec.uuid] = id;

            if (byStatus[status] === undefined) {
                byStatus[status] = [];
            }
            byStatus[status].push(id);

            uploaderProxy.onStatusChange(id, null, status);

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
