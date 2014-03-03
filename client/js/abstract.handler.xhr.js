/* globals qq */
/**
 * Common API exposed to creators of XHR handlers.  This is reused and possibly overriding in some cases by specific
 * XHR upload handlers.
 *
 * @constructor
 */
qq.AbstractUploadHandlerXhr = function(spec) {
    "use strict";

    var publicApi = this,
        options = spec.options,
        proxy = spec.proxy,
        fileState = {},
        chunking = options.chunking,
        onUpload = proxy.onUpload,
        onCancel = proxy.onCancel,
        getName = proxy.getName,
        getSize = proxy.getSize,
        log = proxy.log;


    function abort(id) {
        var xhr = fileState[id].xhr,
            ajaxRequester = fileState[id].currentAjaxRequester;

        xhr.onreadystatechange = null;
        xhr.upload.onprogress = null;
        xhr.abort();
        ajaxRequester && ajaxRequester.canceled && ajaxRequester.canceled(id);
    }

    qq.extend(this, {
        /**
         * Adds File or Blob to the queue
         **/
        add: function(id, blobOrProxy) {
            if (qq.isFile(blobOrProxy) || qq.isBlob(blobOrProxy)) {
                fileState[id] = {file: blobOrProxy};
            }
            else if (blobOrProxy instanceof qq.BlobProxy) {
                fileState[id] = {proxy: blobOrProxy};
            }
            else {
                throw new Error("Passed obj is not a File, Blob, or proxy");
            }
        },

        getFile: function(id) {
            return this.isValid(id) && fileState[id].file;
        },

        getProxy: function(id) {
            return this.isValid(id) && fileState[id].proxy;
        },

        isValid: function(id) {
            return fileState[id] !== undefined;
        },

        reset: function() {
            fileState.length = 0;
        },

        expunge: function(id) {
            var xhr = fileState[id].xhr;

            xhr && abort(id);

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
                    fileState[id].canceled = true;
                    this.expunge(id);
                });
            }
            else if (onCancelRetVal !== false) {
                fileState[id].canceled = true;
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
                abort(id);
                return true;
            }
        },

        updateBlob: function(id, newBlob) {
            if (this.isValid(id)) {
                fileState[id].file = newBlob;
            }
        },

        // Causes handler code to re-evaluate the current blob for chunking
        reevaluateChunking: function(id) {
            if (chunking && this.isValid(id)) {
                delete fileState[id].chunking;
            }
        },

        isResumable: function(id) {
            return !!chunking && this.isValid(id) && !fileState[id].notResumable;
        },

        /**
         * Creates an XHR instance for this file and stores it in the fileState.
         *
         * @param id File ID
         * @returns {XMLHttpRequest}
         */
        _createXhr: function(id) {
            return this._registerXhr(id, qq.createXhrInstance());
        },

        /**
         * Registers an XHR transport instance created elsewhere.
         *
         * @param id ID of the associated file
         * @param xhr XMLHttpRequest object instance
         * @returns {XMLHttpRequest}
         */
        _registerXhr: function(id, xhr, ajaxRequester) {
            fileState[id].xhr = xhr;
            fileState[id].currentAjaxRequester = ajaxRequester;
            return xhr;
        },

        _getMimeType: function(id) {
            return publicApi.getFile(id).type;
        },

        /**
         * @param id ID of the associated file
         * @returns {number} Number of parts this file can be divided into, or undefined if chunking is not supported in this UA
         */
        _getTotalChunks: function(id) {
            if (chunking) {
                var fileSize = getSize(id),
                    chunkSize = chunking.partSize;

                return Math.ceil(fileSize / chunkSize);
            }
        },

        _getChunkData: function(id, chunkIndex) {
            var chunkSize = chunking.partSize,
                fileSize = getSize(id),
                fileOrBlob = publicApi.getFile(id),
                startBytes = chunkSize * chunkIndex,
                endBytes = startBytes+chunkSize >= fileSize ? fileSize : startBytes+chunkSize,
                totalChunks = this._getTotalChunks(id);

            return {
                part: chunkIndex,
                start: startBytes,
                end: endBytes,
                count: totalChunks,
                blob: qq.sliceBlob(fileOrBlob, startBytes, endBytes),
                size: endBytes - startBytes
            };
        },

        _getChunkDataForCallback: function(chunkData) {
            return {
                partIndex: chunkData.part,
                startByte: chunkData.start + 1,
                endByte: chunkData.end,
                totalParts: chunkData.count
            };
        },

        _getFileState: function(id) {
            return fileState[id];
        },

        _markNotResumable: function(id) {
            fileState[id].notResumable = true;
        }
    });
};
