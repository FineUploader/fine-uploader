/*globals qq*/
/**
 * Base upload handler module.  Controls more specific handlers.
 *
 * @param o Options.  Passed along to the specific handler submodule as well.
 * @param namespace [optional] Namespace for the specific handler.
 */
qq.UploadHandlerController = function(o, namespace) {
    "use strict";

    var controller = this,
        chunkingPossible = false,
        concurrentChunkingPossible = false,
        chunking, preventRetryResponse, log, handler,

    options = {
        paramsStore: {},
        maxConnections: 3, // maximum number of concurrent uploads
        chunking: {
            enabled: false,
            multiple: {
                enabled: false
            }
        },
        log: function(str, level) {},
        onProgress: function(id, fileName, loaded, total) {},
        onComplete: function(id, fileName, response, xhr) {},
        onCancel: function(id, fileName) {},
        onUploadPrep: function(id) {}, // Called if non-trivial operations will be performed before onUpload
        onUpload: function(id, fileName) {},
        onUploadChunk: function(id, fileName, chunkData) {},
        onUploadChunkSuccess: function(id, chunkData, response, xhr) {},
        onProcessingChunkData: function(id, chunkData, processedDataCallback) {},
        onAutoRetry: function(id, fileName, response, xhr) {},
        onResume: function(id, fileName, chunkData) {},
        onUuidChanged: function(id, newUuid) {},
        getName: function(id) {},
        setSize: function(id, newSize) {},
        isQueued: function(id) {},
        getIdsInProxyGroup: function(id) {},
        getIdsInBatch: function(id) {}
    },

    chunked = {
        // Called when each chunk has uploaded successfully
        done: function(id, chunkIdx, response, xhr) {
            var chunkData = handler._getChunkData(id, chunkIdx);

            handler._getFileState(id).attemptingResume = false;

            delete handler._getFileState(id).temp.chunkProgress[chunkIdx];
            handler._getFileState(id).loaded += chunkData.size;

            options.onUploadChunkSuccess(id, handler._getChunkDataForCallback(chunkData), response, xhr);
        },

        // Called when all chunks have been successfully uploaded and we want to ask the handler to perform any
        // logic associated with closing out the file, such as combining the chunks.
        finalize: function(id) {
            var size = options.getSize(id),
                name = options.getName(id);

            log("All chunks have been uploaded for " + id + " - finalizing....");
            handler.finalizeChunks(id).then(
                function(response, xhr) {
                    log("Finalize successful for " + id);

                    var normaizedResponse = upload.normalizeResponse(response, true);

                    options.onProgress(id, name, size, size);
                    handler._maybeDeletePersistedChunkData(id);
                    upload.cleanup(id, normaizedResponse, xhr);
                },
                function(response, xhr) {
                    var normaizedResponse = upload.normalizeResponse(response, false);

                    log("Problem finalizing chunks for file ID " + id + " - " + normaizedResponse.error, "error");

                    if (normaizedResponse.reset) {
                        chunked.reset(id);
                    }

                    if (!options.onAutoRetry(id, name, normaizedResponse, xhr)) {
                        upload.cleanup(id, normaizedResponse, xhr);
                    }
                }
            );
        },

        hasMoreParts: function(id) {
            return !!handler._getFileState(id).chunking.remaining.length;
        },

        nextPart: function(id) {
            var nextIdx = handler._getFileState(id).chunking.remaining.shift();

            if (nextIdx >= handler._getTotalChunks(id)) {
                nextIdx = null;
            }

            return nextIdx;
        },

        reset: function(id) {
            log("Server or callback has ordered chunking effort to be restarted on next attempt for item ID " + id, "error");

            handler._maybeDeletePersistedChunkData(id);
            handler.reevaluateChunking(id);
            handler._getFileState(id).loaded = 0;
        },

        sendNext: function(id) {
            var size = options.getSize(id),
                name = options.getName(id),
                chunkIdx = chunked.nextPart(id),
                chunkData = handler._getChunkData(id, chunkIdx),
                resuming = handler._getFileState(id).attemptingResume,
                inProgressChunks = handler._getFileState(id).chunking.inProgress || [];

            var originalBlobSize = chunkData.blob.size;

            //This event was created in case someone needs to manipulate the content of the chunk.
            //It validates the chunk size afterwards so it doesn't cause any problems.
            //File integrity is the developer's responsability in case they want to manipulate the blob.
            //The usage of this event isn't recommended unless it's REALLY necessary and the developer knows what they are doing. 
            options.onProcessingChunkData(id, chunkData, function () {
                if (chunkData.blob.size !== originalBlobSize && chunkData.count < chunkData.part)
                    throw "The chunk size has changed.";

                //This will update the cached chunk in case it has changed.
                handler.updateCachedChunk(id, chunkIdx, chunkData.blob);

                if (handler._getFileState(id).loaded == null) {
                    handler._getFileState(id).loaded = 0;
                }

                // Don't follow-through with the resume attempt if the integrator returns false from onResume
                if (resuming && options.onResume(id, name, chunkData) === false) {
                    chunked.reset(id);
                    chunkIdx = chunked.nextPart(id);
                    chunkData = handler._getChunkData(id, chunkIdx);
                    resuming = false;
                }

                // If all chunks have already uploaded successfully, we must be re-attempting the finalize step.
                if (chunkIdx == null && inProgressChunks.length === 0) {
                    chunked.finalize(id);
                }

                // Send the next chunk
                else {
                    log("Sending chunked upload request for item " + id + ": bytes " + (chunkData.start + 1) + "-" + chunkData.end + " of " + size);
                    options.onUploadChunk(id, name, handler._getChunkDataForCallback(chunkData));

                    inProgressChunks.push(chunkIdx);
                    handler._getFileState(id).chunking.inProgress = inProgressChunks;

                    if (concurrentChunkingPossible) {
                        connectionManager.open(id, chunkIdx);
                    }

                    if (concurrentChunkingPossible && connectionManager.available() && handler._getFileState(id).chunking.remaining.length) {
                        chunked.sendNext(id);
                    }

                    handler.uploadChunk(id, chunkIdx, resuming).then(
                        // upload chunk success
                        function success(response, xhr) {
                            log("Chunked upload request succeeded for " + id + ", chunk " + chunkIdx);

                            handler.clearCachedChunk(id, chunkIdx);

                            var inProgressChunks = handler._getFileState(id).chunking.inProgress || [],
                                responseToReport = upload.normalizeResponse(response, true),
                                inProgressChunkIdx = qq.indexOf(inProgressChunks, chunkIdx);

                            log(qq.format("Chunk {} for file {} uploaded successfully.", chunkIdx, id));

                            chunked.done(id, chunkIdx, responseToReport, xhr);

                            if (inProgressChunkIdx >= 0) {
                                inProgressChunks.splice(inProgressChunkIdx, 1);
                            }

                            handler._maybePersistChunkedState(id);

                            if (!chunked.hasMoreParts(id) && inProgressChunks.length === 0) {
                                chunked.finalize(id);
                            }
                            else if (chunked.hasMoreParts(id)) {
                                chunked.sendNext(id);
                            }
                        },

                        // upload chunk failure
                        function failure(response, xhr) {
                            log("Chunked upload request failed for " + id + ", chunk " + chunkIdx);

                            handler.clearCachedChunk(id, chunkIdx);

                            var responseToReport = upload.normalizeResponse(response, false),
                                inProgressIdx;

                            if (responseToReport.reset) {
                                chunked.reset(id);
                            }
                            else {
                                inProgressIdx = qq.indexOf(handler._getFileState(id).chunking.inProgress, chunkIdx);
                                if (inProgressIdx >= 0) {
                                    handler._getFileState(id).chunking.inProgress.splice(inProgressIdx, 1);
                                    handler._getFileState(id).chunking.remaining.unshift(chunkIdx);
                                }
                            }

                            // We may have aborted all other in-progress chunks for this file due to a failure.
                            // If so, ignore the failures associated with those aborts.
                            if (!handler._getFileState(id).temp.ignoreFailure) {
                                // If this chunk has failed, we want to ignore all other failures of currently in-progress
                                // chunks since they will be explicitly aborted
                                if (concurrentChunkingPossible) {
                                    handler._getFileState(id).temp.ignoreFailure = true;

                                    qq.each(handler._getXhrs(id), function(ckid, ckXhr) {
                                        ckXhr.abort();
                                    });

                                    // We must indicate that all aborted chunks are no longer in progress
                                    handler.moveInProgressToRemaining(id);

                                    // Free up any connections used by these chunks, but don't allow any
                                    // other files to take up the connections (until we have exhausted all auto-retries)
                                    connectionManager.free(id, true);
                                }

                                if (!options.onAutoRetry(id, name, responseToReport, xhr)) {
                                    // If one chunk fails, abort all of the others to avoid odd race conditions that occur
                                    // if a chunk succeeds immediately after one fails before we have determined if the upload
                                    // is a failure or not.
                                    upload.cleanup(id, responseToReport, xhr);
                                }
                            }
                        }
                    )
                        .done(function() {
                            handler.clearXhr(id, chunkIdx);
                        }) ;
                }

            });
        }
    },

    connectionManager = {
        _open: [],
        _openChunks: {},
        _waiting: [],

        available: function() {
            var max = options.maxConnections,
                openChunkEntriesCount = 0,
                openChunksCount = 0;

            qq.each(connectionManager._openChunks, function(fileId, openChunkIndexes) {
                openChunkEntriesCount++;
                openChunksCount += openChunkIndexes.length;
            });

            return max - (connectionManager._open.length - openChunkEntriesCount + openChunksCount);
        },

        /**
         * Removes element from queue, starts upload of next
         */
        free: function(id, dontAllowNext) {
            var allowNext = !dontAllowNext,
                waitingIndex = qq.indexOf(connectionManager._waiting, id),
                connectionsIndex = qq.indexOf(connectionManager._open, id),
                nextId;

            delete connectionManager._openChunks[id];

            if (upload.getProxyOrBlob(id) instanceof qq.BlobProxy) {
                log("Generated blob upload has ended for " + id + ", disposing generated blob.");
                delete handler._getFileState(id).file;
            }

            // If this file was not consuming a connection, it was just waiting, so remove it from the waiting array
            if (waitingIndex >= 0) {
                connectionManager._waiting.splice(waitingIndex, 1);
            }
            // If this file was consuming a connection, allow the next file to be uploaded
            else if (allowNext && connectionsIndex >= 0) {
                connectionManager._open.splice(connectionsIndex, 1);

                nextId = connectionManager._waiting.shift();
                if (nextId >= 0) {
                    connectionManager._open.push(nextId);
                    upload.start(nextId);
                }
            }
        },

        getWaitingOrConnected: function() {
            var waitingOrConnected = [];

            // Chunked files may have multiple connections open per chunk (if concurrent chunking is enabled)
            // We need to grab the file ID of any file that has at least one chunk consuming a connection.
            qq.each(connectionManager._openChunks, function(fileId, chunks) {
                if (chunks && chunks.length) {
                    waitingOrConnected.push(parseInt(fileId));
                }
            });

            // For non-chunked files, only one connection will be consumed per file.
            // This is where we aggregate those file IDs.
            qq.each(connectionManager._open, function(idx, fileId) {
                if (!connectionManager._openChunks[fileId]) {
                    waitingOrConnected.push(parseInt(fileId));
                }
            });

            // There may be files waiting for a connection.
            waitingOrConnected = waitingOrConnected.concat(connectionManager._waiting);

            return waitingOrConnected;
        },

        isUsingConnection: function(id) {
            return qq.indexOf(connectionManager._open, id) >= 0;
        },

        open: function(id, chunkIdx) {
            if (chunkIdx == null) {
                connectionManager._waiting.push(id);
            }

            if (connectionManager.available()) {
                if (chunkIdx == null) {
                    connectionManager._waiting.pop();
                    connectionManager._open.push(id);
                }
                else {
                    (function() {
                        var openChunksEntry = connectionManager._openChunks[id] || [];
                        openChunksEntry.push(chunkIdx);
                        connectionManager._openChunks[id] = openChunksEntry;
                    }());
                }

                return true;
            }

            return false;
        },

        reset: function() {
            connectionManager._waiting = [];
            connectionManager._open = [];
        }
    },

    simple = {
        send: function(id, name) {
            handler._getFileState(id).loaded = 0;

            log("Sending simple upload request for " + id);
            handler.uploadFile(id).then(
                function(response, optXhr) {
                    log("Simple upload request succeeded for " + id);

                    var responseToReport = upload.normalizeResponse(response, true),
                        size = options.getSize(id);

                    options.onProgress(id, name, size, size);
                    upload.maybeNewUuid(id, responseToReport);
                    upload.cleanup(id, responseToReport, optXhr);
                },

                function(response, optXhr) {
                    log("Simple upload request failed for " + id);

                    var responseToReport = upload.normalizeResponse(response, false);

                    if (!options.onAutoRetry(id, name, responseToReport, optXhr)) {
                        upload.cleanup(id, responseToReport, optXhr);
                    }
                }
            );
        }
    },

    upload = {
        cancel: function(id) {
            log("Cancelling " + id);
            options.paramsStore.remove(id);
            connectionManager.free(id);
        },

        cleanup: function(id, response, optXhr) {
            var name = options.getName(id);

            options.onComplete(id, name, response, optXhr);

            if (handler._getFileState(id)) {
                handler._clearXhrs && handler._clearXhrs(id);
            }

            connectionManager.free(id);
        },

        // Returns a qq.BlobProxy, or an actual File/Blob if no proxy is involved, or undefined
        // if none of these are available for the ID
        getProxyOrBlob: function(id) {
            return (handler.getProxy && handler.getProxy(id)) ||
                (handler.getFile && handler.getFile(id));
        },

        initHandler: function() {
            var handlerType = namespace ? qq[namespace] : qq.traditional,
                handlerModuleSubtype = qq.supportedFeatures.ajaxUploading ? "Xhr" : "Form";

            handler = new handlerType[handlerModuleSubtype + "UploadHandler"](
                options,
                {
                    getDataByUuid: options.getDataByUuid,
                    getName: options.getName,
                    getSize: options.getSize,
                    getUuid: options.getUuid,
                    log: log,
                    onCancel: options.onCancel,
                    onProgress: options.onProgress,
                    onUuidChanged: options.onUuidChanged
                }
            );

            if (handler._removeExpiredChunkingRecords) {
                handler._removeExpiredChunkingRecords();
            }
        },

        isDeferredEligibleForUpload: function(id) {
            return options.isQueued(id);
        },

        // For Blobs that are part of a group of generated images, along with a reference image,
        // this will ensure the blobs in the group are uploaded in the order they were triggered,
        // even if some async processing must be completed on one or more Blobs first.
        maybeDefer: function(id, blob) {
            // If we don't have a file/blob yet & no file/blob exists for this item, request it,
            // and then submit the upload to the specific handler once the blob is available.
            // ASSUMPTION: This condition will only ever be true if XHR uploading is supported.
            if (blob && !handler.getFile(id) && blob instanceof qq.BlobProxy) {

                // Blob creation may take some time, so the caller may want to update the
                // UI to indicate that an operation is in progress, even before the actual
                // upload begins and an onUpload callback is invoked.
                options.onUploadPrep(id);

                log("Attempting to generate a blob on-demand for " + id);
                blob.create().then(function(generatedBlob) {
                    log("Generated an on-demand blob for " + id);

                    // Update record associated with this file by providing the generated Blob
                    handler.updateBlob(id, generatedBlob);

                    // Propagate the size for this generated Blob
                    options.setSize(id, generatedBlob.size);

                    // Order handler to recalculate chunking possibility, if applicable
                    handler.reevaluateChunking(id);

                    upload.maybeSendDeferredFiles(id);
                },

                // Blob could not be generated.  Fail the upload & attempt to prevent retries.  Also bubble error message.
                function(errorMessage) {
                    var errorResponse = {};

                    if (errorMessage) {
                        errorResponse.error = errorMessage;
                    }

                    log(qq.format("Failed to generate blob for ID {}.  Error message: {}.", id, errorMessage), "error");

                    options.onComplete(id, options.getName(id), qq.extend(errorResponse, preventRetryResponse), null);
                    upload.maybeSendDeferredFiles(id);
                    connectionManager.free(id);
                });
            }
            else {
                return upload.maybeSendDeferredFiles(id);
            }

            return false;
        },

        // Upload any grouped blobs, in the proper order, that are ready to be uploaded
        maybeSendDeferredFiles: function(id) {
            var idsInGroup = options.getIdsInProxyGroup(id),
                uploadedThisId = false;

            if (idsInGroup && idsInGroup.length) {
                log("Maybe ready to upload proxy group file " + id);

                qq.each(idsInGroup, function(idx, idInGroup) {
                    if (upload.isDeferredEligibleForUpload(idInGroup) && !!handler.getFile(idInGroup)) {
                        uploadedThisId = idInGroup === id;
                        upload.now(idInGroup);
                    }
                    else if (upload.isDeferredEligibleForUpload(idInGroup)) {
                        return false;
                    }
                });
            }
            else {
                uploadedThisId = true;
                upload.now(id);
            }

            return uploadedThisId;
        },

        maybeNewUuid: function(id, response) {
            if (response.newUuid !== undefined) {
                options.onUuidChanged(id, response.newUuid);
            }
        },

        // The response coming from handler implementations may be in various formats.
        // Instead of hoping a promise nested 5 levels deep will always return an object
        // as its first param, let's just normalize the response here.
        normalizeResponse: function(originalResponse, successful) {
            var response = originalResponse;

            // The passed "response" param may not be a response at all.
            // It could be a string, detailing the error, for example.
            if (!qq.isObject(originalResponse)) {
                response = {};

                if (qq.isString(originalResponse) && !successful) {
                    response.error = originalResponse;
                }
            }

            response.success = successful;

            return response;
        },

        now: function(id) {
            var name = options.getName(id);

            if (!controller.isValid(id)) {
                throw new qq.Error(id + " is not a valid file ID to upload!");
            }

            options.onUpload(id, name);

            if (chunkingPossible && handler._shouldChunkThisFile(id)) {
                chunked.sendNext(id);
            }
            else {
                simple.send(id, name);
            }
        },

        start: function(id) {
            var blobToUpload = upload.getProxyOrBlob(id);

            if (blobToUpload) {
                return upload.maybeDefer(id, blobToUpload);
            }
            else {
                upload.now(id);
                return true;
            }
        }
    };

    qq.extend(this, {
        /**
         * Adds file or file input to the queue
         **/
        add: function(id, file) {
            handler.add.apply(this, arguments);
        },

        /**
         * Sends the file identified by id
         */
        upload: function(id) {
            if (connectionManager.open(id)) {
                return upload.start(id);
            }
            return false;
        },

        retry: function(id) {
            // On retry, if concurrent chunking has been enabled, we may have aborted all other in-progress chunks
            // for a file when encountering a failed chunk upload.  We then signaled the controller to ignore
            // all failures associated with these aborts.  We are now retrying, so we don't want to ignore
            // any more failures at this point.
            if (concurrentChunkingPossible) {
                handler._getFileState(id).temp.ignoreFailure = false;
            }

            // If we are attempting to retry a file that is already consuming a connection, this is likely an auto-retry.
            // Just go ahead and ask the handler to upload again.
            if (connectionManager.isUsingConnection(id)) {
                return upload.start(id);
            }

            // If we are attempting to retry a file that is not currently consuming a connection,
            // this is likely a manual retry attempt.  We will need to ensure a connection is available
            // before the retry commences.
            else {
                return controller.upload(id);
            }
        },

        /**
         * Cancels file upload by id
         */
        cancel: function(id) {
            var cancelRetVal = handler.cancel(id);

            if (qq.isGenericPromise(cancelRetVal)) {
                cancelRetVal.then(function() {
                    upload.cancel(id);
                });
            }
            else if (cancelRetVal !== false) {
                upload.cancel(id);
            }
        },

        /**
         * Cancels all queued or in-progress uploads
         */
        cancelAll: function() {
            var waitingOrConnected = connectionManager.getWaitingOrConnected(),
                i;

            // ensure files are cancelled in reverse order which they were added
            // to avoid a flash of time where a queued file begins to upload before it is canceled
            if (waitingOrConnected.length) {
                for (i = waitingOrConnected.length - 1; i >= 0; i--) {
                    controller.cancel(waitingOrConnected[i]);
                }
            }

            connectionManager.reset();
        },

        // Returns a File, Blob, or the Blob/File for the reference/parent file if the targeted blob is a proxy.
        // Undefined if no file record is available.
        getFile: function(id) {
            if (handler.getProxy && handler.getProxy(id)) {
                return handler.getProxy(id).referenceBlob;
            }

            return handler.getFile && handler.getFile(id);
        },

        // Returns true if the Blob associated with the ID is related to a proxy s
        isProxied: function(id) {
            return !!(handler.getProxy && handler.getProxy(id));
        },

        getInput: function(id) {
            if (handler.getInput) {
                return handler.getInput(id);
            }
        },

        reset: function() {
            log("Resetting upload handler");
            controller.cancelAll();
            connectionManager.reset();
            handler.reset();
        },

        expunge: function(id) {
            if (controller.isValid(id)) {
                return handler.expunge(id);
            }
        },

        /**
         * Determine if the file exists.
         */
        isValid: function(id) {
            return handler.isValid(id);
        },

        getResumableFilesData: function() {
            if (handler.getResumableFilesData) {
                return handler.getResumableFilesData();
            }
            return [];
        },

        /**
         * This may or may not be implemented, depending on the handler.  For handlers where a third-party ID is
         * available (such as the "key" for Amazon S3), this will return that value.  Otherwise, the return value
         * will be undefined.
         *
         * @param id Internal file ID
         * @returns {*} Some identifier used by a 3rd-party service involved in the upload process
         */
        getThirdPartyFileId: function(id) {
            if (controller.isValid(id)) {
                return handler.getThirdPartyFileId(id);
            }
        },

        /**
         * Attempts to pause the associated upload if the specific handler supports this and the file is "valid".
         * @param id ID of the upload/file to pause
         * @returns {boolean} true if the upload was paused
         */
        pause: function(id) {
            if (controller.isResumable(id) && handler.pause && controller.isValid(id) && handler.pause(id)) {
                connectionManager.free(id);
                handler.moveInProgressToRemaining(id);
                return true;
            }
            return false;
        },

        // True if the file is eligible for pause/resume.
        isResumable: function(id) {
            return !!handler.isResumable && handler.isResumable(id);
        }
    });

    qq.extend(options, o);
    log = options.log;
    chunkingPossible = options.chunking.enabled && qq.supportedFeatures.chunking;
    concurrentChunkingPossible = chunkingPossible && options.chunking.concurrent.enabled;

    preventRetryResponse = (function() {
        var response = {};

        response[options.preventRetryParam] = true;

        return response;
    }());

    upload.initHandler();
};
