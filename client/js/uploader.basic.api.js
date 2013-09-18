/**
 * Defines the public API for FineUploaderBasic mode.
 */
qq.basePublicApi = {
    log: function(str, level) {
        if (this._options.debug && (!level || level === 'info')) {
            qq.log('[FineUploader ' + qq.version + '] ' + str);
        }
        else if (level && level !== 'info') {
            qq.log('[FineUploader ' + qq.version + '] ' + str, level);

        }
    },

    setParams: function(params, id) {
        /*jshint eqeqeq: true, eqnull: true*/
        if (id == null) {
            this._options.request.params = params;
        }
        else {
            this._paramsStore.setParams(params, id);
        }
    },

    setDeleteFileParams: function(params, id) {
        /*jshint eqeqeq: true, eqnull: true*/
        if (id == null) {
            this._options.deleteFile.params = params;
        }
        else {
            this._deleteFileParamsStore.setParams(params, id);
        }
    },

    // Re-sets the default endpoint, an endpoint for a specific file, or an endpoint for a specific button
    setEndpoint: function(endpoint, id) {
        /*jshint eqeqeq: true, eqnull: true*/
        if (id == null) {
            this._options.request.endpoint = endpoint;
        }
        else {
            this._endpointStore.setEndpoint(endpoint, id);
        }
    },

    getInProgress: function() {
        return this._filesInProgress.length;
    },

    getNetUploads: function() {
        return this._netUploaded;
    },

    uploadStoredFiles: function() {
        var idToUpload;

        if (this._storedIds.length === 0) {
            this._itemError('noFilesError');
        }
        else {
            while (this._storedIds.length) {
                idToUpload = this._storedIds.shift();
                this._filesInProgress.push(idToUpload);
                this._handler.upload(idToUpload);
            }
        }
    },

    clearStoredFiles: function(){
        this._storedIds = [];
    },

    retry: function(id) {
        return this._manualRetry(id);
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

    reset: function() {
        this.log("Resetting uploader...");

        this._handler.reset();
        this._filesInProgress = [];
        this._storedIds = [];
        this._autoRetries = [];
        this._retryTimeouts = [];
        this._preventRetries = [];

        qq.each(this._buttons, function(idx, button) {
            button.reset();
        });

        this._paramsStore.reset();
        this._endpointStore.reset();
        this._netUploadedOrQueued = 0;
        this._netUploaded = 0;
        this._uploadData.reset();
        this._buttonIdsForFileIds = [];

        if (this._pasteHandler) {
            this._pasteHandler.reset();
        }
    },

    addFiles: function(filesOrInputs, params, endpoint) {
        var self = this,
            verifiedFilesOrInputs = [],
            fileOrInputIndex, fileOrInput, fileIndex;

        if (filesOrInputs) {
            if (!qq.isFileList(filesOrInputs)) {
                filesOrInputs = [].concat(filesOrInputs);
            }

            for (fileOrInputIndex = 0; fileOrInputIndex < filesOrInputs.length; fileOrInputIndex+=1) {
                fileOrInput = filesOrInputs[fileOrInputIndex];

                if (qq.isFileOrInput(fileOrInput)) {
                    if (qq.isInput(fileOrInput) && qq.supportedFeatures.ajaxUploading) {
                        for (fileIndex = 0; fileIndex < fileOrInput.files.length; fileIndex++) {
                            verifiedFilesOrInputs.push(fileOrInput.files[fileIndex]);
                        }
                    }
                    else {
                        verifiedFilesOrInputs.push(fileOrInput);
                    }
                }
                else {
                    self.log(fileOrInput + ' is not a File or INPUT element!  Ignoring!', 'warn');
                }
            }

            this.log('Received ' + verifiedFilesOrInputs.length + ' files or inputs.');
            this._prepareItemsForUpload(verifiedFilesOrInputs, params, endpoint);
        }
    },

    addBlobs: function(blobDataOrArray, params, endpoint) {
        if (blobDataOrArray) {
            var blobDataArray = [].concat(blobDataOrArray),
                verifiedBlobDataList = [],
                self = this;

            qq.each(blobDataArray, function(idx, blobData) {
                if (qq.isBlob(blobData) && !qq.isFileOrInput(blobData)) {
                    verifiedBlobDataList.push({
                        blob: blobData,
                        name: self._options.blobs.defaultName
                    });
                }
                else if (qq.isObject(blobData) && blobData.blob && blobData.name) {
                    verifiedBlobDataList.push(blobData);
                }
                else {
                    self.log("addBlobs: entry at index " + idx + " is not a Blob or a BlobData object", "error");
                }
            });

            this._prepareItemsForUpload(verifiedBlobDataList, params, endpoint);
        }
        else {
            this.log("undefined or non-array parameter passed into addBlobs", "error");
        }
    },

    getUuid: function(id) {
        return this._handler.getUuid(id);
    },

    setUuid: function(id, newUuid) {
        return this._handler.setUuid(id, newUuid);
    },

    getResumableFilesData: function() {
        return this._handler.getResumableFilesData();
    },

    getSize: function(id) {
        return this._handler.getSize(id);
    },

    getName: function(id) {
        return this._handler.getName(id);
    },

    setName: function(id, newName) {
        this._handler.setName(id, newName);
        this._uploadData.nameChanged(id, newName);
    },

    getFile: function(fileOrBlobId) {
        return this._handler.getFile(fileOrBlobId);
    },

    deleteFile: function(id) {
        this._onSubmitDelete(id);
    },

    setDeleteFileEndpoint: function(endpoint, id) {
        /*jshint eqeqeq: true, eqnull: true*/
        if (id == null) {
            this._options.deleteFile.endpoint = endpoint;
        }
        else {
            this._deleteFileEndpointStore.setEndpoint(endpoint, id);
        }
    },

    doesExist: function(fileOrBlobId) {
        return this._handler.isValid(fileOrBlobId);
    },

    getUploads: function(optionalFilter) {
        return this._uploadData.retrieve(optionalFilter);
    },

    getButton: function(fileId) {
        return this._getButton(this._buttonIdsForFileIds[fileId]);
    }
};




/**
 * Defines the private (internal) API for FineUploaderBasic mode.
 */
qq.basePrivateApi = {
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

    // Creates an extra button element
    _initExtraButton: function(spec) {
        var button = this._createUploadButton({
            element: spec.element,
            multiple: spec.multiple,
            accept: spec.validation.acceptFiles,
            folders: spec.folders
        });

        this._extraButtonSpecs[button.getButtonId()] = spec;
    },

    /**
     * Gets the internally used tracking ID for a button.
     *
     * @param buttonOrFileInputOrFile `File`, `<input type="file">`, or a button container element
     * @returns {*} The button's ID, or undefined if no ID is recoverable
     * @private
     */
    _getButtonId: function(buttonOrFileInputOrFile) {
        var inputs, fileInput;

        // If the item is a `Blob` it will never be associated with a button or drop zone.
        if (buttonOrFileInputOrFile && !buttonOrFileInputOrFile.blob && !qq.isBlob(buttonOrFileInputOrFile)) {
            if (qq.isFile(buttonOrFileInputOrFile)) {
                return buttonOrFileInputOrFile.qqButtonId;
            }
            else if (buttonOrFileInputOrFile.tagName.toLowerCase() === "input" &&
                buttonOrFileInputOrFile.type.toLowerCase() === "file") {

                return buttonOrFileInputOrFile.getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME);
            }

            inputs = buttonOrFileInputOrFile.getElementsByTagName("input");

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

    _annotateWithButtonId: function(file, associatedInput) {
        if (qq.isFile(file)) {
            file.qqButtonId = this._getButtonId(associatedInput);
        }
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

    _handleCheckedCallback: function(details) {
        var self = this,
            callbackRetVal = details.callback();

        if (qq.isPromise(callbackRetVal)) {
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
                this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Invoking failure callback.")
                details.onFailure();
            }
            else {
                this.log(details.name + " - return value was 'false' for " + details.identifier + ".  Will not proceed.")
            }
        }

        return callbackRetVal;
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
            isMultiple = spec.multiple === undefined ? this._options.multiple : spec.multiple,
            acceptFiles = spec.accept || this._options.validation.acceptFiles;

        var button = new qq.UploadButton({
            element: spec.element,
            folders: spec.folders,
            name: this._options.request.inputName,
            multiple: isMultiple && qq.supportedFeatures.ajaxUploading,
            acceptFiles: acceptFiles,
            onChange: function(input) {
                self._onInputChange(input);
            },
            hoverClass: this._options.classes.buttonHover,
            focusClass: this._options.classes.buttonFocus
        });

        this._disposeSupport.addDisposer(function() {
            button.dispose();
        });

        self._buttons.push(button);

        return button;
    },

    _createUploadHandler: function(additionalOptions, namespace) {
        var self = this,
            options = {
                debug: this._options.debug,
                maxConnections: this._options.maxConnections,
                inputName: this._options.request.inputName,
                cors: this._options.cors,
                demoMode: this._options.demoMode,
                paramsStore: this._paramsStore,
                endpointStore: this._endpointStore,
                chunking: this._options.chunking,
                resume: this._options.resume,
                blobs: this._options.blobs,
                log: function(str, level) {
                    self.log(str, level);
                },
                onProgress: function(id, name, loaded, total){
                    self._onProgress(id, name, loaded, total);
                    self._options.callbacks.onProgress(id, name, loaded, total);
                },
                onComplete: function(id, name, result, xhr){
                    var retVal = self._onComplete(id, name, result, xhr);

                    // If the internal `_onComplete` handler returns a promise, don't invoke the `onComplete` callback
                    // until the promise has been fulfilled.
                    if (qq.isPromise(retVal)) {
                        retVal.done(function() {
                            self._options.callbacks.onComplete(id, name, result, xhr);
                        });
                    }
                    else {
                        self._options.callbacks.onComplete(id, name, result, xhr);
                    }
                },
                onCancel: function(id, name) {
                    return self._handleCheckedCallback({
                        name: "onCancel",
                        callback: qq.bind(self._options.callbacks.onCancel, self, id, name),
                        onSuccess: qq.bind(self._onCancel, self, id, name),
                        identifier: id
                    });
                },
                onUpload: function(id, name) {
                    self._onUpload(id, name);
                    self._options.callbacks.onUpload(id, name);
                },
                onUploadChunk: function(id, name, chunkData){
                    self._options.callbacks.onUploadChunk(id, name, chunkData);
                },
                onResume: function(id, name, chunkData) {
                    return self._options.callbacks.onResume(id, name, chunkData);
                },
                onAutoRetry: function(id, name, responseJSON, xhr) {
                    return self._onAutoRetry.apply(self, arguments);
                },
                onUuidChanged: function(id, newUuid) {
                    self._uploadData.uuidChanged(id, newUuid);
                }
            };

        qq.each(this._options.request, function(prop, val) {
            options[prop] = val;
        });

        if (additionalOptions) {
            qq.each(additionalOptions, function(key, val) {
                options[key] = val;
            });
        }

        return new qq.UploadHandler(options, namespace);
    },

    _createDeleteHandler: function() {
        var self = this;

        return new qq.DeleteFileAjaxRequestor({
            method: this._options.deleteFile.method,
            maxConnections: this._options.maxConnections,
            uuidParamName: this._options.request.uuidName,
            customHeaders: this._options.deleteFile.customHeaders,
            paramsStore: this._deleteFileParamsStore,
            endpointStore: this._deleteFileEndpointStore,
            demoMode: this._options.demoMode,
            cors: this._options.cors,
            log: function(str, level) {
                self.log(str, level);
            },
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
                log: function(str, level) {
                    self.log(str, level);
                },
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
            }
        });
    },

    _onUploadStatusChange: function(id, oldStatus, newStatus) {
        //nothing to do in the basic uploader
    },

    _handlePasteSuccess: function(blob, extSuppliedName) {
        var extension = blob.type.split("/")[1],
            name = extSuppliedName;

        /*jshint eqeqeq: true, eqnull: true*/
        if (name == null) {
            name = this._options.paste.defaultName;
        }

        name += '.' + extension;

        this.addBlobs({
            name: name,
            blob: blob
        });
    },

    _preventLeaveInProgress: function(){
        var self = this;

        this._disposeSupport.attach(window, 'beforeunload', function(e){
            if (!self._filesInProgress.length){return;}

            var e = e || window.event;
            // for ie, ff
            e.returnValue = self._options.messages.onLeave;
            // for webkit
            return self._options.messages.onLeave;
        });
    },

    _onSubmit: function(id, name) {
        this._netUploadedOrQueued++;

        if (this._options.autoUpload) {
            this._filesInProgress.push(id);
        }
    },

    _onProgress: function(id, name, loaded, total) {
        //nothing to do yet in core uploader
    },

    _onComplete: function(id, name, result, xhr) {
        if (!result.success) {
            this._netUploadedOrQueued--;
            this._uploadData.setStatus(id, qq.status.UPLOAD_FAILED);
        }
        else {
            this._netUploaded++;
            this._uploadData.setStatus(id, qq.status.UPLOAD_SUCCESSFUL);
        }

        this._removeFromFilesInProgress(id);
        this._maybeParseAndSendUploadError(id, name, result, xhr);

        return result.success ? true : false;
    },

    _onCancel: function(id, name) {
        this._netUploadedOrQueued--;

        this._removeFromFilesInProgress(id);

        clearTimeout(this._retryTimeouts[id]);

        var storedItemIndex = qq.indexOf(this._storedIds, id);
        if (!this._options.autoUpload && storedItemIndex >= 0) {
            this._storedIds.splice(storedItemIndex, 1);
        }

        this._uploadData.setStatus(id, qq.status.CANCELED);
    },

    _isDeletePossible: function() {
        if (!this._options.deleteFile.enabled) {
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

    _onSubmitDelete: function(id, onSuccessCallback, additionalMandatedParams) {
        var uuid = this.getUuid(id),
            adjustedOnSuccessCallback;

        if (onSuccessCallback) {
            adjustedOnSuccessCallback = qq.bind(onSuccessCallback, this, id, uuid, additionalMandatedParams);
        }

        if (this._isDeletePossible()) {
            return this._handleCheckedCallback({
                name: "onSubmitDelete",
                callback: qq.bind(this._options.callbacks.onSubmitDelete, this, id),
                onSuccess: adjustedOnSuccessCallback ||
                    qq.bind(this._deleteHandler.sendDelete, this, id, uuid, additionalMandatedParams),
                identifier: id
            });
        }
        else {
            this.log("Delete request ignored for ID " + id + ", delete feature is disabled or request not possible " +
                "due to CORS on a user agent that does not support pre-flighting.", "warn");
            return false;
        }
    },

    _onDelete: function(id) {
        this._uploadData.setStatus(id, qq.status.DELETING);
    },

    _onDeleteComplete: function(id, xhrOrXdr, isError) {
        var name = this._handler.getName(id);

        if (isError) {
            this._uploadData.setStatus(id, qq.status.DELETE_FAILED);
            this.log("Delete request for '" + name + "' has failed.", "error");

            // For error reporing, we only have accesss to the response status if this is not
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

    _removeFromFilesInProgress: function(id) {
        var index = qq.indexOf(this._filesInProgress, id);
        if (index >= 0) {
            this._filesInProgress.splice(index, 1);
        }
    },

    _onUpload: function(id, name) {
        this._uploadData.setStatus(id, qq.status.UPLOADING);
    },

    _onInputChange: function(input) {
        var fileIndex;

        if (qq.supportedFeatures.ajaxUploading) {
            for (fileIndex = 0; fileIndex < input.files.length; fileIndex++) {
                this._annotateWithButtonId(input.files[fileIndex], input);
            }

            this.addFiles(input.files);
        }
        else {
            this.addFiles(input);
        }

        qq.each(this._buttons, function(idx, button) {
            button.reset();
        });
    },

    _onBeforeAutoRetry: function(id, name) {
        this.log("Waiting " + this._options.retry.autoAttemptDelay + " seconds before retrying " + name + "...");
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
            self._maybeParseAndSendUploadError.apply(self, arguments);
            self._options.callbacks.onAutoRetry(id, name, self._autoRetries[id] + 1);
            self._onBeforeAutoRetry(id, name);

            self._retryTimeouts[id] = setTimeout(function() {
                self.log("Retrying " + name + "...");
                self._autoRetries[id]++;
                self._uploadData.setStatus(id, qq.status.UPLOAD_RETRYING);

                if (callback) {
                    callback(id);
                }
                else {
                    self._handler.retry(id);
                }
            }, self._options.retry.autoAttemptDelay * 1000);

            return true;
        }
    },

    _shouldAutoRetry: function(id, name, responseJSON) {
        if (!this._preventRetries[id] && this._options.retry.enableAuto) {
            if (this._autoRetries[id] === undefined) {
                this._autoRetries[id] = 0;
            }

            return this._autoRetries[id] < this._options.retry.maxAutoAttempts;
        }

        return false;
    },

    //return false if we should not attempt the requested retry
    _onBeforeManualRetry: function(id) {
        var itemLimit = this._options.validation.itemLimit;

        if (this._preventRetries[id]) {
            this.log("Retries are forbidden for id " + id, 'warn');
            return false;
        }
        else if (this._handler.isValid(id)) {
            var fileName = this._handler.getName(id);

            if (this._options.callbacks.onManualRetry(id, fileName) === false) {
                return false;
            }

            if (itemLimit > 0 && this._netUploadedOrQueued+1 > itemLimit) {
                this._itemError("retryFailTooManyItems");
                return false;
            }

            this.log("Retrying upload for '" + fileName + "' (id: " + id + ")...");
            this._filesInProgress.push(id);
            return true;
        }
        else {
            this.log("'" + id + "' is not a valid file ID", 'error');
            return false;
        }
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

    _maybeParseAndSendUploadError: function(id, name, response, xhr) {
        // Assuming no one will actually set the response code to something other than 200
        // and still set 'success' to true...
        if (!response.success){
            if (xhr && xhr.status !== 200 && !response.error) {
                this._options.callbacks.onError(id, name, "XHR returned response code " + xhr.status, xhr);
            }
            else {
                var errorReason = response.error ? response.error : this._options.text.defaultResponseError;
                this._options.callbacks.onError(id, name, errorReason, xhr);
            }
        }
    },

    _prepareItemsForUpload: function(items, params, endpoint) {
        var validationDescriptors = this._getValidationDescriptors(items),
            buttonId = this._getButtonId(items[0]),
            button = this._getButton(buttonId);

        this._handleCheckedCallback({
            name: "onValidateBatch",
            callback: qq.bind(this._options.callbacks.onValidateBatch, this, validationDescriptors, button),
            onSuccess: qq.bind(this._onValidateBatchCallbackSuccess, this, validationDescriptors, items, params, endpoint, button),
            identifier: "batch validation"
        });
    },

    _upload: function(blobOrFileContainer, params, endpoint) {
        var id = this._handler.add(blobOrFileContainer),
            name = this._handler.getName(id);

        this._uploadData.added(id);

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

    _onSubmitCallbackSuccess: function(id, name) {
        var buttonId;

        this._uploadData.setStatus(id, qq.status.SUBMITTED);

        if (qq.supportedFeatures.ajaxUploading) {
            buttonId = this._handler.getFile(id).qqButtonId;
        }
        else {
            buttonId = this._getButtonId(this._handler.getInput(id));
        }

        if (buttonId) {
            this._buttonIdsForFileIds[id] = buttonId;
        }

        this._onSubmit.apply(this, arguments);
        this._onSubmitted.apply(this, arguments);
        this._options.callbacks.onSubmitted.apply(this, arguments);

        if (this._options.autoUpload) {
            if (!this._handler.upload(id)) {
                this._uploadData.setStatus(id, qq.status.QUEUED);
            }
        }
        else {
            this._storeForLater(id);
        }
    },

    _onSubmitted: function(id) {
        //nothing to do in the base uploader
    },

    _storeForLater: function(id) {
        this._storedIds.push(id);
    },

    _onValidateBatchCallbackSuccess: function(validationDescriptors, items, params, endpoint, button) {
        var errorMessage,
            itemLimit = this._options.validation.itemLimit,
            proposedNetFilesUploadedOrQueued = this._netUploadedOrQueued + validationDescriptors.length;

        if (itemLimit === 0 || proposedNetFilesUploadedOrQueued <= itemLimit) {
            if (items.length > 0) {
                this._handleCheckedCallback({
                    name: "onValidate",
                    callback: qq.bind(this._options.callbacks.onValidate, this, validationDescriptors[0], button),
                    onSuccess: qq.bind(this._onValidateCallbackSuccess, this, items, 0, params, endpoint),
                    onFailure: qq.bind(this._onValidateCallbackFailure, this, items, 0, params, endpoint),
                    identifier: "Item '" + items[0].name + "', size: " + items[0].size
                });
            }
            else {
                this._itemError("noFilesError");
            }
        }
        else {
            errorMessage = this._options.messages.tooManyItemsError
                .replace(/\{netItems\}/g, proposedNetFilesUploadedOrQueued)
                .replace(/\{itemLimit\}/g, itemLimit);
            this._batchError(errorMessage);
        }
    },

    _onValidateCallbackSuccess: function(items, index, params, endpoint) {
        var nextIndex = index+1,
            validationDescriptor = this._getValidationDescriptor(items[index]),
            validItem = false;

        if (this._validateFileOrBlobData(items[index], validationDescriptor)) {
            validItem = true;
            this._upload(items[index], params, endpoint);
        }

        this._maybeProcessNextItemAfterOnValidateCallback(validItem, items, nextIndex, params, endpoint);
    },

    _onValidateCallbackFailure: function(items, index, params, endpoint) {
        var nextIndex = index+ 1;

        this._fileOrBlobRejected(undefined, items[0].name);

        this._maybeProcessNextItemAfterOnValidateCallback(false, items, nextIndex, params, endpoint);
    },

    _maybeProcessNextItemAfterOnValidateCallback: function(validItem, items, index, params, endpoint) {
        var self = this;

        if (items.length > index) {
            if (validItem || !this._options.validation.stopOnFirstInvalidFile) {
                //use setTimeout to prevent a stack overflow with a large number of files in the batch & non-promissory callbacks
                setTimeout(function() {
                    var validationDescriptor = self._getValidationDescriptor(items[index]);

                    self._handleCheckedCallback({
                        name: "onValidate",
                        callback: qq.bind(self._options.callbacks.onValidate, self, items[index]),
                        onSuccess: qq.bind(self._onValidateCallbackSuccess, self, items, index, params, endpoint),
                        onFailure: qq.bind(self._onValidateCallbackFailure, self, items, index, params, endpoint),
                        identifier: "Item '" + validationDescriptor.name + "', size: " + validationDescriptor.size
                    });
                }, 0);
            }
        }
    },

    /**
     * Performs some internal validation checks on an item, defined in the `validation` option.
     *
     * @param item `File`, `Blob`, or `<input type="file">`
     * @param validationDescriptor Normalized information about the item (`size`, `name`).
     * @returns {boolean} true if the item is valid
     * @private
     */
    _validateFileOrBlobData: function(item, validationDescriptor) {
        var name = validationDescriptor.name,
            size = validationDescriptor.size,
            buttonId = this._getButtonId(item),
            extraButtonSpec = this._extraButtonSpecs[buttonId],
            validationBase = extraButtonSpec ? extraButtonSpec.validation : this._options.validation,

            valid = true;

        if (qq.isFileOrInput(item) && !this._isAllowedExtension(validationBase.allowedExtensions, name)) {
            this._itemError('typeError', name, item);
            valid = false;

        }
        else if (size === 0) {
            this._itemError('emptyError', name, item);
            valid = false;

        }
        else if (size && validationBase.sizeLimit && size > validationBase.sizeLimit) {
            this._itemError('sizeError', name, item);
            valid = false;

        }
        else if (size && size < validationBase.minSizeLimit) {
            this._itemError('minSizeError', name, item);
            valid = false;
        }

        if (!valid) {
            this._fileOrBlobRejected(undefined, name);
        }

        return valid;
    },

    _fileOrBlobRejected: function(id) {
        if (id !== undefined) {
            this._uploadData.setStatus(id, qq.status.REJECTED);
        }
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
            extraButtonSpec = this._extraButtonSpecs[buttonId],
            validationBase = extraButtonSpec ? extraButtonSpec.validation : this._options.validation,
            extensionsForMessage, placeholderMatch;

        function r(name, replacement){ message = message.replace(name, replacement); }

        qq.each(validationBase.allowedExtensions, function(idx, allowedExtension) {
                /**
                 * If an argument is not a string, ignore it.  Added when a possible issue with MooTools hijacking the
                 * `allowedExtensions` array was discovered.  See case #735 in the issue tracker for more details.
                 */
                if (qq.isString(allowedExtension)) {
                    allowedExtensions.push(allowedExtension);
                }
        });

        extensionsForMessage = allowedExtensions.join(', ').toLowerCase();

        r('{file}', this._options.formatFileName(name));
        r('{extensions}', extensionsForMessage);
        r('{sizeLimit}', this._formatSize(validationBase.sizeLimit));
        r('{minSizeLimit}', this._formatSize(validationBase.minSizeLimit));

        placeholderMatch = message.match(/(\{\w+\})/g);
        if (placeholderMatch !== null) {
            qq.each(placeholderMatch, function(idx, placeholder) {
                r(placeholder, names[idx]);
            });
        }

        this._options.callbacks.onError(null, name, message, undefined);

        return message;
    },

    _batchError: function(message) {
        this._options.callbacks.onError(null, null, message, undefined);
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
                var extRegex = new RegExp('\\.' + allowedExt + "$", 'i');

                if (fileName.match(extRegex) != null) {
                    valid = true;
                    return false;
                }
            }
        });

        return valid;
    },

    _formatSize: function(bytes){
        var i = -1;
        do {
            bytes = bytes / 1000;
            i++;
        } while (bytes > 999);

        return Math.max(bytes, 0.1).toFixed(1) + this._options.text.sizeSymbols[i];
    },

    _wrapCallbacks: function() {
        var self, safeCallback;

        self = this;

        safeCallback = function(name, callback, args) {
            try {
                return callback.apply(self, args);
            }
            catch (exception) {
                self.log("Caught exception in '" + name + "' callback - " + exception.message, 'error');
            }
        };

        for (var prop in this._options.callbacks) {
            (function() {
                var callbackName, callbackFunc;
                callbackName = prop;
                callbackFunc = self._options.callbacks[callbackName];
                self._options.callbacks[callbackName] = function() {
                    return safeCallback(callbackName, callbackFunc, arguments);
                };
            }());
        }
    },

    _parseFileOrBlobDataName: function(fileOrBlobData) {
        var name;

        if (qq.isFileOrInput(fileOrBlobData)) {
            if (fileOrBlobData.value) {
                // it is a file input
                // get input value and remove path to normalize
                name = fileOrBlobData.value.replace(/.*(\/|\\)/, "");
            } else {
                // fix missing properties in Safari 4 and firefox 11.0a2
                name = (fileOrBlobData.fileName !== null && fileOrBlobData.fileName !== undefined) ? fileOrBlobData.fileName : fileOrBlobData.name;
            }
        }
        else {
            name = fileOrBlobData.name;
        }

        return name;
    },

    _parseFileOrBlobDataSize: function(fileOrBlobData) {
        var size;

        if (qq.isFileOrInput(fileOrBlobData)) {
            if (!fileOrBlobData.value){
                // fix missing properties in Safari 4 and firefox 11.0a2
                size = (fileOrBlobData.fileSize !== null && fileOrBlobData.fileSize !== undefined) ? fileOrBlobData.fileSize : fileOrBlobData.size;
            }
        }
        else {
            size = fileOrBlobData.blob.size;
        }

        return size;
    },

    _getValidationDescriptor: function(fileOrBlobData) {
        var fileDescriptor = {},
            name = this._parseFileOrBlobDataName(fileOrBlobData),
            size = this._parseFileOrBlobDataSize(fileOrBlobData);

        fileDescriptor.name = name;
        if (size !== undefined) {
            fileDescriptor.size = size;
        }

        return fileDescriptor;
    },

    _getValidationDescriptors: function(files) {
        var self = this,
            fileDescriptors = [];

        qq.each(files, function(idx, file) {
            fileDescriptors.push(self._getValidationDescriptor(file));
        });

        return fileDescriptors;
    },

    _createParamsStore: function(type) {
        var paramsStore = {},
            self = this;

        return {
            setParams: function(params, id) {
                var paramsCopy = {};
                qq.extend(paramsCopy, params);
                paramsStore[id] = paramsCopy;
            },

            getParams: function(id) {
                /*jshint eqeqeq: true, eqnull: true*/
                var paramsCopy = {};

                if (id != null && paramsStore[id]) {
                    qq.extend(paramsCopy, paramsStore[id]);
                }
                else {
                    qq.extend(paramsCopy, self._options[type].params);
                }

                return paramsCopy;
            },

            remove: function(fileId) {
                return delete paramsStore[fileId];
            },

            reset: function() {
                paramsStore = {};
            }
        };
    },

    _createEndpointStore: function(type) {
        var endpointStore = {},
        self = this;

        return {
            setEndpoint: function(endpoint, id) {
                endpointStore[id] = endpoint;
            },

            getEndpoint: function(id) {
                /*jshint eqeqeq: true, eqnull: true*/
                if (id != null && endpointStore[id]) {
                    return endpointStore[id];
                }

                return self._options[type].endpoint;
            },

            remove: function(fileId) {
                return delete endpointStore[fileId];
            },

            reset: function() {
                endpointStore = {};
            }
        };
    },

    // Allows camera access on either the default or an extra button for iOS devices.
    _handleCameraAccess: function() {
        if (this._options.camera.ios && qq.ios()) {
            var acceptIosCamera = "image/*;capture=camera",
                button = this._options.camera.button,
                buttonId = button ? this._getButtonId(button) : this._defaultButtonId,
                optionRoot = buttonId ? this._extraButtonSpecs[buttonId] : this._options;

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
    }
};
