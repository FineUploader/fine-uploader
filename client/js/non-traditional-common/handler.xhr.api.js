/* globals qq */
/**
 * TODO
 * @constructor
 */
qq.NonTraditionalUploadHandlerXhrApi = function(internalApi, spec, proxy) {
    "use strict";

    var namespace = spec.namespace,
        onUuidChanged = proxy.onUuidChanged,
        resumeEnabled = spec.resumeEnabled,
        getEndpoint = proxy.getEndpoint,
        getName = proxy.getName,
        getSize = proxy.getSize,
        getUuid = proxy.getUuid,
        log = proxy.log,
        baseHandlerXhrApi = new qq.UploadHandlerXhrApi(internalApi, spec, proxy);

    qq.extend(internalApi, {
        // If this is a resumable upload, grab the relevant data from storage and items in memory that track this upload
        // so we can pick up from where we left off.
        maybePrepareForResume: function(id) {
            var fileState = internalApi.getFileState(id),
                localStorageId, persistedData;

            // Resume is enabled and possible and this is the first time we've tried to upload this file in this session,
            // so prepare for a resume attempt.
            if (resumeEnabled && fileState.key === undefined) {
                localStorageId = internalApi.getLocalStorageId(id);
                persistedData = localStorage.getItem(localStorageId);

                // If we haven't found this item in local storage, give up
                if (persistedData) {
                    log(qq.format("Identified file with ID {} and name of {} as resumable.", id, getName(id)));

                    persistedData = JSON.parse(persistedData);

                    onUuidChanged(id, persistedData.uuid);
                    fileState.key = persistedData.key;
                    fileState.loaded = persistedData.loaded;
                    fileState.chunking = persistedData.chunking;
                }
            }
        },

        // Persist any data needed to resume this upload in a new session.
        maybePersistChunkedState: function(id) {
            var fileState = internalApi.getFileState(id),
                localStorageId, persistedData;

            // If local storage isn't supported by the browser, or if resume isn't enabled or possible, give up
            if (resumeEnabled) {
                localStorageId = internalApi.getLocalStorageId(id);

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
        maybeDeletePersistedChunkData: function(id) {
            var localStorageId;

            if (resumeEnabled) {
                localStorageId = internalApi.getLocalStorageId(id);

                if (localStorageId && localStorage.getItem(localStorageId)) {
                    localStorage.removeItem(localStorageId);
                    return true;
                }
            }

            return false;
        },

        // Iterates through all XHR handler-created resume records (in local storage),
        // invoking the passed callback and passing in the key and value of each local storage record.
        iterateResumeRecords: function(callback) {
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
        getResumableFilesData: function() {
            var resumableFilesData = [];

            internalApi.iterateResumeRecords(function(key, uploadData) {
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
        removeExpiredChunkingRecords: function() {
            var expirationDays = spec.resume.recordsExpireIn;

            internalApi.iterateResumeRecords(function(key, uploadData) {
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
        getLocalStorageId: function(id) {
            var name = getName(id),
                size = getSize(id),
                chunkSize = spec.chunking.partSize,
                endpoint = getEndpoint(id);

            return qq.format("qq{}resume-{}-{}-{}-{}", namespace, name, size, chunkSize, endpoint);
        }
    });

    qq.extend(this, baseHandlerXhrApi);

    qq.extend(this, {
        getResumableFilesData: function() {
            return internalApi.getResumableFilesData();
        },

        getThirdPartyFileId: function(id) {
            return internalApi.getFileState(id).key;
        }
    });

    qq.override(this, function(super_) {
        return {
            add: function(id, fileOrBlobData) {
                super_.add.apply(this, arguments);

                if (resumeEnabled) {
                    internalApi.maybePrepareForResume(id);
                }
            }
        };
    });
};
