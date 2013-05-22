//TODO all registration of callbacks on status changes
qq.UploadData = function(uploaderProxy) {
    var data = [],
        byId = {},
        byUuid = {},
        byStatus = {},
        api;

    function getDataById(id) {
        return data[byId[id]];
    }

    function getDataByUuid(uuid) {
        return data[byUuid[uuid]];
    }

    function getDataByStatus(status) {
        var statusResultIndexes = byStatus[status],
            statusResults = [];

        if (statusResultIndexes !== undefined) {
            qq.each(statusResultIndexes, function(i, dataIndex) {
                statusResults.push(data[dataIndex]);
            });
        }

        return statusResults;
    }

    function addIfUnique(array, dataItemCandidate) {
        if (dataItemCandidate) {
            var dataItemCandidates = [].concat(dataItemCandidate)

            qq.each(array, function(idx, dataItem) {
                var dataItemCandidatesCopy = qq.extend([], dataItemCandidates, true);

                qq.each(dataItemCandidatesCopy, function(candidateIndex, candidate) {
                    if (dataItem.id === candidate.id) {
                        dataItemCandidates.splice(candidateIndex, 1);
                    }
                });
            });

            qq.each(dataItemCandidates, function(idx, candidate) {
                array.push(candidate);
            });
        }
    }

    api = {
        added: function(id) {
            var uuid = uploaderProxy.getUuid(id),
                name = uploaderProxy.getName(id),
                status = qq.status.SUBMITTING;

            var index = data.push({
                id: id,
                name: name,
                uuid: uuid,
                status: status
            }) - 1;

            byId[id] = index;

            byUuid[uuid] = index;

            if (byStatus[status] === undefined) {
                byStatus[status] = [];
            }
            byStatus[status].push(index);
        },

        retrieve: function(optionalFilter) {
            var filteredResults = [],
                result;

            if (qq.isObject(optionalFilter) && data.length)  {
                if (optionalFilter.id !== undefined) {
                    result = getDataById(optionalFilter.id);
                    addIfUnique(filteredResults, result);
                }

                if (optionalFilter.uuid !== undefined) {
                    result = getDataByUuid(optionalFilter.uuid);
                    addIfUnique(filteredResults, result);
                }

                if (optionalFilter.status) {
                    addIfUnique(filteredResults, getDataByStatus(optionalFilter.status));
                }
            }
            else {
                filteredResults = qq.extend([], data, true);
            }

            return filteredResults;
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

            data[id].status = newStatus;

            if (byStatus[newStatus] === undefined) {
                byStatus[newStatus] = [];
            }
            byStatus[newStatus].push(dataIndex);
        },

        uuidChanged: function(id, newUuid) {
            var dataIndex = byId[id],
                oldUuid = data[dataIndex].uuid;

            dataIndex[dataIndex].uuid = newUuid;
            byUuid[newUuid] = dataIndex;
            delete byUuid[oldUuid];
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