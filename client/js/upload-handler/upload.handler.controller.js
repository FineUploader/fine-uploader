/*globals qq*/
/**
 * Base upload handler module.  Delegates to more specific handlers.
 *
 * @param o Options.  Passed along to the specific handler submodule as well.
 * @param namespace [optional] Namespace for the specific handler.
 */
qq.UploadHandlerController = function(o, namespace) {
    "use strict";

    var controller = this,
        queue = [],
        chunking = false,
        preventRetryResponse, options, log, handler;

    // Default options, can be overridden by the user
    options = {
        debug: false,
        forceMultipart: true,
        paramsInBody: false,
        paramsStore: {},
        endpointStore: {},
        filenameParam: "qqfilename",
        cors: {
            expected: false,
            sendCredentials: false
        },
        maxConnections: 3, // maximum number of concurrent uploads
        uuidName: "qquuid",
        totalFileSizeName: "qqtotalfilesize",
        chunking: {
            enabled: false,
            partSize: 2000000 //bytes
        },
        resume: {
            enabled: false,
            id: null,
            recordsExpireIn: 7 //days
        },
        log: function(str, level) {},
        onProgress: function(id, fileName, loaded, total){},
        onComplete: function(id, fileName, response, xhr){},
        onCancel: function(id, fileName){},
        onUploadPrep: function(id){}, // Called if non-trivial operations will be performed before onUpload
        onUpload: function(id, fileName){},
        onUploadChunk: function(id, fileName, chunkData){},
        onUploadChunkSuccess: function(id, chunkData, response, xhr){},
        onAutoRetry: function(id, fileName, response, xhr){},
        onResume: function(id, fileName, chunkData){},
        onUuidChanged: function(id, newUuid){},
        getName: function(id) {},
        setSize: function(id, newSize) {},
        isQueued: function(id) {},
        getIdsInProxyGroup: function(id) {},
        getIdsInBatch: function(id) {}
    };
    qq.extend(options, o);
    chunking = options.chunking.enabled && qq.supportedFeatures.chunking;


    preventRetryResponse = (function() {
        var response = {};

        response[options.preventRetryParam] = true;

        return response;
    }());

    log = options.log;


    function cleanupUpload(id, response, opt_xhr) {
        var name = options.getName(id);

        options.onComplete(id, name, response, opt_xhr);

        if (handler._getFileState(id)) {
            delete handler._getFileState(id).xhr;
        }

        dequeue(id);
    }

    function maybeHandleUuidChange(id, response) {
        if (response.newUuid !== undefined) {
            options.onUuidChanged(id, response.newUuid);
        }
    }

    function uploadNonChunkedFile(id, name) {
        handler.uploadFile(id).then(
            function(response, opt_xhr) {
                var size = options.getSize(id);

                options.onProgress(id, name, size, size);
                maybeHandleUuidChange(id, response);
                cleanupUpload(id, response, opt_xhr);
            },

            function(response, opt_xhr) {
                // Make sure the success property is not true, since other internal code currently
                // depends on this value to determine status.
                response.success = false;

                if (!options.onAutoRetry(id, name, response, opt_xhr)) {
                    cleanupUpload(id, response, opt_xhr);
                }
            }
        );
    }


    /**
     * Retrieves the 0-based index of the next chunk to send.  Note that AWS uses 1-based indexing.
     *
     * @param id File ID
     * @returns {number} The 0-based index of the next file chunk to be sent to S3
     */
    function getNextPartIdxToSend(id) {
        var nextIdx = handler._getFileState(id).chunking.lastSent;

        if (nextIdx >= 0) {
            nextIdx = nextIdx + 1;
        }
        else {
            nextIdx = 0;
        }

        if (nextIdx >= handler._getTotalChunks(id)) {
            nextIdx = null;
        }

        return nextIdx;
    }

    function uploadChunk(id) {
        var size = options.getSize(id),
            name = options.getName(id),
            chunkIdx = getNextPartIdxToSend(id),
            chunkData = handler._getChunkData(id, chunkIdx),
            resuming = handler._getFileState(id).attemptingResume;

        options.onUploadChunk(id, name, handler._getChunkDataForCallback(chunkData));

        handler._maybePersistChunkedState(id);

        handler.uploadChunk(id, chunkIdx, resuming).then(
            function(response, xhr) {
                chunkUploadComplete(id, chunkIdx, response, xhr);
                handler._getFileState(id).chunking.lastSent = chunkIdx;

                var nextChunkIdx = getNextPartIdxToSend(id);

                if (nextChunkIdx === null) {
                    options.onProgress(id, name, size, size);
                    handler._maybeDeletePersistedChunkData(id);
                    maybeHandleUuidChange(id, response);
                    cleanupUpload(id, response, xhr);
                }
                else {
                    uploadChunk(id);
                }
            },

            function(response, xhr) {
                if (response.reset) {
                    resetChunkedUpload(id);
                }

                if (!options.onAutoRetry(id, name, response, xhr)) {
                    cleanupUpload(id, response, xhr);
                }
            }
        );
    }

    function resetChunkedUpload(id) {
        log("Server has ordered chunking effort to be restarted on next attempt for item ID " + id, "error");

        handler._maybeDeletePersistedChunkData(id);
        delete handler._getFileState(id).chunking;
        delete handler._getFileState(id).loaded;
        delete handler._getFileState(id).estTotalRequestsSize;
        delete handler._getFileState(id).initialRequestOverhead;
    }

    function chunkUploadComplete(id, chunkIdx, response, xhr) {
        var chunkData = handler._getChunkData(id, chunkIdx),
            estRequestOverhead = handler._getFileState(id).lastRequestOverhead || 0;

        handler._getFileState(id).attemptingResume = false;
        handler._getFileState(id).loaded += chunkData.size + estRequestOverhead;

        options.onUploadChunkSuccess(id, handler._getChunkDataForCallback(chunkData), response, xhr);
    }

    function uploadFile(id) {
        var name = options.getName(id);

        if (!controller.isValid(id)) {
            throw new qq.Error(id + " is not a valid file ID to upload!");
        }

        options.onUpload(id, name);

        if (chunking && handler._shouldChunkThisFile(id)) {
            uploadChunk(id);
        }
        else {
            uploadNonChunkedFile(id, name);
        }
    }

    // Returns a qq.BlobProxy, or an actual File/Blob if no proxy is involved, or undefined
    // if none of these are available for the ID
    function getProxyOrBlob(id) {
        return (handler.getProxy && handler.getProxy(id)) ||
            (handler.getFile && handler.getFile(id));
    }

    // Used when determining if a grouped Blob should be uploaded
    function waitingAndReadyForUpload(id) {
        return !!handler.getFile(id);
    }

    // Used when determining if a grouped Blob should be uploaded
    function eligibleForUpload(id) {
        return options.isQueued(id);
    }

    // Upload any grouped blobs, in the proper order, that are ready to be uploaded
    function maybeReadyToUpload(id) {
        var idsInGroup = options.getIdsInProxyGroup(id),
            uploadedThisId = false;

        if (idsInGroup && idsInGroup.length) {
            log("Maybe ready to upload proxy group file " + id);

            qq.each(idsInGroup, function(idx, idInGroup) {
                if (eligibleForUpload(idInGroup) && waitingAndReadyForUpload(idInGroup)) {
                    uploadedThisId = idInGroup === id;
                    uploadFile(idInGroup);
                }
                else if (eligibleForUpload(idInGroup)) {
                    return false;
                }
            });
        }
        else {
            uploadedThisId = true;
            uploadFile(id);
        }

        return uploadedThisId;
    }

    // For Blobs that are part of a group of generated images, along with a reference image,
    // this will ensure the blobs in the group are uploaded in the order they were triggered,
    // even if some async processing must be completed on one or more Blobs first.
    function startBlobUpload(id, blob) {
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

                maybeReadyToUpload(id);
            },

            // Blob could not be generated.  Fail the upload & attempt to prevent retries.  Also bubble error message.
            function(errorMessage) {
                var errorResponse = {};

                if (errorMessage) {
                    errorResponse.error = errorMessage;
                }

                log(qq.format("Failed to generate blob for ID {}.  Error message: {}.", id, errorMessage), "error");

                options.onComplete(id, options.getName(id), qq.extend(errorResponse, preventRetryResponse), null);
                maybeReadyToUpload(id);
                dequeue(id);
            });
        }
        else {
            return maybeReadyToUpload(id);
        }

        return false;
    }

    // Called whenever a file is to be uploaded.  Returns true if the file will be uploaded at once.
    function startUpload(id) {
        var blobToUpload = getProxyOrBlob(id);

        if (blobToUpload) {
            return startBlobUpload(id, blobToUpload);
        }
        else {
            uploadFile(id);
            return true;
        }

    }

    /**
     * Removes element from queue, starts upload of next
     */
    function dequeue(id) {
        var i = qq.indexOf(queue, id),
            max = options.maxConnections,
            nextId;

        if (getProxyOrBlob(id) instanceof qq.BlobProxy) {
            log("Generated blob upload has ended for " + id + ", disposing generated blob.");
            delete handler._getFileState(id).file;
        }

        if (i >= 0) {
            queue.splice(i, 1);

            if (queue.length >= max && i < max) {
                nextId = queue[max-1];
                startUpload(nextId);
            }
        }
    }

    function cancelSuccess(id) {
        log("Cancelling " + id);
        options.paramsStore.remove(id);
        dequeue(id);
    }

    function determineSpecificHandler() {
        var handlerType = namespace ? qq[namespace] : qq.traditional,
            handlerModuleSubtype = qq.supportedFeatures.ajaxUploading ? "Xhr" : "Form";

        handler = new handlerType[handlerModuleSubtype + "UploadHandler"](
            options,
            {
                onUuidChanged: options.onUuidChanged,
                getName: options.getName,
                getUuid: options.getUuid,
                getSize: options.getSize,
                getDataByUuid: options.getDataByUuid,
                log: log
            }
        );
    }


    qq.extend(this, {
        /**
         * Adds file or file input to the queue
         * @returns id
         **/
        add: function(id, file) {
            return handler.add.apply(this, arguments);
        },

        /**
         * Sends the file identified by id
         */
        upload: function(id) {
            var len = queue.push(id);

            // if too many active uploads, wait...
            if (len <= options.maxConnections) {
                return startUpload(id);
            }

            return false;
        },

        retry: function(id) {
            var i = qq.indexOf(queue, id),
                blobOrProxy = getProxyOrBlob(id),
                isProxy = blobOrProxy && blobOrProxy instanceof qq.BlobProxy;

            if (i >= 0) {
                return isProxy ? startUpload(id) : uploadFile(id);
            }
            else {
                return controller.upload(id);
            }
        },

        /**
         * Cancels file upload by id
         */
        cancel: function(id) {
            var cancelRetVal = handler.cancel(id);

            if (cancelRetVal instanceof qq.Promise) {
                cancelRetVal.then(function() {
                    cancelSuccess(id);
                });
            }
            else if (cancelRetVal !== false) {
                cancelSuccess(id);
            }
        },

        /**
         * Cancels all queued or in-progress uploads
         */
        cancelAll: function() {
            var self = this,
                queueCopy = [];

            qq.extend(queueCopy, queue);
            qq.each(queueCopy, function(idx, fileId) {
                self.cancel(fileId);
            });

            queue = [];
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
            queue = [];
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
            if (handler.getThirdPartyFileId && controller.isValid(id)) {
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
                dequeue(id);
                return true;
            }
        },

        // True if the file is eligible for pause/resume.
        isResumable: function(id) {
            return !!handler.isResumable && handler.isResumable(id);
        }
    });

    determineSpecificHandler();
};
