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
        chunking = spec.options.chunking,
        resume = spec.options.resume,
        chunkFiles = chunking && spec.options.chunking.enabled && qq.supportedFeatures.chunking,
        resumeEnabled = resume && spec.options.resume.enabled && chunkFiles && qq.supportedFeatures.resume,
        getName = proxy.getName,
        getSize = proxy.getSize,
        getUuid = proxy.getUuid,
        getEndpoint = proxy.getEndpoint,
        getDataByUuid = proxy.getDataByUuid,
        onUuidChanged = proxy.onUuidChanged,
        onProgress = proxy.onProgress,
        log = proxy.log;

    function abort(id) {
        qq.each(handler._getXhrs(id), function(xhrId, xhr) {
            var ajaxRequester = handler._getAjaxRequester(id, xhrId);

            xhr.onreadystatechange = null;
            xhr.upload.onprogress = null;
            xhr.abort();
            ajaxRequester && ajaxRequester.canceled && ajaxRequester.canceled(id);
        });
    }

    qq.extend(this, new qq.UploadHandler(spec));

    qq.override(this, function(super_) {
        return {
            /**
             * Adds File or Blob to the queue
             **/
            add: function(id, blobOrProxy) {
                if (qq.isFile(blobOrProxy) || qq.isBlob(blobOrProxy)) {
                    super_.add(id, {file: blobOrProxy});
                }
                else if (blobOrProxy instanceof qq.BlobProxy) {
                    super_.add(id, {proxy: blobOrProxy});
                }
                else {
                    throw new Error("Passed obj is not a File, Blob, or proxy");
                }

                handler._initTempState(id);
                resumeEnabled && handler._maybePrepareForResume(id);
            },

            expunge: function(id) {
                abort(id);
                handler._maybeDeletePersistedChunkData(id);
                handler._clearXhrs(id);
                super_.expunge(id);
            }
        };
    });

    qq.extend(this, {
        // Clear the cached chunk `Blob` after we are done with it, just in case the `Blob` bytes are stored in memory.
        clearCachedChunk: function(id, chunkIdx) {
            delete handler._getFileState(id).temp.cachedChunks[chunkIdx];
        },

        clearXhr: function(id, chunkIdx) {
            var tempState = handler._getFileState(id).temp;

            if (tempState.xhrs) {
                delete tempState.xhrs[chunkIdx];
            }
            if (tempState.ajaxRequesters) {
                delete tempState.ajaxRequesters[chunkIdx];
            }
        },

        // Called when all chunks have been successfully uploaded.  Expected promissory return type.
        // This defines the default behavior if nothing further is required when all chunks have been uploaded.
        finalizeChunks: function(id, responseParser) {
            var lastChunkIdx = handler._getTotalChunks(id) - 1,
                xhr = handler._getXhr(id, lastChunkIdx);

            if (responseParser) {
                return new qq.Promise().success(responseParser(xhr), xhr);
            }

            return new qq.Promise().success({}, xhr);
        },

        getFile: function(id) {
            return handler.isValid(id) && handler._getFileState(id).file;
        },

        getProxy: function(id) {
            return handler.isValid(id) && handler._getFileState(id).proxy;
        },

        /**
         * @returns {Array} Array of objects containing properties useful to integrators
         * when it is important to determine which files are potentially resumable.
         */
        getResumableFilesData: function() {
            var resumableFilesData = [];

            handler._iterateResumeRecords(function(key, uploadData) {
                handler.moveInProgressToRemaining(null, uploadData.chunking.inProgress,  uploadData.chunking.remaining);

                var data = {
                    name: uploadData.name,
                    remaining: uploadData.chunking.remaining,
                    size: uploadData.size,
                    uuid: uploadData.uuid
                };

                if (uploadData.key) {
                    data.key = uploadData.key;
                }

                resumableFilesData.push(data);
            });

            return resumableFilesData;
        },

        isResumable: function(id) {
            return !!chunking && handler.isValid(id) && !handler._getFileState(id).notResumable;
        },

        moveInProgressToRemaining: function(id, optInProgress, optRemaining) {
            var inProgress = optInProgress || handler._getFileState(id).chunking.inProgress,
                remaining = optRemaining || handler._getFileState(id).chunking.remaining;

            if (inProgress) {
                inProgress.reverse();
                qq.each(inProgress, function(idx, chunkIdx) {
                    remaining.unshift(chunkIdx);
                });
                inProgress.length = 0;
            }
        },

        pause: function(id) {
            if (handler.isValid(id)) {
                log(qq.format("Aborting XHR upload for {} '{}' due to pause instruction.", id, getName(id)));
                handler._getFileState(id).paused = true;
                abort(id);
                return true;
            }
        },

        reevaluateChunking: function(id) {
            if (chunking && handler.isValid(id)) {
                var state = handler._getFileState(id),
                    totalChunks,
                    i;

                delete state.chunking;

                state.chunking = {};
                totalChunks = handler._getTotalChunks(id);
                if (totalChunks > 1 || chunking.mandatory) {
                    state.chunking.enabled = true;
                    state.chunking.parts = totalChunks;
                    state.chunking.remaining = [];

                    for (i = 0; i < totalChunks; i++) {
                        state.chunking.remaining.push(i);
                    }

                    handler._initTempState(id);
                }
                else {
                    state.chunking.enabled = false;
                }
            }
        },

        updateBlob: function(id, newBlob) {
            if (handler.isValid(id)) {
                handler._getFileState(id).file = newBlob;
            }
        },

        _clearXhrs: function(id) {
            var tempState = handler._getFileState(id).temp;

            qq.each(tempState.ajaxRequesters, function(chunkId) {
                delete tempState.ajaxRequesters[chunkId];
            });

            qq.each(tempState.xhrs, function(chunkId) {
                delete tempState.xhrs[chunkId];
            });
        },

        /**
         * Creates an XHR instance for this file and stores it in the fileState.
         *
         * @param id File ID
         * @param optChunkIdx The chunk index associated with this XHR, if applicable
         * @returns {XMLHttpRequest}
         */
        _createXhr: function(id, optChunkIdx) {
            return handler._registerXhr(id, optChunkIdx, qq.createXhrInstance());
        },

        _getAjaxRequester: function(id, optChunkIdx) {
            var chunkIdx = optChunkIdx == null ? -1 : optChunkIdx;
            return handler._getFileState(id).temp.ajaxRequesters[chunkIdx];
        },

        _getChunkData: function(id, chunkIndex) {
            var chunkSize = chunking.partSize,
                fileSize = getSize(id),
                fileOrBlob = handler.getFile(id),
                startBytes = chunkSize * chunkIndex,
                endBytes = startBytes + chunkSize >= fileSize ? fileSize : startBytes + chunkSize,
                totalChunks = handler._getTotalChunks(id),
                cachedChunks = this._getFileState(id).temp.cachedChunks,

                // To work around a Webkit GC bug, we must keep each chunk `Blob` in scope until we are done with it.
                // See https://github.com/Widen/fine-uploader/issues/937#issuecomment-41418760
                blob = cachedChunks[chunkIndex] || qq.sliceBlob(fileOrBlob, startBytes, endBytes);

            cachedChunks[chunkIndex] = blob;

            return {
                part: chunkIndex,
                start: startBytes,
                end: endBytes,
                count: totalChunks,
                blob: blob,
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

        /**
         * @param id File ID
         * @returns {string} Identifier for this item that may appear in the browser's local storage
         */
        _getLocalStorageId: function(id) {
            var formatVersion = "5.0",
                name = getName(id),
                size = getSize(id),
                chunkSize = chunking.partSize,
                endpoint = getEndpoint(id);

            return qq.format("qq{}resume{}-{}-{}-{}-{}", namespace, formatVersion, name, size, chunkSize, endpoint);
        },

        _getMimeType: function(id) {
            return handler.getFile(id).type;
        },

        _getPersistableData: function(id) {
            return handler._getFileState(id).chunking;
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

        _getXhr: function(id, optChunkIdx) {
            var chunkIdx = optChunkIdx == null ? -1 : optChunkIdx;
            return handler._getFileState(id).temp.xhrs[chunkIdx];
        },

        _getXhrs: function(id) {
            return handler._getFileState(id).temp.xhrs;
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

        _initTempState: function(id) {
            handler._getFileState(id).temp = {
                ajaxRequesters: {},
                chunkProgress: {},
                xhrs: {},
                cachedChunks: {}
            };
        },

        _markNotResumable: function(id) {
            handler._getFileState(id).notResumable = true;
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

        // If this is a resumable upload, grab the relevant data from storage and items in memory that track this upload
        // so we can pick up from where we left off.
        _maybePrepareForResume: function(id) {
            var state = handler._getFileState(id),
                localStorageId, persistedData;

            // Resume is enabled and possible and this is the first time we've tried to upload this file in this session,
            // so prepare for a resume attempt.
            if (resumeEnabled && state.key === undefined) {
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

                        state.key = persistedData.key;
                        state.chunking = persistedData.chunking;
                        state.loaded = persistedData.loaded;
                        state.attemptingResume = true;

                        handler.moveInProgressToRemaining(id);
                    }
                }
            }
        },

        // Persist any data needed to resume this upload in a new session.
        _maybePersistChunkedState: function(id) {
            var state = handler._getFileState(id),
                localStorageId, persistedData;

            // If local storage isn't supported by the browser, or if resume isn't enabled or possible, give up
            if (resumeEnabled && handler.isResumable(id)) {
                localStorageId = handler._getLocalStorageId(id);

                persistedData = {
                    name: getName(id),
                    size: getSize(id),
                    uuid: getUuid(id),
                    key: state.key,
                    chunking: state.chunking,
                    loaded: state.loaded,
                    lastUpdated: Date.now()
                };

                localStorage.setItem(localStorageId, JSON.stringify(persistedData));
            }
        },

        _registerProgressHandler: function(id, chunkIdx, chunkSize) {
            var xhr = handler._getXhr(id, chunkIdx),
                name = getName(id),
                progressCalculator = {
                    simple: function(loaded, total) {
                        var fileSize = getSize(id);

                        if (loaded === total) {
                            onProgress(id, name, fileSize, fileSize);
                        }
                        else {
                            onProgress(id, name, (loaded >= fileSize ? fileSize - 1 : loaded), fileSize);
                        }
                    },

                    chunked: function(loaded, total) {
                        var chunkProgress = handler._getFileState(id).temp.chunkProgress,
                            totalSuccessfullyLoadedForFile = handler._getFileState(id).loaded,
                            loadedForRequest = loaded,
                            totalForRequest = total,
                            totalFileSize = getSize(id),
                            estActualChunkLoaded = loadedForRequest - (totalForRequest - chunkSize),
                            totalLoadedForFile = totalSuccessfullyLoadedForFile;

                        chunkProgress[chunkIdx] = estActualChunkLoaded;

                        qq.each(chunkProgress, function(chunkIdx, chunkLoaded) {
                            totalLoadedForFile += chunkLoaded;
                        });

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
         * Registers an XHR transport instance created elsewhere.
         *
         * @param id ID of the associated file
         * @param optChunkIdx The chunk index associated with this XHR, if applicable
         * @param xhr XMLHttpRequest object instance
         * @param optAjaxRequester `qq.AjaxRequester` associated with this request, if applicable.
         * @returns {XMLHttpRequest}
         */
        _registerXhr: function(id, optChunkIdx, xhr, optAjaxRequester) {
            var xhrsId = optChunkIdx == null ? -1 : optChunkIdx,
                tempState = handler._getFileState(id).temp;

            tempState.xhrs = tempState.xhrs || {};
            tempState.ajaxRequesters = tempState.ajaxRequesters || {};

            tempState.xhrs[xhrsId] = xhr;

            if (optAjaxRequester) {
                tempState.ajaxRequesters[xhrsId] = optAjaxRequester;
            }

            return xhr;
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
         * Determine if the associated file should be chunked.
         *
         * @param id ID of the associated file
         * @returns {*} true if chunking is enabled, possible, and the file can be split into more than 1 part
         */
        _shouldChunkThisFile: function(id) {
            var state = handler._getFileState(id);

            if (!state.chunking) {
                handler.reevaluateChunking(id);
            }

            return state.chunking.enabled;
        }
    });
};
