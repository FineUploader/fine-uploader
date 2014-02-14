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
        generationWaitingQueue = [],
        generationDoneQueue = [],
        options, log, handlerImpl;

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
        setSize: function(id, newSize) {}

    };
    qq.extend(options, o);

    log = options.log;

    // Returns a qq.BlobProxy, or an actual File/Blob if no proxy is involved, or undefined
    // if none of these are available for the ID
    function getBlobOrProxy(id) {
        return (handlerImpl.getProxy && handlerImpl.getProxy(id)) ||
            (handlerImpl.getFile && handlerImpl.getFile(id));
    }

    // For Blobs that are part of a group of scaled images, along with a reference image,
    // this will ensure the blobs in the group are uploaded in the order they were triggered,
    // even if some async processing must be completed on one or more Blobs first.
    function startBlobUpload(id, blob) {
        // If we don't have a file/blob yet, request it, and then submit the
        // upload to the specific handler once the blob is available.
        // ASSUMPTION: This condition will only ever be true if XHR uploading is supported.
        if (blob && qq.BlobProxy && blob instanceof qq.BlobProxy) {
            generationWaitingQueue.push(id);

            // Blob creation may take some time, so the caller may want to update the
            // UI to indicate that an operation is in progress, even before the actual
            // upload begins and an onUpload callback is invoked.
            options.onUploadPrep(id);

            log("Attempting to generate a blob on-demand for " + id);
            blob.create().then(function(actualBlob) {
                log("Generated an on-demand blob for " + id);

                // Update record associated with this file by providing the actual Blob
                handlerImpl.updateBlob(id, actualBlob);

                // Propagate the size for this generated Blob
                options.setSize(id, actualBlob.size);

                // Order handler to recalculate chunking possibility, if applicable
                handlerImpl.reevaluateChunking(id);

                maybeUploadGenerationQueueBlobs(id);
            });
        }
        else {
            if (generationWaitingQueue.length) {
                generationWaitingQueue.push(id);
                generationDoneQueue.push(id);
            }
            else {
                handlerImpl.upload(id);
                return true;
            }
        }

        return false;
    }

    // When a Blob tied to a group of generated Blobs is ready for upload
    // (and any async processing needed by this Blob is done) this will be called
    // with the Blob's ID.  Since we want to ensure that these grouped Blobs are
    // uploaded in a specific order, this will iterate through the ordered list of
    // Blobs to upload, and only upload those that are ready, stopping when it hits one that isn't.
    function maybeUploadGenerationQueueBlobs(id) {
        var waitingForGenerationQueueCopy = qq.extend([], generationWaitingQueue);

        generationDoneQueue.push(id);

        qq.each(waitingForGenerationQueueCopy, function(idx, id) {
            var generationDoneQueueIdx = qq.indexOf(generationDoneQueue, id);

            if (generationDoneQueueIdx >= 0) {
                log("Submitting " + id + " to be uploaded as its turn in the generation queue is up.");
                generationDoneQueue.splice(generationDoneQueueIdx, 1);
                handlerImpl.upload(generationWaitingQueue.shift());
            }
            else {
                return false;
            }
        });
    }

    // Called whenever a file is to be uploaded.  Returns true if the file will be uploaded at once.
    function startUpload(id) {
        var blobToUpload = getBlobOrProxy(id);

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

        if (qq.BlobProxy && getBlobOrProxy(id) instanceof qq.BlobProxy) {
            log("Generated blob upload has ended for " + id + ", disposing generated blob.");
            delete handlerImpl._getFileState(id).file;
        }

        if (i >= 0) {
            queue.splice(i, 1);

            if (queue.length >= max && i < max){
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
            {onUploadComplete: dequeue, onUuidChanged: options.onUuidChanged,
                getName: options.getName, getUuid: options.getUuid, getSize: options.getSize, log: log}
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
            var i = qq.indexOf(queue, id);
            if (i >= 0) {
                return handlerImpl.upload(id, true);
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
            if (handlerImpl.pause && this.isValid(id) && handlerImpl.pause(id)) {
                dequeue(id);
                return true;
            }
        }
    });

    determineHandlerImpl();
};
