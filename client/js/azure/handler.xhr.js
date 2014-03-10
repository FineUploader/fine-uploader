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
qq.azure.UploadHandlerXhr = function(spec, proxy) {
    "use strict";

    var handler = this,
        log = proxy.log,
        cors = spec.cors,
        uploadCompleteCallback = proxy.onUploadComplete,
        endpointStore = spec.endpointStore,
        paramsStore = spec.paramsStore,
        signature = spec.signature,
        filenameParam = spec.filenameParam,
        minFileSizeForChunking = spec.chunking.minFileSize,
        chunkingPossible = spec.chunking.enabled && qq.supportedFeatures.chunking,
        deleteBlob = spec.deleteBlob,
        resumeEnabled = spec.resume.enabled && chunkingPossible && qq.supportedFeatures.resume && window.localStorage !== undefined,
        onGetBlobName = spec.onGetBlobName,
        onProgress = spec.onProgress,
        onComplete = spec.onComplete,
        onUpload = spec.onUpload,
        onUploadChunk = spec.onUploadChunk,
        onUploadChunkSuccess = spec.onUploadChunkSuccess,
        onUuidChanged = proxy.onUuidChanged,
        getBlobMetadata = function(id) {
            var params = paramsStore.get(id);
            params[filenameParam] = getName(id);
            return params;
        },
        notifyBaseOfUploadCompletion = function(id) {
            handler._getFileState(id) && delete handler._getFileState(id).xhr;
            uploadCompleteCallback(id);
        },
        onUploadComplete = function(id, xhr, errorMsg) {
            var azureError,
                paused = handler._getFileState(id).paused;

            if (errorMsg) {
                azureError = qq.azure.util.parseAzureError(xhr.responseText, log);
                if (xhr.status === 403 || !spec.onAutoRetry(id, getName(id), {error: errorMsg, azureError: azureError && azureError.message}, xhr)) {
                    if (xhr.status === 403) {
                        log("Server responded with 403 - will NOT auto-retry.", "error");
                    }

                    onComplete(id, getName(id), {success: false, error: errorMsg, azureError: azureError && azureError.message}, xhr);
                    notifyBaseOfUploadCompletion(id);
                }
            }
            else {
                handler._maybeDeletePersistedChunkData(id);

                if (paused) {
                    qq.log(qq.format("Detected pause on {} ({}).", id, getName(id)));
                }
                else {
                    onComplete(id, getName(id), {success: true}, xhr);
                    notifyBaseOfUploadCompletion(id);
                }
            }
        },
        getName = proxy.getName,
        getUuid = proxy.getUuid,
        getSize = proxy.getSize,
        getDataByUuid = proxy.getDataByUuid,
        progressHandler = function(id, loaded, total) {
            if (handler._shouldChunkThisFile(id)) {
                onProgress(id, getName(id), loaded + handler._getFileState(id).loaded, getSize(id));
            }
            else {
                handler._getFileState(id).loaded = loaded;
                onProgress(id, getName(id), loaded, total);
            }
        },
        putBlob = new qq.azure.PutBlob({
            getBlobMetadata: getBlobMetadata,
            onProgress: progressHandler,
            onUpload: function(id) {
                onUpload(id, getName(id));
            },
            onComplete: function(id, xhr, isError) {
                if (isError) {
                    log("Put Blob call failed for " + id, "error");
                }
                else {
                    log("Put Blob call succeeded for " + id);
                }

                onUploadComplete.call(this, id, xhr, isError ? "Problem sending file to Azure" : null);
            },
            log: log
        }),
        putBlock = new qq.azure.PutBlock({
            onProgress: progressHandler,
            onUpload: function(id) {
                var partIdx = getNextPartIdxToSend(id),
                    chunkData = handler._getChunkData(id, partIdx);

                onUploadChunk(id, getName(id), handler._getChunkDataForCallback(chunkData));
            },
            onComplete: function(id, xhr, isError, blockId) {
                var partIdx = getNextPartIdxToSend(id),
                    chunkData = handler._getChunkData(id, partIdx),
                    chunkDataForCallback = handler._getChunkDataForCallback(chunkData);

                if (isError) {
                    log("Put Block call failed for " + id, "error");
                    onUploadComplete.call(this, id, xhr, "Problem uploading block");
                }
                else {
                    handler._getFileState(id).chunking.blockIds.push(blockId);
                    log("Put Block call succeeded for " + id);
                    handler._getFileState(id).chunking.lastSent = partIdx;

                    // Update the bytes loaded counter to reflect all bytes successfully transferred in the associated chunked request
                    handler._getFileState(id).loaded += chunkData.size;

                    handler._maybePersistChunkedState(id);
                    onUploadChunkSuccess(id, chunkDataForCallback, {}, xhr);

                    maybeUploadNextChunk(id);
                }
            },
            log: log
        }),
        putBlockList = new qq.azure.PutBlockList({
            getBlobMetadata: getBlobMetadata,
            onComplete: function(id, xhr, isError) {
                if (isError) {
                    log("Attempt to combine chunks failed for id " + id, "error");
                    onUploadComplete.call(this, id, xhr, "Problem combining file pieces");
                }
                else {
                    log("Success combining chunks for id " + id);
                    onUploadComplete.call(this, id, xhr);
                }
            },
            log: log
        }),
        getSasForPutBlobOrBlock = new qq.azure.GetSas({
            cors: cors,
            endpointStore: {
                get: function() {
                    return signature.endpoint;
                }
            },
            customHeaders: signature.customHeaders,
            restRequestVerb: putBlob.method,
            log: log
        });

    function determineBlobUrl(id) {
        var containerUrl = endpointStore.get(id),
            promise = new qq.Promise(),
            getBlobNameSuccess = function(blobName) {
                handler._getFileState(id).key = blobName;
                promise.success(containerUrl + "/" + blobName);
            },
            getBlobNameFailure = function(reason) {
                promise.failure(reason);
            };

        onGetBlobName(id).then(getBlobNameSuccess, getBlobNameFailure);

        return promise;
    }

    function handleStartUploadSignal(id) {
        if (handler._shouldChunkThisFile(id)) {
            // We might be retrying a failed in-progress upload, so it's important that we
            // don't reset this value so we don't wipe out the record of all successfully
            // uploaded chunks for this file.
            if (handler._getFileState(id).loaded === undefined) {
                handler._getFileState(id).loaded = 0;
                handler._getFileState(id).chunking.blockIds = [];
            }

            onUpload(id, getName(id));
            maybeUploadNextChunk(id);
        }
        else {
            handleSimpleUpload(id);
        }
    }

    function getSignedUrl(id, onSuccess) {
        var getSasSuccess = function(sasUri) {
                log("GET SAS request succeeded.");
                onSuccess(sasUri);
            },
            getSasFailure = function(reason, getSasXhr) {
                log("GET SAS request failed: " + reason, "error");
                onUploadComplete(id, getSasXhr, "Problem communicating with local server");
            },
            determineBlobUrlSuccess = function(blobUrl) {
                getSasForPutBlobOrBlock.request(id, blobUrl).then(
                    getSasSuccess,
                    getSasFailure
                );
            },
            determineBlobUrlFailure = function(reason) {
                log(qq.format("Failed to determine blob name for ID {} - {}", id, reason), "error");
                onUploadComplete(id, null, "Problem determining name of file to upload");
            };

        determineBlobUrl(id).then(determineBlobUrlSuccess, determineBlobUrlFailure);
    }

    function handleSimpleUpload(id) {
        var fileOrBlob = handler.getFile(id);

        getSignedUrl(id, function(sasUri) {
            var xhr = putBlob.upload(id, sasUri, fileOrBlob);
            handler._registerXhr(id, xhr, putBlob);
        });
    }

    /**
     * Retrieves the 0-based index of the next chunk to send.  Note that AWS uses 1-based indexing.
     *
     * @param id File ID
     * @returns {number} The 0-based index of the next file chunk to be sent to S3
     */
    function getNextPartIdxToSend(id) {
        return handler._getFileState(id).chunking.lastSent >= 0 ? handler._getFileState(id).chunking.lastSent + 1 : 0;
    }

    function maybeUploadNextChunk(id) {
        var totalParts = handler._getFileState(id).chunking.parts,
            nextPartIdx = getNextPartIdxToSend(id);

        if (handler.isValid(id) && nextPartIdx < totalParts) {
            uploadNextChunk(id, nextPartIdx);
        }
        else {
            combineChunks(id);
        }
    }

    function uploadNextChunk(id, partIdx) {
        getSignedUrl(id, function(sasUri) {
            var chunkData = handler._getChunkData(id, partIdx),
                xhr = putBlock.upload(id, sasUri, partIdx, chunkData.blob);

            handler._registerXhr(id, xhr, putBlock);
        });
    }

    function combineChunks(id) {
        getSignedUrl(id, function(sasUri) {
            var mimeType = handler._getMimeType(id),
                blockIds = handler._getFileState(id).chunking.blockIds,
                xhr = putBlockList.send(id, sasUri, blockIds, mimeType);

            handler._registerXhr(id, xhr, putBlockList);
        });
    }

    qq.extend(this, new qq.AbstractNonTraditionalUploadHandlerXhr({
            options: {
                namespace: "azure",
                chunking: chunkingPossible ? spec.chunking : null,
                resumeEnabled: resumeEnabled
            },

            proxy: {
                onUpload: handleStartUploadSignal,
                onCancel: spec.onCancel,
                onUuidChanged: onUuidChanged,
                getName: getName,
                getSize: getSize,
                getUuid: getUuid,
                getEndpoint: endpointStore.get,
                getDataByUuid: getDataByUuid,
                log: log
            }
        }
    ));

    qq.override(this, function(super_) {
        return {
            expunge: function(id) {
                var relatedToCancel = handler._getFileState(id).canceled,
                    chunkingData = handler._getFileState(id).chunking,
                    blockIds = (chunkingData && chunkingData.blockIds) || [];

                if (relatedToCancel && blockIds.length > 0) {
                    deleteBlob(id);
                }

                handler._maybeDeletePersistedChunkData(id);
                super_.expunge(id);
            },

            _shouldChunkThisFile: function(id) {
                if (chunkingPossible && getSize(id) >= minFileSizeForChunking) {
                    return super_._shouldChunkThisFile(id);
                }
                return false;
            }
        };
    });
};
