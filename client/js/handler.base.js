/**
 * Class for uploading files, uploading itself is handled by child classes
 */
/*globals qq*/
qq.UploadHandler = function(o) {
    "use strict";

    var queue = [],
        options, log, handlerImpl, api;

    // Default options, can be overridden by the user
    options = {
        debug: false,
        forceMultipart: true,
        paramsInBody: false,
        paramsStore: {},
        endpointStore: {},
        filenameParam: 'qqfilename',
        cors: {
            expected: false,
            sendCredentials: false
        },
        maxConnections: 3, // maximum number of concurrent uploads
        uuidParamName: 'qquuid',
        totalFileSizeParamName: 'qqtotalfilesize',
        chunking: {
            enabled: false,
            partSize: 2000000, //bytes
            paramNames: {
                partIndex: 'qqpartindex',
                partByteOffset: 'qqpartbyteoffset',
                chunkSize: 'qqchunksize',
                totalParts: 'qqtotalparts',
                filename: 'qqfilename'
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
        onAutoRetry: function(id, fileName, response, xhr){},
        onResume: function(id, fileName, chunkData){},
        onUuidChanged: function(id, newUuid){}

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
    };

    if (qq.supportedFeatures.ajaxUploading) {
        handlerImpl = new qq.UploadHandlerXhr(options, dequeue, options.onUuidChanged, log);
    }
    else {
        handlerImpl = new qq.UploadHandlerForm(options, dequeue, options.onUuidChanged, log);
    }

    function cancelSuccess(id) {
        log('Cancelling ' + id);
        options.paramsStore.remove(id);
        dequeue(id);
    }


    api = {
        /**
         * Adds file or file input to the queue
         * @returns id
         **/
        add: function(file){
            return handlerImpl.add(file);
        },
        /**
         * Sends the file identified by id
         */
        upload: function(id){
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

            if (qq.isPromise(cancelRetVal)) {
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
        /**
         * Returns name of the file identified by id
         */
        getName: function(id) {
            return handlerImpl.getName(id);
        },
        // Update/change the name of the associated file.
        // This updated name should be sent as a parameter.
        setName: function(id, newName) {
            handlerImpl.setName(id, newName);
        },
        /**
         * Returns size of the file identified by id
         */
        getSize: function(id){
            if (handlerImpl.getSize) {
                return handlerImpl.getSize(id);
            }
        },
        getFile: function(id) {
            if (handlerImpl.getFile) {
                return handlerImpl.getFile(id);
            }
        },
        reset: function() {
            log('Resetting upload handler');
            api.cancelAll();
            queue = [];
            handlerImpl.reset();
        },
        expunge: function(id) {
            return handlerImpl.expunge(id);
        },
        getUuid: function(id) {
            return handlerImpl.getUuid(id);
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
        }
    };

    return api;
};
