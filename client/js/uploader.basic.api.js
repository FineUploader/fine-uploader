/*globals qq*/
/**
 * Defines the public API for FineUploaderBasic mode.
 */
(function() {
    "use strict";

    qq.basePublicApi = {
        // DEPRECATED - TODO REMOVE IN NEXT MAJOR RELEASE (replaced by addFiles)
        addBlobs: function(blobDataOrArray, params, endpoint) {
            this.addFiles(blobDataOrArray, params, endpoint);
        },

        addInitialFiles: function(cannedFileList) {
            var self = this;

            qq.each(cannedFileList, function(index, cannedFile) {
                self._addCannedFile(cannedFile);
            });
        },

        addFiles: function(data, params, endpoint) {
            this._maybeHandleIos8SafariWorkaround();

            var batchId = this._storedIds.length === 0 ? qq.getUniqueId() : this._currentBatchId,

                processBlob = qq.bind(function(blob) {
                    this._handleNewFile({
                        blob: blob,
                        name: this._options.blobs.defaultName
                    }, batchId, verifiedFiles);
                }, this),

                processBlobData = qq.bind(function(blobData) {
                    this._handleNewFile(blobData, batchId, verifiedFiles);
                }, this),

                processCanvas = qq.bind(function(canvas) {
                    var blob = qq.canvasToBlob(canvas);

                    this._handleNewFile({
                        blob: blob,
                        name: this._options.blobs.defaultName + ".png"
                    }, batchId, verifiedFiles);
                }, this),

                processCanvasData = qq.bind(function(canvasData) {
                    var normalizedQuality = canvasData.quality && canvasData.quality / 100,
                        blob = qq.canvasToBlob(canvasData.canvas, canvasData.type, normalizedQuality);

                    this._handleNewFile({
                        blob: blob,
                        name: canvasData.name
                    }, batchId, verifiedFiles);
                }, this),

                processFileOrInput = qq.bind(function(fileOrInput) {
                    if (qq.isInput(fileOrInput) && qq.supportedFeatures.ajaxUploading) {
                        var files = Array.prototype.slice.call(fileOrInput.files),
                            self = this;

                        qq.each(files, function(idx, file) {
                            self._handleNewFile(file, batchId, verifiedFiles);
                        });
                    }
                    else {
                        this._handleNewFile(fileOrInput, batchId, verifiedFiles);
                    }
                }, this),

                normalizeData = function() {
                    if (qq.isFileList(data)) {
                        data = Array.prototype.slice.call(data);
                    }
                    data = [].concat(data);
                },

                self = this,
                verifiedFiles = [];

            this._currentBatchId = batchId;

            if (data) {
                normalizeData();

                qq.each(data, function(idx, fileContainer) {
                    if (qq.isFileOrInput(fileContainer)) {
                        processFileOrInput(fileContainer);
                    }
                    else if (qq.isBlob(fileContainer)) {
                        processBlob(fileContainer);
                    }
                    else if (qq.isObject(fileContainer)) {
                        if (fileContainer.blob && fileContainer.name) {
                            processBlobData(fileContainer);
                        }
                        else if (fileContainer.canvas && fileContainer.name) {
                            processCanvasData(fileContainer);
                        }
                    }
                    else if (fileContainer.tagName && fileContainer.tagName.toLowerCase() === "canvas") {
                        processCanvas(fileContainer);
                    }
                    else {
                        self.log(fileContainer + " is not a valid file container!  Ignoring!", "warn");
                    }
                });

                this.log("Received " + verifiedFiles.length + " files.");
                this._prepareItemsForUpload(verifiedFiles, params, endpoint);
            }
        },

        cancel: function(id) {
            this._handler.cancel(id);
        },

        cancelAll: function() {
            var storedIdsCopy = [],
                self = this;

            qq.extend(storedIdsCopy, this._storedIds);
            qq.each(storedIdsCopy, function(idx, storedFileId) {
                self.cancel(storedFileId);
            });

            this._handler.cancelAll();
        },

        clearStoredFiles: function() {
            this._storedIds = [];
        },

        continueUpload: function(id) {
            var uploadData = this._uploadData.retrieve({id: id});

            if (!qq.supportedFeatures.pause || !this._options.chunking.enabled) {
                return false;
            }

            if (uploadData.status === qq.status.PAUSED) {
                this.log(qq.format("Paused file ID {} ({}) will be continued.  Not paused.", id, this.getName(id)));
                this._uploadFile(id);
                return true;
            }
            else {
                this.log(qq.format("Ignoring continue for file ID {} ({}).  Not paused.", id, this.getName(id)), "error");
            }

            return false;
        },

        deleteFile: function(id) {
            return this._onSubmitDelete(id);
        },

        // TODO document?
        doesExist: function(fileOrBlobId) {
            return this._handler.isValid(fileOrBlobId);
        },

        // Generate a variable size thumbnail on an img or canvas,
        // returning a promise that is fulfilled when the attempt completes.
        // Thumbnail can either be based off of a URL for an image returned
        // by the server in the upload response, or the associated `Blob`.
        drawThumbnail: function(fileId, imgOrCanvas, maxSize, fromServer, customResizeFunction) {
            var promiseToReturn = new qq.Promise(),
                fileOrUrl, options;

            if (this._imageGenerator) {
                fileOrUrl = this._thumbnailUrls[fileId];
                options = {
                    customResizeFunction: customResizeFunction,
                    maxSize: maxSize > 0 ? maxSize : null,
                    scale: maxSize > 0
                };

                // If client-side preview generation is possible
                // and we are not specifically looking for the image URl returned by the server...
                if (!fromServer && qq.supportedFeatures.imagePreviews) {
                    fileOrUrl = this.getFile(fileId);
                }

                /* jshint eqeqeq:false,eqnull:true */
                if (fileOrUrl == null) {
                    promiseToReturn.failure({container: imgOrCanvas, error: "File or URL not found."});
                }
                else {
                    this._imageGenerator.generate(fileOrUrl, imgOrCanvas, options).then(
                        function success(modifiedContainer) {
                            promiseToReturn.success(modifiedContainer);
                        },

                        function failure(container, reason) {
                            promiseToReturn.failure({container: container, error: reason || "Problem generating thumbnail"});
                        }
                    );
                }
            }
            else {
                promiseToReturn.failure({container: imgOrCanvas, error: "Missing image generator module"});
            }

            return promiseToReturn;
        },

        getButton: function(fileId) {
            return this._getButton(this._buttonIdsForFileIds[fileId]);
        },

        getEndpoint: function(fileId) {
            return this._endpointStore.get(fileId);
        },

        getFile: function(fileOrBlobId) {
            return this._handler.getFile(fileOrBlobId) || null;
        },

        getInProgress: function() {
            return this._uploadData.retrieve({
                status: [
                    qq.status.UPLOADING,
                    qq.status.UPLOAD_RETRYING,
                    qq.status.QUEUED
                ]
            }).length;
        },

        getName: function(id) {
            return this._uploadData.retrieve({id: id}).name;
        },

        // Parent ID for a specific file, or null if this is the parent, or if it has no parent.
        getParentId: function(id) {
            var uploadDataEntry = this.getUploads({id: id}),
                parentId = null;

            if (uploadDataEntry) {
                if (uploadDataEntry.parentId !== undefined) {
                    parentId = uploadDataEntry.parentId;
                }
            }

            return parentId;
        },

        getResumableFilesData: function() {
            return this._handler.getResumableFilesData();
        },

        getSize: function(id) {
            return this._uploadData.retrieve({id: id}).size;
        },

        getNetUploads: function() {
            return this._netUploaded;
        },

        getRemainingAllowedItems: function() {
            var allowedItems = this._currentItemLimit;

            if (allowedItems > 0) {
                return allowedItems - this._netUploadedOrQueued;
            }

            return null;
        },

        getUploads: function(optionalFilter) {
            return this._uploadData.retrieve(optionalFilter);
        },

        getUuid: function(id) {
            return this._uploadData.retrieve({id: id}).uuid;
        },

        log: function(str, level) {
            if (this._options.debug && (!level || level === "info")) {
                qq.log("[Fine Uploader " + qq.version + "] " + str);
            }
            else if (level && level !== "info") {
                qq.log("[Fine Uploader " + qq.version + "] " + str, level);

            }
        },

        pauseUpload: function(id) {
            var uploadData = this._uploadData.retrieve({id: id});

            if (!qq.supportedFeatures.pause || !this._options.chunking.enabled) {
                return false;
            }

            // Pause only really makes sense if the file is uploading or retrying
            if (qq.indexOf([qq.status.UPLOADING, qq.status.UPLOAD_RETRYING], uploadData.status) >= 0) {
                if (this._handler.pause(id)) {
                    this._uploadData.setStatus(id, qq.status.PAUSED);
                    return true;
                }
                else {
                    this.log(qq.format("Unable to pause file ID {} ({}).", id, this.getName(id)), "error");
                }
            }
            else {
                this.log(qq.format("Ignoring pause for file ID {} ({}).  Not in progress.", id, this.getName(id)), "error");
            }

            return false;
        },

        reset: function() {
            this.log("Resetting uploader...");

            this._handler.reset();
            this._storedIds = [];
            this._autoRetries = [];
            this._retryTimeouts = [];
            this._preventRetries = [];
            this._thumbnailUrls = [];

            qq.each(this._buttons, function(idx, button) {
                button.reset();
            });

            this._paramsStore.reset();
            this._endpointStore.reset();
            this._netUploadedOrQueued = 0;
            this._netUploaded = 0;
            this._uploadData.reset();
            this._buttonIdsForFileIds = [];

            this._pasteHandler && this._pasteHandler.reset();
            this._options.session.refreshOnReset && this._refreshSessionData();

            this._succeededSinceLastAllComplete = [];
            this._failedSinceLastAllComplete = [];

            this._totalProgress && this._totalProgress.reset();
        },

        retry: function(id) {
            return this._manualRetry(id);
        },

        scaleImage: function(id, specs) {
            var self = this;

            return qq.Scaler.prototype.scaleImage(id, specs, {
                log: qq.bind(self.log, self),
                getFile: qq.bind(self.getFile, self),
                uploadData: self._uploadData
            });
        },

        setCustomHeaders: function(headers, id) {
            this._customHeadersStore.set(headers, id);
        },

        setDeleteFileCustomHeaders: function(headers, id) {
            this._deleteFileCustomHeadersStore.set(headers, id);
        },

        setDeleteFileEndpoint: function(endpoint, id) {
            this._deleteFileEndpointStore.set(endpoint, id);
        },

        setDeleteFileParams: function(params, id) {
            this._deleteFileParamsStore.set(params, id);
        },

        // Re-sets the default endpoint, an endpoint for a specific file, or an endpoint for a specific button
        setEndpoint: function(endpoint, id) {
            this._endpointStore.set(endpoint, id);
        },

        setForm: function(elementOrId) {
            this._updateFormSupportAndParams(elementOrId);
        },

        setItemLimit: function(newItemLimit) {
            this._currentItemLimit = newItemLimit;
        },

        setName: function(id, newName) {
            this._uploadData.updateName(id, newName);
        },

        setParams: function(params, id) {
            this._paramsStore.set(params, id);
        },

        setUuid: function(id, newUuid) {
            return this._uploadData.uuidChanged(id, newUuid);
        },

        uploadStoredFiles: function() {
            if (this._storedIds.length === 0) {
                this._itemError("noFilesError");
            }
            else {
                this._uploadStoredFiles();
            }
        }
    };

    /**
     * Defines the private (internal) API for FineUploaderBasic mode.
     */
    qq.basePrivateApi = {
        // Updates internal state with a file record (not backed by a live file).  Returns the assigned ID.
        _addCannedFile: function(sessionData) {
            var id = this._uploadData.addFile({
                uuid: sessionData.uuid,
                name: sessionData.name,
                size: sessionData.size,
                status: qq.status.UPLOAD_SUCCESSFUL
            });

            sessionData.deleteFileEndpoint && this.setDeleteFileEndpoint(sessionData.deleteFileEndpoint, id);
            sessionData.deleteFileParams && this.setDeleteFileParams(sessionData.deleteFileParams, id);

            if (sessionData.thumbnailUrl) {
                this._thumbnailUrls[id] = sessionData.thumbnailUrl;
            }

            this._netUploaded++;
            this._netUploadedOrQueued++;

            return id;
        },

        _annotateWithButtonId: function(file, associatedInput) {
            if (qq.isFile(file)) {
                file.qqButtonId = this._getButtonId(associatedInput);
            }
        },

        _batchError: function(message) {
            this._options.callbacks.onError(null, null, message, undefined);
        },

        _createDeleteHandler: function() {
            var self = this;

            return new qq.DeleteFileAjaxRequester({
                method: this._options.deleteFile.method.toUpperCase(),
                maxConnections: this._options.maxConnections,
                uuidParamName: this._options.request.uuidName,
                customHeaders: this._deleteFileCustomHeadersStore,
                paramsStore: this._deleteFileParamsStore,
                endpointStore: this._deleteFileEndpointStore,
                cors: this._options.cors,
                log: qq.bind(self.log, self),
                onDelete: function(id) {
                    self._onDelete(id);
                    self._options.callbacks.onDelete(id);
                },
                onDeleteComplete: function(id, xhrOrXdr, isError) {
                    self._onDeleteComplete(id, xhrOrXdr, isError);
                    self._options.callbacks.onDeleteComplete(id, xhrOrXdr, isError);
                }

            });
        },

        _createPasteHandler: function() {
            var self = this;

            return new qq.PasteSupport({
                targetElement: this._options.paste.targetElement,
                callbacks: {
                    log: qq.bind(self.log, self),
                    pasteReceived: function(blob) {
                        self._handleCheckedCallback({
                            name: "onPasteReceived",
                            callback: qq.bind(self._options.callbacks.onPasteReceived, self, blob),
                            onSuccess: qq.bind(self._handlePasteSuccess, self, blob),
                            identifier: "pasted image"
                        });
                    }
                }
            });
        },

        _createStore: function(initialValue, _readOnlyValues_) {
            var store = {},
                catchall = initialValue,
                perIdReadOnlyValues = {},
                readOnlyValues = _readOnlyValues_,
                copy = function(orig) {
                    if (qq.isObject(orig)) {
                        return qq.extend({}, orig);
                    }
                    return orig;
                },
                getReadOnlyValues = function() {
                    if (qq.isFunction(readOnlyValues)) {
                        return readOnlyValues();
                    }
                    return readOnlyValues;
                },
                includeReadOnlyValues = function(id, existing) {
                    if (readOnlyValues && qq.isObject(existing)) {
                        qq.extend(existing, getReadOnlyValues());
                    }

                    if (perIdReadOnlyValues[id]) {
                        qq.extend(existing, perIdReadOnlyValues[id]);
                    }
                };

            return {
                set: function(val, id) {
                    /*jshint eqeqeq: true, eqnull: true*/
                    if (id == null) {
                        store = {};
                        catchall = copy(val);
                    }
                    else {
                        store[id] = copy(val);
                    }
                },

                get: function(id) {
                    var values;

                    /*jshint eqeqeq: true, eqnull: true*/
                    if (id != null && store[id]) {
                        values = store[id];
                    }
                    else {
                        values = copy(catchall);
                    }

                    includeReadOnlyValues(id, values);

                    return copy(values);
                },

                addReadOnly: function(id, values) {
                    // Only applicable to Object stores
                    if (qq.isObject(store)) {
                        // If null ID, apply readonly values to all files
                        if (id === null) {
                            if (qq.isFunction(values)) {
                                readOnlyValues = values;
                            }
                            else {
                                readOnlyValues = readOnlyValues || {};
                                qq.extend(readOnlyValues, values);
                            }
                        }
                        else {
                            perIdReadOnlyValues[id] = perIdReadOnlyValues[id] || {};
                            qq.extend(perIdReadOnlyValues[id], values);
                        }
                    }
                },

                remove: function(fileId) {
                    return delete store[fileId];
                },

                reset: function() {
                    store = {};
                    perIdReadOnlyValues = {};
                    catchall = initialValue;
                }
            };
        },

        _createUploadDataTracker: function() {
            var self = this;

            return new qq.UploadData({
                getName: function(id) {
                    return self.getName(id);
                },
                getUuid: function(id) {
                    return self.getUuid(id);
                },
                getSize: function(id) {
                    return self.getSize(id);
                },
                onStatusChange: function(id, oldStatus, newStatus) {
                    self._onUploadStatusChange(id, oldStatus, newStatus);
                    self._options.callbacks.onStatusChange(id, oldStatus, newStatus);
                    self._maybeAllComplete(id, newStatus);

                    if (self._totalProgress) {
                        setTimeout(function() {
                            self._totalProgress.onStatusChange(id, oldStatus, newStatus);
                        }, 0);
                    }
                }
            });
        },

        /**
         * Generate a tracked upload button.
         *
         * @param spec Object containing a required `element` property
         * along with optional `multiple`, `accept`, and `folders`.
         * @returns {qq.UploadButton}
         * @private
         */
        _createUploadButton: function(spec) {
            var self = this,
                acceptFiles = spec.accept || this._options.validation.acceptFiles,
                allowedExtensions = spec.allowedExtensions || this._options.validation.allowedExtensions,
                button;

            function allowMultiple() {
                if (qq.supportedFeatures.ajaxUploading) {
                    // Workaround for bug in iOS7+ (see #1039)
                    if (self._options.workarounds.iosEmptyVideos &&
                        qq.ios() &&
                        !qq.ios6() &&
                        self._isAllowedExtension(allowedExtensions, ".mov")) {

                        return false;
                    }

                    if (spec.multiple === undefined) {
                        return self._options.multiple;
                    }

                    return spec.multiple;
                }

                return false;
            }

            button = new qq.UploadButton({
                acceptFiles: acceptFiles,
                element: spec.element,
                focusClass: this._options.classes.buttonFocus,
                folders: spec.folders,
                hoverClass: this._options.classes.buttonHover,
                ios8BrowserCrashWorkaround: this._options.workarounds.ios8BrowserCrash,
                multiple: allowMultiple(),
                name: this._options.request.inputName,
                onChange: function(input) {
                    self._onInputChange(input);
                },
                title: spec.title == null ? this._options.text.fileInputTitle : spec.title
            });

            this._disposeSupport.addDisposer(function() {
                button.dispose();
            });

            self._buttons.push(button);

            return button;
        },

        _createUploadHandler: function(additionalOptions, namespace) {
            var self = this,
                lastOnProgress = {},
                options = {
                    debug: this._options.debug,
                    maxConnections: this._options.maxConnections,
                    cors: this._options.cors,
                    paramsStore: this._paramsStore,
                    endpointStore: this._endpointStore,
                    chunking: this._options.chunking,
                    resume: this._options.resume,
                    blobs: this._options.blobs,
                    log: qq.bind(self.log, self),
                    preventRetryParam: this._options.retry.preventRetryResponseProperty,
                    onProgress: function(id, name, loaded, total) {
                        if (loaded < 0 || total < 0) {
                            return;
                        }

                        if (lastOnProgress[id]) {
                            if (lastOnProgress[id].loaded !== loaded || lastOnProgress[id].total !== total) {
                                self._onProgress(id, name, loaded, total);
                                self._options.callbacks.onProgress(id, name, loaded, total);
                            }
                        }
                        else {
                            self._onProgress(id, name, loaded, total);
                            self._options.callbacks.onProgress(id, name, loaded, total);
                        }

                        lastOnProgress[id] = {loaded: loaded, total: total};

                    },
                    onComplete: function(id, name, result, xhr) {
                        delete lastOnProgress[id];

                        var status = self.getUploads({id: id}).status,
                            retVal;

                        // This is to deal with some observed cases where the XHR readyStateChange handler is
                        // invoked by the browser multiple times for the same XHR instance with the same state
                        // readyState value.  Higher level: don't invoke complete-related code if we've already
                        // done this.
                        if (status === qq.status.UPLOAD_SUCCESSFUL || status === qq.status.UPLOAD_FAILED) {
                            return;
                        }

                        retVal = self._onComplete(id, name, result, xhr);

                        // If the internal `_onComplete` handler returns a promise, don't invoke the `onComplete` callback
                        // until the promise has been fulfilled.
                        if (retVal instanceof  qq.Promise) {
                            retVal.done(function() {
                                self._options.callbacks.onComplete(id, name, result, xhr);
                            });
                        }
                        else {
                            self._options.callbacks.onComplete(id, name, result, xhr);
                        }
                    },
                    onCancel: function(id, name, cancelFinalizationEffort) {
                        var promise = new qq.Promise();

                        self._handleCheckedCallback({
                            name: "onCancel",
                            callback: qq.bind(self._options.callbacks.onCancel, self, id, name),
                            onFailure: promise.failure,
                            onSuccess: function() {
                                cancelFinalizationEffort.then(function() {
                                    self._onCancel(id, name);
                                });

                                promise.success();
                            },
                            identifier: id
                        });

                        return promise;
                    },
                    onUploadPrep: qq.bind(this._onUploadPrep, this),
                    onUpload: function(id, name) {
                        self._onUpload(id, name);
                        self._options.callbacks.onUpload(id, name);
                    },
                    onUploadChunk: function(id, name, chunkData) {
                        self._onUploadChunk(id, chunkData);
                        self._options.callbacks.onUploadChunk(id, name, chunkData);
                    },
                    onUploadChunkSuccess: function(id, chunkData, result, xhr) {
                        self._options.callbacks.onUploadChunkSuccess.apply(self, arguments);
                    },
                    onResume: function(id, name, chunkData) {
                        return self._options.callbacks.onResume(id, name, chunkData);
                    },
                    onAutoRetry: function(id, name, responseJSON, xhr) {
                        return self._onAutoRetry.apply(self, arguments);
                    },
                    onUuidChanged: function(id, newUuid) {
                        self.log("Server requested UUID change from '" + self.getUuid(id) + "' to '" + newUuid + "'");
                        self.setUuid(id, newUuid);
                    },
                    getName: qq.bind(self.getName, self),
                    getUuid: qq.bind(self.getUuid, self),
                    getSize: qq.bind(self.getSize, self),
                    setSize: qq.bind(self._setSize, self),
                    getDataByUuid: function(uuid) {
                        return self.getUploads({uuid: uuid});
                    },
                    isQueued: function(id) {
                        var status = self.getUploads({id: id}).status;
                        return status === qq.status.QUEUED ||
                            status === qq.status.SUBMITTED ||
                            status === qq.status.UPLOAD_RETRYING ||
                            status === qq.status.PAUSED;
                    },
                    getIdsInProxyGroup: self._uploadData.getIdsInProxyGroup,
                    getIdsInBatch: self._uploadData.getIdsInBatch
                };

            qq.each(this._options.request, function(prop, val) {
                options[prop] = val;
            });

            options.customHeaders = this._customHeadersStore;

            if (additionalOptions) {
                qq.each(additionalOptions, function(key, val) {
                    options[key] = val;
                });
            }

            return new qq.UploadHandlerController(options, namespace);
        },

        _fileOrBlobRejected: function(id) {
            this._netUploadedOrQueued--;
            this._uploadData.setStatus(id, qq.status.REJECTED);
        },

        _formatSize: function(bytes) {
            var i = -1;
            do {
                bytes = bytes / 1000;
                i++;
            } while (bytes > 999);

            return Math.max(bytes, 0.1).toFixed(1) + this._options.text.sizeSymbols[i];
        },

        // Creates an internal object that tracks various properties of each extra button,
        // and then actually creates the extra button.
        _generateExtraButtonSpecs: function() {
            var self = this;

            this._extraButtonSpecs = {};

            qq.each(this._options.extraButtons, function(idx, extraButtonOptionEntry) {
                var multiple = extraButtonOptionEntry.multiple,
                    validation = qq.extend({}, self._options.validation, true),
                    extraButtonSpec = qq.extend({}, extraButtonOptionEntry);

                if (multiple === undefined) {
                    multiple = self._options.multiple;
                }

                if (extraButtonSpec.validation) {
                    qq.extend(validation, extraButtonOptionEntry.validation, true);
                }

                qq.extend(extraButtonSpec, {
                    multiple: multiple,
                    validation: validation
                }, true);

                self._initExtraButton(extraButtonSpec);
            });
        },

        _getButton: function(buttonId) {
            var extraButtonsSpec = this._extraButtonSpecs[buttonId];

            if (extraButtonsSpec) {
                return extraButtonsSpec.element;
            }
            else if (buttonId === this._defaultButtonId) {
                return this._options.button;
            }
        },

        /**
         * Gets the internally used tracking ID for a button.
         *
         * @param buttonOrFileInputOrFile `File`, `<input type="file">`, or a button container element
         * @returns {*} The button's ID, or undefined if no ID is recoverable
         * @private
         */
        _getButtonId: function(buttonOrFileInputOrFile) {
            var inputs, fileInput,
                fileBlobOrInput = buttonOrFileInputOrFile;

            // We want the reference file/blob here if this is a proxy (a file that will be generated on-demand later)
            if (fileBlobOrInput instanceof qq.BlobProxy) {
                fileBlobOrInput = fileBlobOrInput.referenceBlob;
            }

            // If the item is a `Blob` it will never be associated with a button or drop zone.
            if (fileBlobOrInput && !qq.isBlob(fileBlobOrInput)) {
                if (qq.isFile(fileBlobOrInput)) {
                    return fileBlobOrInput.qqButtonId;
                }
                else if (fileBlobOrInput.tagName.toLowerCase() === "input" &&
                    fileBlobOrInput.type.toLowerCase() === "file") {

                    return fileBlobOrInput.getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME);
                }

                inputs = fileBlobOrInput.getElementsByTagName("input");

                qq.each(inputs, function(idx, input) {
                    if (input.getAttribute("type") === "file") {
                        fileInput = input;
                        return false;
                    }
                });

                if (fileInput) {
                    return fileInput.getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME);
                }
            }
        },

        _getNotFinished: function() {
            return this._uploadData.retrieve({
                status: [
                    qq.status.UPLOADING,
                    qq.status.UPLOAD_RETRYING,
                    qq.status.QUEUED,
                    qq.status.SUBMITTING,
                    qq.status.SUBMITTED,
                    qq.status.PAUSED
                ]
            }).length;
        },

        // Get the validation options for this button.  Could be the default validation option
        // or a specific one assigned to this particular button.
        _getValidationBase: function(buttonId) {
            var extraButtonSpec = this._extraButtonSpecs[buttonId];

            return extraButtonSpec ? extraButtonSpec.validation : this._options.validation;
        },

        _getValidationDescriptor: function(fileWrapper) {
            if (fileWrapper.file instanceof qq.BlobProxy) {
                return {
                    name: qq.getFilename(fileWrapper.file.referenceBlob),
                    size: fileWrapper.file.referenceBlob.size
                };
            }

            return {
                name: this.getUploads({id: fileWrapper.id}).name,
                size: this.getUploads({id: fileWrapper.id}).size
            };
        },

        _getValidationDescriptors: function(fileWrappers) {
            var self = this,
                fileDescriptors = [];

            qq.each(fileWrappers, function(idx, fileWrapper) {
                fileDescriptors.push(self._getValidationDescriptor(fileWrapper));
            });

            return fileDescriptors;
        },

        // Allows camera access on either the default or an extra button for iOS devices.
        _handleCameraAccess: function() {
            if (this._options.camera.ios && qq.ios()) {
                var acceptIosCamera = "image/*;capture=camera",
                    button = this._options.camera.button,
                    buttonId = button ? this._getButtonId(button) : this._defaultButtonId,
                    optionRoot = this._options;

                // If we are not targeting the default button, it is an "extra" button
                if (buttonId && buttonId !== this._defaultButtonId) {
                    optionRoot = this._extraButtonSpecs[buttonId];
                }

                // Camera access won't work in iOS if the `multiple` attribute is present on the file input
                optionRoot.multiple = false;

                // update the options
                if (optionRoot.validation.acceptFiles === null) {
                    optionRoot.validation.acceptFiles = acceptIosCamera;
                }
                else {
                    optionRoot.validation.acceptFiles += "," + acceptIosCamera;
                }

                // update the already-created button
                qq.each(this._buttons, function(idx, button) {
                    if (button.getButtonId() === buttonId) {
                        button.setMultiple(optionRoot.multiple);
                        button.setAcceptFiles(optionRoot.acceptFiles);

                        return false;
                    }
                });
            }
        },

        _handleCheckedCallback: function(details) {
            var self = this,
                callbackRetVal = details.callback();

            if (qq.isGenericPromise(callbackRetVal)) {
                this.log(details.name + " - waiting for " + details.name + " promise to be fulfilled for " + details.identifier);
                return callbackRetVal.then(
                    function(successParam) {
                        self.log(details.name + " promise success for " + details.identifier);
                        details.onSuccess(successParam);
                    },
                    function() {
                        if (details.onFailure) {
                            self.log(details.name + " promise failure for " + details.identifier);
                            details.onFailure();
                        }
                        else {
                            self.log(details.name + " promise failure for " + details.identifier);
                        }
                    });
            }

            if (callbackRetVal !== false) {
                details.onSuccess(callbackRetVal);
            }
            else {
                if (details.onFailure) {
                    this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Invoking failure callback.");
                    details.onFailure();
                }
                else {
                    this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Will not proceed.");
                }
            }

            return callbackRetVal;
        },

        // Updates internal state when a new file has been received, and adds it along with its ID to a passed array.
        _handleNewFile: function(file, batchId, newFileWrapperList) {
            var self = this,
                uuid = qq.getUniqueId(),
                size = -1,
                name = qq.getFilename(file),
                actualFile = file.blob || file,
                handler = this._customNewFileHandler ?
                    this._customNewFileHandler :
                    qq.bind(self._handleNewFileGeneric, self);

            if (!qq.isInput(actualFile) && actualFile.size >= 0) {
                size = actualFile.size;
            }

            handler(actualFile, name, uuid, size, newFileWrapperList, batchId, this._options.request.uuidName, {
                uploadData: self._uploadData,
                paramsStore: self._paramsStore,
                addFileToHandler: function(id, file) {
                    self._handler.add(id, file);
                    self._netUploadedOrQueued++;
                    self._trackButton(id);
                }
            });
        },

        _handleNewFileGeneric: function(file, name, uuid, size, fileList, batchId) {
            var id = this._uploadData.addFile({uuid: uuid, name: name, size: size, batchId: batchId});

            this._handler.add(id, file);
            this._trackButton(id);

            this._netUploadedOrQueued++;

            fileList.push({id: id, file: file});
        },

        _handlePasteSuccess: function(blob, extSuppliedName) {
            var extension = blob.type.split("/")[1],
                name = extSuppliedName;

            /*jshint eqeqeq: true, eqnull: true*/
            if (name == null) {
                name = this._options.paste.defaultName;
            }

            name += "." + extension;

            this.addFiles({
                name: name,
                blob: blob
            });
        },

        // Creates an extra button element
        _initExtraButton: function(spec) {
            var button = this._createUploadButton({
                accept: spec.validation.acceptFiles,
                allowedExtensions: spec.validation.allowedExtensions,
                element: spec.element,
                folders: spec.folders,
                multiple: spec.multiple,
                title: spec.fileInputTitle
            });

            this._extraButtonSpecs[button.getButtonId()] = spec;
        },

        _initFormSupportAndParams: function() {
            this._formSupport = qq.FormSupport && new qq.FormSupport(
                this._options.form, qq.bind(this.uploadStoredFiles, this), qq.bind(this.log, this)
            );

            if (this._formSupport && this._formSupport.attachedToForm) {
                this._paramsStore = this._createStore(
                    this._options.request.params,  this._formSupport.getFormInputsAsObject
                );

                this._options.autoUpload = this._formSupport.newAutoUpload;
                if (this._formSupport.newEndpoint) {
                    this._options.request.endpoint = this._formSupport.newEndpoint;
                }
            }
            else {
                this._paramsStore = this._createStore(this._options.request.params);
            }
        },

        _isDeletePossible: function() {
            if (!qq.DeleteFileAjaxRequester || !this._options.deleteFile.enabled) {
                return false;
            }

            if (this._options.cors.expected) {
                if (qq.supportedFeatures.deleteFileCorsXhr) {
                    return true;
                }

                if (qq.supportedFeatures.deleteFileCorsXdr && this._options.cors.allowXdr) {
                    return true;
                }

                return false;
            }

            return true;
        },

        _isAllowedExtension: function(allowed, fileName) {
            var valid = false;

            if (!allowed.length) {
                return true;
            }

            qq.each(allowed, function(idx, allowedExt) {
                /**
                 * If an argument is not a string, ignore it.  Added when a possible issue with MooTools hijacking the
                 * `allowedExtensions` array was discovered.  See case #735 in the issue tracker for more details.
                 */
                if (qq.isString(allowedExt)) {
                    /*jshint eqeqeq: true, eqnull: true*/
                    var extRegex = new RegExp("\\." + allowedExt + "$", "i");

                    if (fileName.match(extRegex) != null) {
                        valid = true;
                        return false;
                    }
                }
            });

            return valid;
        },

        /**
         * Constructs and returns a message that describes an item/file error.  Also calls `onError` callback.
         *
         * @param code REQUIRED - a code that corresponds to a stock message describing this type of error
         * @param maybeNameOrNames names of the items that have failed, if applicable
         * @param item `File`, `Blob`, or `<input type="file">`
         * @private
         */
        _itemError: function(code, maybeNameOrNames, item) {
            var message = this._options.messages[code],
                allowedExtensions = [],
                names = [].concat(maybeNameOrNames),
                name = names[0],
                buttonId = this._getButtonId(item),
                validationBase = this._getValidationBase(buttonId),
                extensionsForMessage, placeholderMatch;

            function r(name, replacement) { message = message.replace(name, replacement); }

            qq.each(validationBase.allowedExtensions, function(idx, allowedExtension) {
                /**
                 * If an argument is not a string, ignore it.  Added when a possible issue with MooTools hijacking the
                 * `allowedExtensions` array was discovered.  See case #735 in the issue tracker for more details.
                 */
                if (qq.isString(allowedExtension)) {
                    allowedExtensions.push(allowedExtension);
                }
            });

            extensionsForMessage = allowedExtensions.join(", ").toLowerCase();

            r("{file}", this._options.formatFileName(name));
            r("{extensions}", extensionsForMessage);
            r("{sizeLimit}", this._formatSize(validationBase.sizeLimit));
            r("{minSizeLimit}", this._formatSize(validationBase.minSizeLimit));

            placeholderMatch = message.match(/(\{\w+\})/g);
            if (placeholderMatch !== null) {
                qq.each(placeholderMatch, function(idx, placeholder) {
                    r(placeholder, names[idx]);
                });
            }

            this._options.callbacks.onError(null, name, message, undefined);

            return message;
        },

        /**
         * Conditionally orders a manual retry of a failed upload.
         *
         * @param id File ID of the failed upload
         * @param callback Optional callback to invoke if a retry is prudent.
         * In lieu of asking the upload handler to retry.
         * @returns {boolean} true if a manual retry will occur
         * @private
         */
        _manualRetry: function(id, callback) {
            if (this._onBeforeManualRetry(id)) {
                this._netUploadedOrQueued++;
                this._uploadData.setStatus(id, qq.status.UPLOAD_RETRYING);

                if (callback) {
                    callback(id);
                }
                else {
                    this._handler.retry(id);
                }

                return true;
            }
        },

        _maybeAllComplete: function(id, status) {
            var self = this,
                notFinished = this._getNotFinished();

            if (status === qq.status.UPLOAD_SUCCESSFUL) {
                this._succeededSinceLastAllComplete.push(id);
            }
            else if (status === qq.status.UPLOAD_FAILED) {
                this._failedSinceLastAllComplete.push(id);
            }

            if (notFinished === 0 &&
                (this._succeededSinceLastAllComplete.length || this._failedSinceLastAllComplete.length)) {
                // Attempt to ensure onAllComplete is not invoked before other callbacks, such as onCancel & onComplete
                setTimeout(function() {
                    self._onAllComplete(self._succeededSinceLastAllComplete, self._failedSinceLastAllComplete);
                }, 0);
            }
        },

        _maybeHandleIos8SafariWorkaround: function() {
            var self = this;

            if (this._options.workarounds.ios8SafariUploads && qq.ios800() && qq.iosSafari()) {
                setTimeout(function() {
                    window.alert(self._options.messages.unsupportedBrowserIos8Safari);
                }, 0);
                throw new qq.Error(this._options.messages.unsupportedBrowserIos8Safari);
            }
        },

        _maybeParseAndSendUploadError: function(id, name, response, xhr) {
            // Assuming no one will actually set the response code to something other than 200
            // and still set 'success' to true...
            if (!response.success) {
                if (xhr && xhr.status !== 200 && !response.error) {
                    this._options.callbacks.onError(id, name, "XHR returned response code " + xhr.status, xhr);
                }
                else {
                    var errorReason = response.error ? response.error : this._options.text.defaultResponseError;
                    this._options.callbacks.onError(id, name, errorReason, xhr);
                }
            }
        },

        _maybeProcessNextItemAfterOnValidateCallback: function(validItem, items, index, params, endpoint) {
            var self = this;

            if (items.length > index) {
                if (validItem || !this._options.validation.stopOnFirstInvalidFile) {
                    //use setTimeout to prevent a stack overflow with a large number of files in the batch & non-promissory callbacks
                    setTimeout(function() {
                        var validationDescriptor = self._getValidationDescriptor(items[index]),
                            buttonId = self._getButtonId(items[index].file),
                            button = self._getButton(buttonId);

                        self._handleCheckedCallback({
                            name: "onValidate",
                            callback: qq.bind(self._options.callbacks.onValidate, self, validationDescriptor, button),
                            onSuccess: qq.bind(self._onValidateCallbackSuccess, self, items, index, params, endpoint),
                            onFailure: qq.bind(self._onValidateCallbackFailure, self, items, index, params, endpoint),
                            identifier: "Item '" + validationDescriptor.name + "', size: " + validationDescriptor.size
                        });
                    }, 0);
                }
                else if (!validItem) {
                    for (; index < items.length; index++) {
                        self._fileOrBlobRejected(items[index].id);
                    }
                }
            }
        },

        _onAllComplete: function(successful, failed) {
            this._totalProgress && this._totalProgress.onAllComplete(successful, failed, this._preventRetries);

            this._options.callbacks.onAllComplete(qq.extend([], successful), qq.extend([], failed));

            this._succeededSinceLastAllComplete = [];
            this._failedSinceLastAllComplete = [];
        },

        /**
         * Attempt to automatically retry a failed upload.
         *
         * @param id The file ID of the failed upload
         * @param name The name of the file associated with the failed upload
         * @param responseJSON Response from the server, parsed into a javascript object
         * @param xhr Ajax transport used to send the failed request
         * @param callback Optional callback to be invoked if a retry is prudent.
         * Invoked in lieu of asking the upload handler to retry.
         * @returns {boolean} true if an auto-retry will occur
         * @private
         */
        _onAutoRetry: function(id, name, responseJSON, xhr, callback) {
            var self = this;

            self._preventRetries[id] = responseJSON[self._options.retry.preventRetryResponseProperty];

            if (self._shouldAutoRetry(id, name, responseJSON)) {
                var retryWaitPeriod = self._options.retry.autoAttemptDelay * 1000;

                self._maybeParseAndSendUploadError.apply(self, arguments);
                self._options.callbacks.onAutoRetry(id, name, self._autoRetries[id]);
                self._onBeforeAutoRetry(id, name);

                self._uploadData.setStatus(id, qq.status.UPLOAD_RETRYING);
                self._retryTimeouts[id] = setTimeout(function() {
                    self.log("Starting retry for " + name + "...");

                    if (callback) {
                        callback(id);
                    }
                    else {
                        self._handler.retry(id);
                    }
                }, retryWaitPeriod);

                return true;
            }
        },

        _onBeforeAutoRetry: function(id, name) {
            this.log("Waiting " + this._options.retry.autoAttemptDelay + " seconds before retrying " + name + "...");
        },

        //return false if we should not attempt the requested retry
        _onBeforeManualRetry: function(id) {
            var itemLimit = this._currentItemLimit,
                fileName;

            if (this._preventRetries[id]) {
                this.log("Retries are forbidden for id " + id, "warn");
                return false;
            }
            else if (this._handler.isValid(id)) {
                fileName = this.getName(id);

                if (this._options.callbacks.onManualRetry(id, fileName) === false) {
                    return false;
                }

                if (itemLimit > 0 && this._netUploadedOrQueued + 1 > itemLimit) {
                    this._itemError("retryFailTooManyItems");
                    return false;
                }

                this.log("Retrying upload for '" + fileName + "' (id: " + id + ")...");
                return true;
            }
            else {
                this.log("'" + id + "' is not a valid file ID", "error");
                return false;
            }
        },

        _onCancel: function(id, name) {
            this._netUploadedOrQueued--;

            clearTimeout(this._retryTimeouts[id]);

            var storedItemIndex = qq.indexOf(this._storedIds, id);
            if (!this._options.autoUpload && storedItemIndex >= 0) {
                this._storedIds.splice(storedItemIndex, 1);
            }

            this._uploadData.setStatus(id, qq.status.CANCELED);
        },

        _onComplete: function(id, name, result, xhr) {
            if (!result.success) {
                this._netUploadedOrQueued--;
                this._uploadData.setStatus(id, qq.status.UPLOAD_FAILED);

                if (result[this._options.retry.preventRetryResponseProperty] === true) {
                    this._preventRetries[id] = true;
                }
            }
            else {
                if (result.thumbnailUrl) {
                    this._thumbnailUrls[id] = result.thumbnailUrl;
                }

                this._netUploaded++;
                this._uploadData.setStatus(id, qq.status.UPLOAD_SUCCESSFUL);
            }

            this._maybeParseAndSendUploadError(id, name, result, xhr);

            return result.success ? true : false;
        },

        _onDelete: function(id) {
            this._uploadData.setStatus(id, qq.status.DELETING);
        },

        _onDeleteComplete: function(id, xhrOrXdr, isError) {
            var name = this.getName(id);

            if (isError) {
                this._uploadData.setStatus(id, qq.status.DELETE_FAILED);
                this.log("Delete request for '" + name + "' has failed.", "error");

                // For error reporting, we only have access to the response status if this is not
                // an `XDomainRequest`.
                if (xhrOrXdr.withCredentials === undefined) {
                    this._options.callbacks.onError(id, name, "Delete request failed", xhrOrXdr);
                }
                else {
                    this._options.callbacks.onError(id, name, "Delete request failed with response code " + xhrOrXdr.status, xhrOrXdr);
                }
            }
            else {
                this._netUploadedOrQueued--;
                this._netUploaded--;
                this._handler.expunge(id);
                this._uploadData.setStatus(id, qq.status.DELETED);
                this.log("Delete request for '" + name + "' has succeeded.");
            }
        },

        _onInputChange: function(input) {
            var fileIndex;

            if (qq.supportedFeatures.ajaxUploading) {
                for (fileIndex = 0; fileIndex < input.files.length; fileIndex++) {
                    this._annotateWithButtonId(input.files[fileIndex], input);
                }

                this.addFiles(input.files);
            }
            // Android 2.3.x will fire `onchange` even if no file has been selected
            else if (input.value.length > 0) {
                this.addFiles(input);
            }

            qq.each(this._buttons, function(idx, button) {
                button.reset();
            });
        },

        _onProgress: function(id, name, loaded, total) {
            this._totalProgress && this._totalProgress.onIndividualProgress(id, loaded, total);
        },

        _onSubmit: function(id, name) {
            //nothing to do yet in core uploader
        },

        _onSubmitCallbackSuccess: function(id, name) {
            this._onSubmit.apply(this, arguments);
            this._uploadData.setStatus(id, qq.status.SUBMITTED);
            this._onSubmitted.apply(this, arguments);

            if (this._options.autoUpload) {
                this._options.callbacks.onSubmitted.apply(this, arguments);
                this._uploadFile(id);
            }
            else {
                this._storeForLater(id);
                this._options.callbacks.onSubmitted.apply(this, arguments);
            }
        },

        _onSubmitDelete: function(id, onSuccessCallback, additionalMandatedParams) {
            var uuid = this.getUuid(id),
                adjustedOnSuccessCallback;

            if (onSuccessCallback) {
                adjustedOnSuccessCallback = qq.bind(onSuccessCallback, this, id, uuid, additionalMandatedParams);
            }

            if (this._isDeletePossible()) {
                this._handleCheckedCallback({
                    name: "onSubmitDelete",
                    callback: qq.bind(this._options.callbacks.onSubmitDelete, this, id),
                    onSuccess: adjustedOnSuccessCallback ||
                        qq.bind(this._deleteHandler.sendDelete, this, id, uuid, additionalMandatedParams),
                    identifier: id
                });
                return true;
            }
            else {
                this.log("Delete request ignored for ID " + id + ", delete feature is disabled or request not possible " +
                    "due to CORS on a user agent that does not support pre-flighting.", "warn");
                return false;
            }
        },

        _onSubmitted: function(id) {
            //nothing to do in the base uploader
        },

        _onTotalProgress: function(loaded, total) {
            this._options.callbacks.onTotalProgress(loaded, total);
        },

        _onUploadPrep: function(id) {
            // nothing to do in the core uploader for now
        },

        _onUpload: function(id, name) {
            this._uploadData.setStatus(id, qq.status.UPLOADING);
        },

        _onUploadChunk: function(id, chunkData) {
            //nothing to do in the base uploader
        },

        _onUploadStatusChange: function(id, oldStatus, newStatus) {
            // Make sure a "queued" retry attempt is canceled if the upload has been paused
            if (newStatus === qq.status.PAUSED) {
                clearTimeout(this._retryTimeouts[id]);
            }
        },

        _onValidateBatchCallbackFailure: function(fileWrappers) {
            var self = this;

            qq.each(fileWrappers, function(idx, fileWrapper) {
                self._fileOrBlobRejected(fileWrapper.id);
            });
        },

        _onValidateBatchCallbackSuccess: function(validationDescriptors, items, params, endpoint, button) {
            var errorMessage,
                itemLimit = this._currentItemLimit,
                proposedNetFilesUploadedOrQueued = this._netUploadedOrQueued;

            if (itemLimit === 0 || proposedNetFilesUploadedOrQueued <= itemLimit) {
                if (items.length > 0) {
                    this._handleCheckedCallback({
                        name: "onValidate",
                        callback: qq.bind(this._options.callbacks.onValidate, this, validationDescriptors[0], button),
                        onSuccess: qq.bind(this._onValidateCallbackSuccess, this, items, 0, params, endpoint),
                        onFailure: qq.bind(this._onValidateCallbackFailure, this, items, 0, params, endpoint),
                        identifier: "Item '" + items[0].file.name + "', size: " + items[0].file.size
                    });
                }
                else {
                    this._itemError("noFilesError");
                }
            }
            else {
                this._onValidateBatchCallbackFailure(items);
                errorMessage = this._options.messages.tooManyItemsError
                    .replace(/\{netItems\}/g, proposedNetFilesUploadedOrQueued)
                    .replace(/\{itemLimit\}/g, itemLimit);
                this._batchError(errorMessage);
            }
        },

        _onValidateCallbackFailure: function(items, index, params, endpoint) {
            var nextIndex = index + 1;

            this._fileOrBlobRejected(items[index].id, items[index].file.name);

            this._maybeProcessNextItemAfterOnValidateCallback(false, items, nextIndex, params, endpoint);
        },

        _onValidateCallbackSuccess: function(items, index, params, endpoint) {
            var self = this,
                nextIndex = index + 1,
                validationDescriptor = this._getValidationDescriptor(items[index]);

            this._validateFileOrBlobData(items[index], validationDescriptor)
                .then(
                function() {
                    self._upload(items[index].id, params, endpoint);
                    self._maybeProcessNextItemAfterOnValidateCallback(true, items, nextIndex, params, endpoint);
                },
                function() {
                    self._maybeProcessNextItemAfterOnValidateCallback(false, items, nextIndex, params, endpoint);
                }
            );
        },

        _prepareItemsForUpload: function(items, params, endpoint) {
            if (items.length === 0) {
                this._itemError("noFilesError");
                return;
            }

            var validationDescriptors = this._getValidationDescriptors(items),
                buttonId = this._getButtonId(items[0].file),
                button = this._getButton(buttonId);

            this._handleCheckedCallback({
                name: "onValidateBatch",
                callback: qq.bind(this._options.callbacks.onValidateBatch, this, validationDescriptors, button),
                onSuccess: qq.bind(this._onValidateBatchCallbackSuccess, this, validationDescriptors, items, params, endpoint, button),
                onFailure: qq.bind(this._onValidateBatchCallbackFailure, this, items),
                identifier: "batch validation"
            });
        },

        _preventLeaveInProgress: function() {
            var self = this;

            this._disposeSupport.attach(window, "beforeunload", function(e) {
                if (self.getInProgress()) {
                    e = e || window.event;
                    // for ie, ff
                    e.returnValue = self._options.messages.onLeave;
                    // for webkit
                    return self._options.messages.onLeave;
                }
            });
        },

        // Attempts to refresh session data only if the `qq.Session` module exists
        // and a session endpoint has been specified.  The `onSessionRequestComplete`
        // callback will be invoked once the refresh is complete.
        _refreshSessionData: function() {
            var self = this,
                options = this._options.session;

            /* jshint eqnull:true */
            if (qq.Session && this._options.session.endpoint != null) {
                if (!this._session) {
                    qq.extend(options, {cors: this._options.cors});

                    options.log = qq.bind(this.log, this);
                    options.addFileRecord = qq.bind(this._addCannedFile, this);

                    this._session = new qq.Session(options);
                }

                setTimeout(function() {
                    self._session.refresh().then(function(response, xhrOrXdr) {
                        self._sessionRequestComplete();
                        self._options.callbacks.onSessionRequestComplete(response, true, xhrOrXdr);

                    }, function(response, xhrOrXdr) {

                        self._options.callbacks.onSessionRequestComplete(response, false, xhrOrXdr);
                    });
                }, 0);
            }
        },

        _sessionRequestComplete: function() {},

        _setSize: function(id, newSize) {
            this._uploadData.updateSize(id, newSize);
            this._totalProgress && this._totalProgress.onNewSize(id);
        },

        _shouldAutoRetry: function(id, name, responseJSON) {
            var uploadData = this._uploadData.retrieve({id: id});

            /*jshint laxbreak: true */
            if (!this._preventRetries[id]
                && this._options.retry.enableAuto
                && uploadData.status !== qq.status.PAUSED) {

                if (this._autoRetries[id] === undefined) {
                    this._autoRetries[id] = 0;
                }

                if (this._autoRetries[id] < this._options.retry.maxAutoAttempts) {
                    this._autoRetries[id] += 1;
                    return true;
                }
            }

            return false;
        },

        _storeForLater: function(id) {
            this._storedIds.push(id);
        },

        // Maps a file with the button that was used to select it.
        _trackButton: function(id) {
            var buttonId;

            if (qq.supportedFeatures.ajaxUploading) {
                buttonId = this._handler.getFile(id).qqButtonId;
            }
            else {
                buttonId = this._getButtonId(this._handler.getInput(id));
            }

            if (buttonId) {
                this._buttonIdsForFileIds[id] = buttonId;
            }
        },

        _updateFormSupportAndParams: function(formElementOrId) {
            this._options.form.element = formElementOrId;

            this._formSupport = qq.FormSupport && new qq.FormSupport(
                    this._options.form, qq.bind(this.uploadStoredFiles, this), qq.bind(this.log, this)
                );

            if (this._formSupport && this._formSupport.attachedToForm) {
                this._paramsStore.addReadOnly(null, this._formSupport.getFormInputsAsObject);

                this._options.autoUpload = this._formSupport.newAutoUpload;
                if (this._formSupport.newEndpoint) {
                    this.setEndpoint(this._formSupport.newEndpoint);
                }
            }
        },

        _upload: function(id, params, endpoint) {
            var name = this.getName(id);

            if (params) {
                this.setParams(params, id);
            }

            if (endpoint) {
                this.setEndpoint(endpoint, id);
            }

            this._handleCheckedCallback({
                name: "onSubmit",
                callback: qq.bind(this._options.callbacks.onSubmit, this, id, name),
                onSuccess: qq.bind(this._onSubmitCallbackSuccess, this, id, name),
                onFailure: qq.bind(this._fileOrBlobRejected, this, id, name),
                identifier: id
            });
        },

        _uploadFile: function(id) {
            if (!this._handler.upload(id)) {
                this._uploadData.setStatus(id, qq.status.QUEUED);
            }
        },

        _uploadStoredFiles: function() {
            var idToUpload, stillSubmitting,
                self = this;

            while (this._storedIds.length) {
                idToUpload = this._storedIds.shift();
                this._uploadFile(idToUpload);
            }

            // If we are still waiting for some files to clear validation, attempt to upload these again in a bit
            stillSubmitting = this.getUploads({status: qq.status.SUBMITTING}).length;
            if (stillSubmitting) {
                qq.log("Still waiting for " + stillSubmitting + " files to clear submit queue. Will re-parse stored IDs array shortly.");
                setTimeout(function() {
                    self._uploadStoredFiles();
                }, 1000);
            }
        },

        /**
         * Performs some internal validation checks on an item, defined in the `validation` option.
         *
         * @param fileWrapper Wrapper containing a `file` along with an `id`
         * @param validationDescriptor Normalized information about the item (`size`, `name`).
         * @returns qq.Promise with appropriate callbacks invoked depending on the validity of the file
         * @private
         */
        _validateFileOrBlobData: function(fileWrapper, validationDescriptor) {
            var self = this,
                file = (function() {
                    if (fileWrapper.file instanceof qq.BlobProxy) {
                        return fileWrapper.file.referenceBlob;
                    }
                    return fileWrapper.file;
                }()),
                name = validationDescriptor.name,
                size = validationDescriptor.size,
                buttonId = this._getButtonId(fileWrapper.file),
                validationBase = this._getValidationBase(buttonId),
                validityChecker = new qq.Promise();

            validityChecker.then(
                function() {},
                function() {
                    self._fileOrBlobRejected(fileWrapper.id, name);
                });

            if (qq.isFileOrInput(file) && !this._isAllowedExtension(validationBase.allowedExtensions, name)) {
                this._itemError("typeError", name, file);
                return validityChecker.failure();
            }

            if (size === 0) {
                this._itemError("emptyError", name, file);
                return validityChecker.failure();
            }

            if (size > 0 && validationBase.sizeLimit && size > validationBase.sizeLimit) {
                this._itemError("sizeError", name, file);
                return validityChecker.failure();
            }

            if (size > 0 && size < validationBase.minSizeLimit) {
                this._itemError("minSizeError", name, file);
                return validityChecker.failure();
            }

            if (qq.ImageValidation && qq.supportedFeatures.imagePreviews && qq.isFile(file)) {
                new qq.ImageValidation(file, qq.bind(self.log, self)).validate(validationBase.image).then(
                    validityChecker.success,
                    function(errorCode) {
                        self._itemError(errorCode + "ImageError", name, file);
                        validityChecker.failure();
                    }
                );
            }
            else {
                validityChecker.success();
            }

            return validityChecker;
        },

        _wrapCallbacks: function() {
            var self, safeCallback, prop;

            self = this;

            safeCallback = function(name, callback, args) {
                var errorMsg;

                try {
                    return callback.apply(self, args);
                }
                catch (exception) {
                    errorMsg = exception.message || exception.toString();
                    self.log("Caught exception in '" + name + "' callback - " + errorMsg, "error");
                }
            };

            /* jshint forin: false, loopfunc: true */
            for (prop in this._options.callbacks) {
                (function() {
                    var callbackName, callbackFunc;
                    callbackName = prop;
                    callbackFunc = self._options.callbacks[callbackName];
                    self._options.callbacks[callbackName] = function() {
                        return safeCallback(callbackName, callbackFunc, arguments);
                    };
                }());
            }
        }
    };
}());
