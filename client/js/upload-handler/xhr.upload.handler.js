/* globals qq */
/**
 * Common API exposed to creators of XHR handlers.  This is reused and possibly overriding in some cases by specific
 * XHR upload handlers.
 *
 * @constructor
 */
qq.XhrUploadHandler = function(spec) {
    "use strict";

    var handler = this,
        namespace = spec.options.namespace,
        proxy = spec.proxy,
        fileState = {},
        chunking = spec.options.chunking,
        resume = spec.options.resume,
        chunkFiles = chunking && spec.options.chunking.enabled && qq.supportedFeatures.chunking,
        resumeEnabled = resume && spec.options.resume.enabled && chunkFiles && qq.supportedFeatures.resume,
        onCancel = proxy.onCancel,
        getName = proxy.getName,
        getSize = proxy.getSize,
        getUuid = proxy.getUuid,
        getEndpoint = proxy.getEndpoint,
        getDataByUuid = proxy.getDataByUuid,
        onUuidChanged = proxy.onUuidChanged,
        onProgress = proxy.onProgress,
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

            if (resumeEnabled) {
                handler._maybePrepareForResume(id);
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
            handler._maybeDeletePersistedChunkData(id);
            delete fileState[id];
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

        _registerProgressHandler: function(id, chunkSize) {
            var xhr = fileState[id].xhr,

                progressCalculator = {
                    simple: function(loaded, total) {
                        fileState[id].loaded = loaded;
                        onProgress(id, name, loaded, total);
                    },

                    chunked: function(loaded, total) {
                        var totalSuccessfullyLoadedForFile = fileState[id].loaded,
                            loadedForRequest = loaded,
                            totalForRequest = total,
                            totalFileSize = getSize(id),
                            estActualChunkLoaded = loadedForRequest - (totalForRequest - chunkSize),
                            totalLoadedForFile = totalSuccessfullyLoadedForFile + estActualChunkLoaded;

                        onProgress(id, name, totalLoadedForFile, totalFileSize);
                    }
                };

            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    /* jshint eqnull: true */
                    var type = chunkSize == null ? "simple" : "chunked";
                    progressCalculator[type](e.loaded, e.total);
                }
            };
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
            return handler.getFile(id).type;
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
                fileOrBlob = handler.getFile(id),
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
        },

        // If this is a resumable upload, grab the relevant data from storage and items in memory that track this upload
        // so we can pick up from where we left off.
        _maybePrepareForResume: function(id) {
            var fileState = handler._getFileState(id),
                localStorageId, persistedData;

            // Resume is enabled and possible and this is the first time we've tried to upload this file in this session,
            // so prepare for a resume attempt.
            if (resumeEnabled && fileState.key === undefined) {
                localStorageId = handler._getLocalStorageId(id);
                persistedData = localStorage.getItem(localStorageId);

                // If we found this item in local storage, maybe we should resume it.
                if (persistedData) {
                    persistedData = JSON.parse(persistedData);

                    // If we found a resume record but we have already handled this file in this session,
                    // don't try to resume it & ensure we don't persist future check data
                    if (getDataByUuid(persistedData.uuid)) {
                        handler._markNotResumable(id);
                    }
                    else {
                        log(qq.format("Identified file with ID {} and name of {} as resumable.", id, getName(id)));

                        onUuidChanged(id, persistedData.uuid);
                        fileState.key = persistedData.key;
                        fileState.chunking = persistedData.chunking;
                        fileState.loaded = persistedData.loaded;
                        fileState.attemptingResume = true;
                    }
                }
            }
        },

        // Returns true if a candidate for resume is already uploading.
        _isUploading: function(persistedData) {
            return ;
        },

        // Persist any data needed to resume this upload in a new session.
        _maybePersistChunkedState: function(id) {
            var fileState = handler._getFileState(id),
                localStorageId, persistedData;

            // If local storage isn't supported by the browser, or if resume isn't enabled or possible, give up
            if (resumeEnabled && handler.isResumable(id)) {
                localStorageId = handler._getLocalStorageId(id);

                persistedData = {
                    name: getName(id),
                    size: getSize(id),
                    uuid: getUuid(id),
                    key: fileState.key,
                    chunking: fileState.chunking,
                    loaded: fileState.loaded,
                    lastUpdated: Date.now()
                };

                localStorage.setItem(localStorageId, JSON.stringify(persistedData));
            }
        },

        // Removes a chunked upload record from local storage, if possible.
        // Returns true if the item was removed, false otherwise.
        _maybeDeletePersistedChunkData: function(id) {
            var localStorageId;

            if (resumeEnabled && handler.isResumable(id)) {
                localStorageId = handler._getLocalStorageId(id);

                if (localStorageId && localStorage.getItem(localStorageId)) {
                    localStorage.removeItem(localStorageId);
                    return true;
                }
            }

            return false;
        },

        // Iterates through all XHR handler-created resume records (in local storage),
        // invoking the passed callback and passing in the key and value of each local storage record.
        _iterateResumeRecords: function(callback) {
            if (resumeEnabled) {
                qq.each(localStorage, function(key, item) {
                    if (key.indexOf(qq.format("qq{}resume-", namespace)) === 0) {
                        var uploadData = JSON.parse(item);
                        callback(key, uploadData);
                    }
                });
            }
        },

        /**
         * @returns {Array} Array of objects containing properties useful to integrators
         * when it is important to determine which files are potentially resumable.
         */
        _getResumableFilesData: function() {
            var resumableFilesData = [];

            handler._iterateResumeRecords(function(key, uploadData) {
                resumableFilesData.push({
                    name: uploadData.name,
                    size: uploadData.size,
                    uuid: uploadData.uuid,
                    partIdx: uploadData.chunking.lastSent + 1,
                    key: uploadData.key
                });
            });

            return resumableFilesData;
        },

        // Deletes any local storage records that are "expired".
        _removeExpiredChunkingRecords: function() {
            var expirationDays = resume.recordsExpireIn;

            handler._iterateResumeRecords(function(key, uploadData) {
                var expirationDate = new Date(uploadData.lastUpdated);

                // transform updated date into expiration date
                expirationDate.setDate(expirationDate.getDate() + expirationDays);

                if (expirationDate.getTime() <= Date.now()) {
                    log("Removing expired resume record with key " + key);
                    localStorage.removeItem(key);
                }
            });
        },

        /**
         * @param id File ID
         * @returns {string} Identifier for this item that may appear in the browser's local storage
         */
        _getLocalStorageId: function(id) {
            var name = getName(id),
                size = getSize(id),
                chunkSize = chunking.partSize,
                endpoint = getEndpoint(id);

            return qq.format("qq{}resume-{}-{}-{}-{}", namespace, name, size, chunkSize, endpoint);
        },

        /**
         * Determine if the associated file should be chunked.
         *
         * @param id ID of the associated file
         * @returns {*} true if chunking is enabled, possible, and the file can be split into more than 1 part
         */
        //TODO consider moving the side-effect of this function into another function
        _shouldChunkThisFile: function(id) {
            var totalChunks,
                fileState = handler._getFileState(id);

            if (!fileState.chunking) {
                fileState.chunking = {};
                totalChunks = handler._getTotalChunks(id);
                if (totalChunks > 1) {
                    fileState.chunking.enabled = true;
                    fileState.chunking.parts = totalChunks;
                }
                else {
                    fileState.chunking.enabled = false;
                }
            }

            return fileState.chunking.enabled;
        }
    });
};
