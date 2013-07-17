/**
 * Common API exposed to creators of XHR handlers.  This is reused and possibly overriding in some cases by specific
 * XHR upload handlers.
 *
 * @param fileState An array containing objects that describe files tracked by the XHR upload handler.
 * @param onUpload Used to call the specific XHR upload handler when an upload has been request.
 * @param log Method used to send messages to the log.
 * @returns Various methods
 * @constructor
 */
qq.UploadHandlerXhrApi = function(fileState, onUpload, log) {
    var api;

    function expungeItem(id) {
        var xhr = fileState[id].xhr;

        if (xhr) {
            xhr.onreadystatechange = null;
            xhr.abort();
        }

        delete fileState[id];
    }


    api = {
        /**
         * TODO eliminate duplication w/ handler.xhr.js
         *
         * Adds File or Blob to the queue
         * Returns id to use with upload, cancel
         **/
        add: function(fileOrBlobData){
            var id,
                uuid = qq.getUniqueId();

            if (qq.isFile(fileOrBlobData)) {
                id = fileState.push({file: fileOrBlobData}) - 1;
            }
            else if (qq.isBlob(fileOrBlobData.blob)) {
                id = fileState.push({blobData: fileOrBlobData}) - 1;
            }
            else {
                throw new Error('Passed obj in not a File or BlobData (in qq.UploadHandlerXhr)');
            }

            fileState[id].uuid = uuid;

            return id;
        },

        getName: function(id) {
            if (api.isValid(id)) {
                var file = fileState[id].file,
                    blobData = fileState[id].blobData,
                    newName = fileState[id].newName;

                if (newName !== undefined) {
                    return newName;
                }
                else if (file) {
                    // fix missing name in Safari 4
                    //NOTE: fixed missing name firefox 11.0a2 file.fileName is actually undefined
                    return (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
                }
                else {
                    return blobData.name;
                }
            }
            else {
                log(id + " is not a valid item ID.", "error");
            }
        },

        setName: function(id, newName) {
            fileState[id].newName = newName;
        },

        getSize: function(id) {
            /*jshint eqnull: true*/
            var fileOrBlob = fileState[id].file || fileState[id].blobData.blob;

            if (qq.isFileOrInput(fileOrBlob)) {
                return fileOrBlob.fileSize != null ? fileOrBlob.fileSize : fileOrBlob.size;
            }
            else {
                return fileOrBlob.size;
            }
        },

        getFile: function(id) {
            if (fileState[id]) {
                return fileState[id].file || fileState[id].blobData.blob;
            }
        },

        isValid: function(id) {
            return fileState[id] !== undefined;
        },

        reset: function() {
            fileState.length = 0;
        },

        expunge: function(id) {
            return expungeItem(id);
        },

        getUuid: function(id) {
            return fileState[id].uuid;
        },

        /**
         * Sends the file identified by id to the server
         */
        upload: function(id, retry) {
            return onUpload(id, retry);
        },

        cancel: function(id) {
            var onCancelRetVal = options.onCancel(id, api.getName(id));

            if (qq.isPromise(onCancelRetVal)) {
                return onCancelRetVal.then(function() {
                    expungeItem(id);
                });
            }
            else if (onCancelRetVal !== false) {
                expungeItem(id);
                return true;
            }

            return false;
        }
    };

    return api;
};
