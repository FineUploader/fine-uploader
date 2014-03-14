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
        queue = [],
        chunkingPossible = false,
        chunking, preventRetryResponse, log, handler,

    // Default options, can be overridden by the user
    options = {
        paramsStore: {},
        maxConnections: 3, // maximum number of concurrent uploads
        chunking: {
            enabled: false
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
    },


    chunked = {
        done: function(id, chunkIdx, response, xhr) {
            var chunkData = handler._getChunkData(id, chunkIdx),
                estRequestOverhead = handler._getFileState(id).lastRequestOverhead || 0;

            handler._getFileState(id).attemptingResume = false;
            handler._getFileState(id).loaded += chunkData.size + estRequestOverhead;

            options.onUploadChunkSuccess(id, handler._getChunkDataForCallback(chunkData), response, xhr);
        },

        nextPart: function(id) {
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
        },

        reset: function(id) {
            log("Server or callback has ordered chunking effort to be restarted on next attempt for item ID " + id, "error");

            handler._maybeDeletePersistedChunkData(id);
            handler.reevaluateChunking(id);
            handler._getFileState(id).loaded = 0;
        },

        send: function(id) {
            var size = options.getSize(id),
                name = options.getName(id),
                chunkIdx = chunked.nextPart(id),
                chunkData = handler._getChunkData(id, chunkIdx),
                resuming = handler._getFileState(id).attemptingResume;

            if (handler._getFileState(id).loaded === undefined) {
                handler._getFileState(id).loaded = 0;
            }

            // Don't follow-through with the resume attempt if the integrator returns false from onResume
            if (resuming && options.onResume(id, name, chunkData) === false) {
                chunked.reset(id);
                resuming = false;
                chunkIdx = chunked.nextPart(id);
                chunkData = handler._getChunkData(id, chunkIdx);
            }

            options.onUploadChunk(id, name, handler._getChunkDataForCallback(chunkData));

            if (chunkData.part > 0) {
                handler._maybePersistChunkedState(id);
            }

            handler.uploadChunk(id, chunkIdx, resuming).then(
                function(response, xhr) {
                    var responseToReport = upload.normalizeResponse(response, true);

                    chunked.done(id, chunkIdx, responseToReport, xhr);
                    handler._getFileState(id).chunking.lastSent = chunkIdx;

                    var nextChunkIdx = chunked.nextPart(id);

                    if (nextChunkIdx === null) {
                        options.onProgress(id, name, size, size);
                        handler._maybeDeletePersistedChunkData(id);
                        upload.maybeNewUuid(id, responseToReport);
                        upload.cleanup(id, responseToReport, xhr);
                    }
                    else {
                        chunked.send(id);
                    }
                },

                function(response, xhr) {
                    var responseToReport = upload.normalizeResponse(response, false);

                    if (responseToReport.reset) {
                        chunked.reset(id);
                    }

                    if (!options.onAutoRetry(id, name, responseToReport, xhr)) {
                        upload.cleanup(id, responseToReport, xhr);
                    }
                }
            );
        }
    },


    simple = {
        send: function(id, name) {
            handler._getFileState(id).loaded = 0;

            handler.uploadFile(id).then(
                function(response, opt_xhr) {
                    var responseToReport = upload.normalizeResponse(response, true);

                    var size = options.getSize(id);

                    options.onProgress(id, name, size, size);
                    upload.maybeNewUuid(id, responseToReport);
                    upload.cleanup(id, responseToReport, opt_xhr);
                },

                function(response, opt_xhr) {
                    var responseToReport = upload.normalizeResponse(response, false);

                    if (!options.onAutoRetry(id, name, responseToReport, opt_xhr)) {
                        upload.cleanup(id, responseToReport, opt_xhr);
                    }
                }
            );
        }
    },


    upload = {
        cancel: function(id) {
            log("Cancelling " + id);
            options.paramsStore.remove(id);
            upload.dequeue(id);
        },

        cleanup: function(id, response, opt_xhr) {
            var name = options.getName(id);

            options.onComplete(id, name, response, opt_xhr);

            if (handler._getFileState(id)) {
                delete handler._getFileState(id).xhr;
            }

            upload.dequeue(id);
        },

        /**
         * Removes element from queue, starts upload of next
         */
        dequeue: function(id) {
            var i = qq.indexOf(queue, id),
                max = options.maxConnections,
                nextId;

            if (upload.getProxyOrBlob(id) instanceof qq.BlobProxy) {
                log("Generated blob upload has ended for " + id + ", disposing generated blob.");
                delete handler._getFileState(id).file;
            }

            if (i >= 0) {
                queue.splice(i, 1);

                if (queue.length >= max && i < max) {
                    nextId = queue[max-1];
                    upload.start(nextId);
                }
            }
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
                    upload.dequeue(id);
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

        maybeNewUuid: function (id, response) {
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
                chunked.send(id);
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
                return upload.start(id);
            }

            return false;
        },

        retry: function(id) {
            var i = qq.indexOf(queue, id);

            if (i >= 0) {
                return upload.start(id);
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
                upload.dequeue(id);
                return true;
            }
        },

        // True if the file is eligible for pause/resume.
        isResumable: function(id) {
            return !!handler.isResumable && handler.isResumable(id);
        }
    });

    qq.extend(options, o);

    log = options.log;

    preventRetryResponse = (function() {
        var response = {};

        response[options.preventRetryParam] = true;

        return response;
    }());

    chunkingPossible = options.chunking.enabled && qq.supportedFeatures.chunking;

    upload.initHandler();
};
