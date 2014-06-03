/*globals qq */
/**
 * Upload handler used by the upload to Azure module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to Azure Blob Storage containers via the
 * associated Azure API.
 *
 * @param spec Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
// TODO l18n for error messages returned to UI
qq.azure.XhrUploadHandler = function(spec, proxy) {
    "use strict";

    var handler = this,
        log = proxy.log,
        cors = spec.cors,
        endpointStore = spec.endpointStore,
        paramsStore = spec.paramsStore,
        signature = spec.signature,
        filenameParam = spec.filenameParam,
        minFileSizeForChunking = spec.chunking.minFileSize,
        deleteBlob = spec.deleteBlob,
        onGetBlobName = spec.onGetBlobName,
        getName = proxy.getName,
        getSize = proxy.getSize,

        getBlobMetadata = function(id) {
            var params = paramsStore.get(id);
            params[filenameParam] = getName(id);
            return params;
        },

        api = {
            putBlob: new qq.azure.PutBlob({
                getBlobMetadata: getBlobMetadata,
                log: log
            }),

            putBlock: new qq.azure.PutBlock({
                log: log
            }),

            putBlockList: new qq.azure.PutBlockList({
                getBlobMetadata: getBlobMetadata,
                log: log
            }),

            getSasForPutBlobOrBlock: new qq.azure.GetSas({
                cors: cors,
                customHeaders: signature.customHeaders,
                endpointStore: {
                    get: function() {
                        return signature.endpoint;
                    }
                },
                log: log,
                restRequestVerb: "PUT"
            })
        };


    function combineChunks(id) {
        var promise = new qq.Promise();

        getSignedUrl(id).then(function(sasUri) {
            var mimeType = handler._getMimeType(id),
                blockIdEntries = handler._getPersistableData(id).blockIdEntries;

            api.putBlockList.send(id, sasUri, blockIdEntries, mimeType, function(xhr) {
                handler._registerXhr(id, null, xhr, api.putBlockList);
            })
                .then(function(xhr) {
                    log("Success combining chunks for id " + id);
                    promise.success({}, xhr);
                }, function(xhr) {
                    log("Attempt to combine chunks failed for id " + id, "error");
                    handleFailure(xhr, promise);
                });

        },
        promise.failure);

        return promise;
    }

    function determineBlobUrl(id) {
        var containerUrl = endpointStore.get(id),
            promise = new qq.Promise(),
            getBlobNameSuccess = function(blobName) {
                handler._setThirdPartyFileId(id, blobName);
                promise.success(containerUrl + "/" + blobName);
            },
            getBlobNameFailure = function(reason) {
                promise.failure(reason);
            };

        onGetBlobName(id).then(getBlobNameSuccess, getBlobNameFailure);

        return promise;
    }

    function getSignedUrl(id, opt_chunkIdx) {
        // We may have multiple SAS requests in progress for the same file, so we must include the chunk idx
        // as part of the ID when communicating with the SAS ajax requester to avoid collisions.
        var getSasId = opt_chunkIdx == null ? id : id + "." + opt_chunkIdx,

            promise = new qq.Promise(),
            getSasSuccess = function(sasUri) {
                log("GET SAS request succeeded.");
                promise.success(sasUri);
            },
            getSasFailure = function(reason, getSasXhr) {
                log("GET SAS request failed: " + reason, "error");
                promise.failure({error: "Problem communicating with local server"}, getSasXhr);
            },
            determineBlobUrlSuccess = function(blobUrl) {
                api.getSasForPutBlobOrBlock.request(getSasId, blobUrl).then(
                    getSasSuccess,
                    getSasFailure
                );
            },
            determineBlobUrlFailure = function(reason) {
                log(qq.format("Failed to determine blob name for ID {} - {}", id, reason), "error");
                promise.failure({error: reason});
            };

        determineBlobUrl(id).then(determineBlobUrlSuccess, determineBlobUrlFailure);

        return promise;
    }

    function handleFailure(xhr, promise) {
        var azureError = qq.azure.util.parseAzureError(xhr.responseText, log),
            errorMsg = "Problem sending file to Azure";

        promise.failure({error: errorMsg,
            azureError: azureError && azureError.message,
            reset: xhr.status === 403
        });
    }


    qq.extend(this, {
        uploadChunk: function(id, chunkIdx) {
            var promise = new qq.Promise();

            getSignedUrl(id, chunkIdx).then(
                function(sasUri) {
                    var xhr = handler._createXhr(id, chunkIdx),
                    chunkData = handler._getChunkData(id, chunkIdx);

                    handler._registerProgressHandler(id, chunkIdx, chunkData.size);
                    handler._registerXhr(id, chunkIdx, xhr, api.putBlock);

                    // We may have multiple put block requests in progress for the same file, so we must include the chunk idx
                    // as part of the ID when communicating with the put block ajax requester to avoid collisions.
                    api.putBlock.upload(id + "." + chunkIdx, xhr, sasUri, chunkIdx, chunkData.blob).then(
                        function(blockIdEntry) {
                            if (!handler._getPersistableData(id).blockIdEntries) {
                                handler._getPersistableData(id).blockIdEntries = [];
                            }

                            handler._getPersistableData(id).blockIdEntries.push(blockIdEntry);
                            log("Put Block call succeeded for " + id);
                            promise.success({}, xhr);
                        },
                        function() {
                            log(qq.format("Put Block call failed for ID {} on part {}", id, chunkIdx), "error");
                            handleFailure(xhr, promise);
                        }
                    );
                },
                promise.failure
            );

            return promise;
        },

        uploadFile: function(id) {
            var promise = new qq.Promise(),
                fileOrBlob = handler.getFile(id);

            getSignedUrl(id).then(function(sasUri) {
                var xhr = handler._createXhr(id);

                handler._registerProgressHandler(id);

                api.putBlob.upload(id, xhr, sasUri, fileOrBlob).then(
                    function() {
                        log("Put Blob call succeeded for " + id);
                        promise.success({}, xhr);
                    },
                    function() {
                        log("Put Blob call failed for " + id, "error");
                        handleFailure(xhr, promise);
                    }
                );
            },
            promise.failure);

            return promise;
        }
    });


    qq.extend(this, new qq.XhrUploadHandler({
            options: qq.extend({namespace: "azure"}, spec),
            proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
        }
    ));

    qq.override(this, function(super_) {
        return {
            expunge: function(id) {
                var relatedToCancel = handler._wasCanceled(id),
                    chunkingData = handler._getPersistableData(id),
                    blockIdEntries = (chunkingData && chunkingData.blockIdEntries) || [];

                if (relatedToCancel && blockIdEntries.length > 0) {
                    deleteBlob(id);
                }

                super_.expunge(id);
            },

            finalizeChunks: function(id) {
                return combineChunks(id);
            },

            _shouldChunkThisFile: function(id) {
                var maybePossible = super_._shouldChunkThisFile(id);
                return maybePossible && getSize(id) >= minFileSizeForChunking;
            }
        };
    });
};
