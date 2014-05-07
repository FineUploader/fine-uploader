/* globals qq */
/**
 * Keeps a running tally of total upload progress for a batch of files.
 *
 * @param callback Invoked when total progress changes, passing calculated total loaded & total size values.
 * @param getSize Function that returns the size of a file given its ID
 * @constructor
 */
qq.TotalProgress = function(callback, getSize) {
    "use strict";

    var perFileProgress = {},
        totalLoaded = 0,
        totalSize = 0,

        lastLoadedSent = -1,
        lastTotalSent = -1,
        callbackProxy = function(loaded, total) {
            if (loaded !== lastLoadedSent || total !== lastTotalSent) {
                callback(loaded, total);
            }

            lastLoadedSent = loaded;
            lastTotalSent = total;
        },

        /**
         * @param failed Array of file IDs that have failed
         * @param retryable Array of file IDs that are retryable
         * @returns true if none of the failed files are eligible for retry
         */
        noRetryableFiles = function(failed, retryable) {
            var none = true;

            qq.each(failed, function(idx, failedId) {
                if (qq.indexOf(retryable, failedId) >= 0) {
                    none = false;
                    return false;
                }
            });

            return none;
        },

        onCancel = function(id) {
            updateTotalProgress(id, -1, -1);
            delete perFileProgress[id];
        },

        onAllComplete = function(successful, failed, retryable) {
            if (failed.length === 0 || noRetryableFiles(failed, retryable)) {
                callbackProxy(totalSize, totalSize);
                this.reset();
            }
        },

        onNew = function(id) {
            var size = getSize(id);

            // We might not know the size yet, such as for blob proxies
            if (size > 0) {
                updateTotalProgress(id, 0, size);
                perFileProgress[id] = {loaded: 0, total: size};
            }
        },

        /**
         * Invokes the callback with the current total progress of all files in the batch.  Called whenever it may
         * be appropriate to re-calculate and dissemenate this data.
         *
         * @param id ID of a file that has changed in some important way
         * @param newLoaded New loaded value for this file.  -1 if this value should no longer be part of calculations
         * @param newTotal New total size of the file.  -1 if this value should no longer be part of calculations
         */
        updateTotalProgress = function(id, newLoaded, newTotal) {
            var oldLoaded = perFileProgress[id] ? perFileProgress[id].loaded : 0,
                oldTotal = perFileProgress[id] ? perFileProgress[id].total : 0;

            if (newLoaded === -1 && newTotal === -1) {
                totalLoaded -= oldLoaded;
                totalSize -= oldTotal;
            }
            else {
                if (newLoaded) {
                    totalLoaded += newLoaded - oldLoaded;
                }
                if (newTotal) {
                    totalSize += newTotal - oldTotal;
                }
            }

            callbackProxy(totalLoaded, totalSize);
        };

    qq.extend(this, {
        // Called when a batch of files has completed uploading.
        onAllComplete: onAllComplete,

        // Called when the status of a file has changed.
        onStatusChange: function(id, oldStatus, newStatus) {
            if (newStatus === qq.status.CANCELED || newStatus === qq.status.REJECTED) {
                onCancel(id);
            }
            else if (newStatus === qq.status.SUBMITTING) {
                onNew(id);
            }
        },

        // Called whenever the upload progress of an individual file has changed.
        onIndividualProgress: function(id, loaded, total) {
            updateTotalProgress(id, loaded, total);
            perFileProgress[id] = {loaded: loaded, total: total};
        },

        // Called whenever the total size of a file has changed, such as when the size of a generated blob is known.
        onNewSize: function(id) {
            onNew(id);
        },

        reset: function() {
            perFileProgress = {};
            totalLoaded = 0;
            totalSize = 0;
        }
    });
};
