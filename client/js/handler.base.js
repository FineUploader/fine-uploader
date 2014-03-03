/*globals qq*/
/**
 * Base upload handler module.  Delegates to more specific handlers.
 *
 * @param o Options.  Passed along to the specific handler submodule as well.
 * @param namespace [optional] Namespace for the specific handler.
 */
qq.UploadHandler = function(o, namespace) {
    "use strict";

    var queue = [],
        preventRetryResponse, options, log, handlerImpl;

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
            partSize: 2000000, //bytes
            paramNames: {
                partIndex: "qqpartindex",
                partByteOffset: "qqpartbyteoffset",
                chunkSize: "qqchunksize",
                totalParts: "qqtotalparts",
                filename: "qqfilename"
            }
        },
        resume: {
            enabled: false,
            id: null,
            cookiesExpireIn: 7, //days
            paramNames: {
                resuming: "qqresume"
            }
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
        getIdsInGroup: function(id) {}
    };
    qq.extend(options, o);

    preventRetryResponse = (function() {
        var response = {};

        response[options.preventRetryParam] = true;

        return response;
    }());

    log = options.log;

    // Returns a qq.BlobProxy, or an actual File/Blob if no proxy is involved, or undefined
    // if none of these are available for the ID
    function getProxyOrBlob(id) {
        return (handlerImpl.getProxy && handlerImpl.getProxy(id)) ||
            (handlerImpl.getFile && handlerImpl.getFile(id));
    }

    // Used when determining if a grouped Blob should be uploaded
    function waitingAndReadyForUpload(id) {
        return !!handlerImpl.getFile(id);
    }

    // Used when determining if a grouped Blob should be uploaded
    function eligibleForUpload(id) {
        return options.isQueued(id);
    }

    // Upload any grouped blobs, in the proper order, that are ready to be uploaded
    function maybeReadyToUpload(id) {
        var idsInGroup = options.getIdsInGroup(id),
            uploadedThisId = false;

        if (idsInGroup && idsInGroup.length) {
            log("Maybe ready to upload grouped file " + id);

            qq.each(idsInGroup, function(idx, idInGroup) {
                if (eligibleForUpload(idInGroup) && waitingAndReadyForUpload(idInGroup)) {
                    uploadedThisId = idInGroup === id;
                    handlerImpl.upload(idInGroup);
                }
                else if (eligibleForUpload(idInGroup)) {
                    return false;
                }
            });
        }
        else {
            uploadedThisId = true;
            handlerImpl.upload(id);
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
        if (blob && !handlerImpl.getFile(id) && blob instanceof qq.BlobProxy) {

            // Blob creation may take some time, so the caller may want to update the
            // UI to indicate that an operation is in progress, even before the actual
            // upload begins and an onUpload callback is invoked.
            options.onUploadPrep(id);

            log("Attempting to generate a blob on-demand for " + id);
            blob.create().then(function(generatedBlob) {
                log("Generated an on-demand blob for " + id);

                // Update record associated with this file by providing the generated Blob
                handlerImpl.updateBlob(id, generatedBlob);

                // Propagate the size for this generated Blob
                options.setSize(id, generatedBlob.size);

                // Order handler to recalculate chunking possibility, if applicable
                handlerImpl.reevaluateChunking(id);

                maybeReadyToUpload(id);
            },

            // Blob could not be generated.  Fail the upload & attempt to prevent retries.  Also bubble error message.
            function(errorMessage) {
                var errorResponse = {};

                if (errorMessage) {
                    errorResponse.error = errorMessage;
                }

                log(qq.format("Failed to generate scaled version for ID {}.  Error message: {}.", id, errorMessage), "error");

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
            handlerImpl.upload(id);
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
            delete handlerImpl._getFileState(id).file;
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

    function determineHandlerImpl() {
        var handlerType = namespace ? qq[namespace] : qq,
            handlerModuleSubtype = qq.supportedFeatures.ajaxUploading ? "Xhr" : "Form";

        handlerImpl = new handlerType["UploadHandler" + handlerModuleSubtype](
            options,
            {
                onUploadComplete: dequeue,
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
            return handlerImpl.add.apply(this, arguments);
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
                return isProxy ? startUpload(id) : handlerImpl.upload(id, true);
            }
            else {
                return this.upload(id);
            }
        },

        /**
         * Cancels file upload by id
         */
        cancel: function(id) {
            var cancelRetVal = handlerImpl.cancel(id);

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
            if (handlerImpl.getProxy && handlerImpl.getProxy(id)) {
                return handlerImpl.getProxy(id).referenceBlob;
            }

            return handlerImpl.getFile && handlerImpl.getFile(id);
        },

        // Returns true if the Blob associated with the ID is related to a proxy s
        isProxied: function(id) {
            return !!(handlerImpl.getProxy && handlerImpl.getProxy(id));
        },

        getInput: function(id) {
            if (handlerImpl.getInput) {
                return handlerImpl.getInput(id);
            }
        },

        reset: function() {
            log("Resetting upload handler");
            this.cancelAll();
            queue = [];
            handlerImpl.reset();
        },

        expunge: function(id) {
            if (this.isValid(id)) {
                return handlerImpl.expunge(id);
            }
        },

        /**
         * Determine if the file exists.
         */
        isValid: function(id) {
            return handlerImpl.isValid(id);
        },

        getResumableFilesData: function() {
            if (handlerImpl.getResumableFilesData) {
                return handlerImpl.getResumableFilesData();
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
            if (handlerImpl.getThirdPartyFileId && this.isValid(id)) {
                return handlerImpl.getThirdPartyFileId(id);
            }
        },

        /**
         * Attempts to pause the associated upload if the specific handler supports this and the file is "valid".
         * @param id ID of the upload/file to pause
         * @returns {boolean} true if the upload was paused
         */
        pause: function(id) {
            if (this.isResumable(id) && handlerImpl.pause && this.isValid(id) && handlerImpl.pause(id)) {
                dequeue(id);
                return true;
            }
        },

        // True if the file is eligible for pause/resume.
        isResumable: function(id) {
            return !!handlerImpl.isResumable && handlerImpl.isResumable(id);
        }
    });

    determineHandlerImpl();
};
