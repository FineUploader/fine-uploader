qq.UploadData = function(uploaderProxy) {
    var data = [],
        api;

    //TODO support for status callbacks
    api = {
        added: function(id) {
            data.push({
                id: id,
                name: uploaderProxy.getName(id),
                uuid: uploaderProxy.getUuid(id),
                status: qq.status.SUBMITTING
            });
        },

        //TODO quicker lookups and support for multiple IDs, UUIDs, and status values.  Also, make this code less horrendous.
        retrieve: function(optionalFilter) {
            var results = qq.extend([], data, true),
                filteredResults,
                result;

            if (qq.isObject(optionalFilter))  {
                if (optionalFilter.id !== undefined) {
                    result = results[optionalFilter.id];
                    filteredResults = []
                    filteredResults.push(result);
                }

                if (optionalFilter.uuid !== undefined && results.length) {
                    if (filteredResults === undefined) {
                        filteredResults = [];

                        qq.each(results, function(idx, dataItem) {
                            if (dataItem.uuid === optionalFilter.uuid) {
                                result = dataItem;
                                return false;
                            }
                        });

                        if (result) {
                            filteredResults.push(result);
                        }
                    }
                    else if (filteredResults[0].uuid !== optionalFilter.uuid) {
                        filteredResults = [];
                    }
                }

                if (optionalFilter.status && results.length) {
                    if (filteredResults === undefined) {
                        filteredResults = [];

                        qq.each(results, function(index, dataItem) {
                            if (dataItem.status === optionalFilter.status) {
                                filteredResults.push(dataItem);
                            }
                        });
                    }
                    else if (filteredResults[0].status !== optionalFilter.status) {
                        filteredResults = [];
                    }
                }

                results = filteredResults || [];
            }

            return results;
        },

        reset: function() {
            data = [];
        },

        setStatus: function(id, newStatus) {
            data[id].status = newStatus;
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