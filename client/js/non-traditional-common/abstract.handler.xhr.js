/* globals qq */
/**
 * TODO
 * @constructor
 */
qq.AbstractNonTraditionalUploadHandlerXhr = function(spec) {
    "use strict";

    var handler = this,
        options = spec.options,
        proxy = spec.proxy,
        chunking = options.chunking,
        resume = options.resume,
        namespace = options.namespace,
        onUuidChanged = proxy.onUuidChanged,
        resumeEnabled = options.resumeEnabled,
        getEndpoint = proxy.getEndpoint,
        getName = proxy.getName,
        getSize = proxy.getSize,
        getUuid = proxy.getUuid,
        getDataByUuid = proxy.getDataByUuid,
        log = proxy.log,
        baseHandlerXhrApi = new qq.AbstractUploadHandlerXhr(spec);

    qq.extend(this, baseHandlerXhrApi);
    qq.extend(this, {
        getResumableFilesData: function() {
            return handler._getResumableFilesData();
        },

        getThirdPartyFileId: function(id) {
            return handler._getFileState(id).key;
        },

        /**
         * Determine if the associated file should be chunked.
         *
         * @param id ID of the associated file
         * @returns {*} true if chunking is enabled, possible, and the file can be split into more than 1 part
         */
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
                        fileState.loaded = persistedData.loaded;
                        fileState.chunking = persistedData.chunking;
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
                    loaded: fileState.loaded,
                    chunking: fileState.chunking,
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
        }
    });

    qq.override(this, function(super_) {
        return {
            add: function(id, fileOrBlobData) {
                super_.add.apply(this, arguments);

                if (resumeEnabled) {
                    handler._maybePrepareForResume(id);
                }
            }
        };
    });
};
