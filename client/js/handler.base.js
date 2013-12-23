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
        onUpload: function(id, fileName){},
        onUploadChunk: function(id, fileName, chunkData){},
        onUploadChunkSuccess: function(id, chunkData, response, xhr){},
        onAutoRetry: function(id, fileName, response, xhr){},
        onResume: function(id, fileName, chunkData){},
        onUuidChanged: function(id, newUuid){},
        getName: function(id) {}

    };
    qq.extend(options, o);

    log = options.log;

    /**
     * Removes element from queue, starts upload of next
     */
    function dequeue(id) {
        var i = qq.indexOf(queue, id),
            max = options.maxConnections,
            nextId;

        if (i >= 0) {
            queue.splice(i, 1);

            if (queue.length >= max && i < max){
                nextId = queue[max-1];
                handlerImpl.upload(nextId);
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
            if (len <= options.maxConnections){
                handlerImpl.upload(id);
                return true;
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

        getFile: function(id) {
            if (handlerImpl.getFile) {
                return handlerImpl.getFile(id);
            }
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
