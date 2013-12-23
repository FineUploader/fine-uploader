/* globals qq */
/**
 * Common API exposed to creators of XHR handlers.  This is reused and possibly overriding in some cases by specific
 * XHR upload handlers.
 *
 * @param internalApi Object that will be filled with internal API methods
 * @param spec Options/static values used to configure this handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 * @constructor
 */
qq.UploadHandlerXhrApi = function(internalApi, spec, proxy) {
    "use strict";

    var publicApi = this,
        fileState = spec.fileState,
        chunking = spec.chunking,
        onUpload = proxy.onUpload,
        onCancel = proxy.onCancel,
        onUuidChanged = proxy.onUuidChanged,
        getName = proxy.getName,
        getSize = proxy.getSize,
        log = proxy.log;


    function getChunk(fileOrBlob, startByte, endByte) {
        if (fileOrBlob.slice) {
            return fileOrBlob.slice(startByte, endByte);
        }
        else if (fileOrBlob.mozSlice) {
            return fileOrBlob.mozSlice(startByte, endByte);
        }
        else if (fileOrBlob.webkitSlice) {
            return fileOrBlob.webkitSlice(startByte, endByte);
        }
    }

    qq.extend(internalApi, {
        /**
         * Creates an XHR instance for this file and stores it in the fileState.
         *
         * @param id File ID
         * @returns {XMLHttpRequest}
         */
        createXhr: function(id) {
            var xhr = qq.createXhrInstance();

            fileState[id].xhr = xhr;

            return xhr;
        },

        /**
         * @param id ID of the associated file
         * @returns {number} Number of parts this file can be divided into, or undefined if chunking is not supported in this UA
         */
        getTotalChunks: function(id) {
            if (chunking) {
                var fileSize = getSize(id),
                    chunkSize = chunking.partSize;

                return Math.ceil(fileSize / chunkSize);
            }
        },

        getChunkData: function(id, chunkIndex) {
            var chunkSize = chunking.partSize,
                fileSize = getSize(id),
                fileOrBlob = publicApi.getFile(id),
                startBytes = chunkSize * chunkIndex,
                endBytes = startBytes+chunkSize >= fileSize ? fileSize : startBytes+chunkSize,
                totalChunks = internalApi.getTotalChunks(id);

            return {
                part: chunkIndex,
                start: startBytes,
                end: endBytes,
                count: totalChunks,
                blob: getChunk(fileOrBlob, startBytes, endBytes),
                size: endBytes - startBytes
            };
        },

        getChunkDataForCallback: function(chunkData) {
            return {
                partIndex: chunkData.part,
                startByte: chunkData.start + 1,
                endByte: chunkData.end,
                totalParts: chunkData.count
            };
        }
    });

    qq.extend(this, {
        /**
         * Adds File or Blob to the queue
         **/
        add: function(id, fileOrBlobData) {
            if (qq.isFile(fileOrBlobData)) {
                fileState[id] = {file: fileOrBlobData};
            }
            else if (qq.isBlob(fileOrBlobData.blob)) {
                fileState[id] =  {blobData: fileOrBlobData};
            }
            else {
                throw new Error("Passed obj is not a File or BlobData (in qq.UploadHandlerXhr)");
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
            var xhr = fileState[id].xhr;

            if (xhr) {
                xhr.onreadystatechange = null;
                xhr.abort();
            }

            delete fileState[id];
        },

        /**
         * Sends the file identified by id to the server
         */
        upload: function(id, retry) {
            fileState[id] && delete fileState[id].paused;
            return onUpload(id, retry);
        },

        cancel: function(id) {
            var onCancelRetVal = onCancel(id, getName(id));

            if (onCancelRetVal instanceof qq.Promise) {
                return onCancelRetVal.then(function() {
                    this.expunge(id);
                });
            }
            else if (onCancelRetVal !== false) {
                this.expunge(id);
                return true;
            }

            return false;
        },

        pause: function(id) {
            var xhr = fileState[id].xhr;

            if(xhr) {
                log(qq.format("Aborting XHR upload for {} '{}' due to pause instruction.", id, getName(id)));
                fileState[id].paused = true;
                xhr.abort();
                return true;
            }
        }
    });
};
