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
        if (this._onBeforeManualRetry(id)) {
            this._netUploadedOrQueued++;
            this._uploadData.setStatus(id, qq.status.UPLOAD_RETRYING);
            this._handler.retry(id);
            return true;
        }
        else {
            return false;
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
    reset: function() {
        this.log("Resetting uploader...");

        this._handler.reset();
        this._filesInProgress = [];
        this._storedIds = [];
        this._autoRetries = [];
        this._retryTimeouts = [];
        this._preventRetries = [];
        this._button.reset();
        this._paramsStore.reset();
        this._endpointStore.reset();
        this._netUploadedOrQueued = 0;
        this._netUploaded = 0;
        this._uploadData.reset();

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
    }
};




/**
 * Defines the private (internal) API for FineUploaderBasic mode.
 */
qq.basePrivateApi = {
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
    _createUploadButton: function(element){
        var self = this;

        var button = new qq.UploadButton({
            element: element,
            multiple: this._options.multiple && qq.supportedFeatures.ajaxUploading,
            acceptFiles: this._options.validation.acceptFiles,
            onChange: function(input){
                self._onInputChange(input);
            },
            hoverClass: this._options.classes.buttonHover,
            focusClass: this._options.classes.buttonFocus
        });

        this._disposeSupport.addDisposer(function() { button.dispose(); });
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
                    self._preventRetries[id] = responseJSON[self._options.retry.preventRetryResponseProperty];

                    if (self._shouldAutoRetry(id, name, responseJSON)) {
                        self._maybeParseAndSendUploadError(id, name, responseJSON, xhr);
                        self._options.callbacks.onAutoRetry(id, name, self._autoRetries[id] + 1);
                        self._onBeforeAutoRetry(id, name);

                        self._retryTimeouts[id] = setTimeout(function() {
                            self._onAutoRetry(id, name, responseJSON)
                        }, self._options.retry.autoAttemptDelay * 1000);

                        return true;
                    }
                    else {
                        return false;
                    }
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
    _onInputChange: function(input){
        if (qq.supportedFeatures.ajaxUploading) {
            this.addFiles(input.files);
        }
        else {
            this.addFiles(input);
        }

        this._button.reset();
    },
    _onBeforeAutoRetry: function(id, name) {
        this.log("Waiting " + this._options.retry.autoAttemptDelay + " seconds before retrying " + name + "...");
    },
    _onAutoRetry: function(id, name, responseJSON) {
        this.log("Retrying " + name + "...");
        this._autoRetries[id]++;
        this._uploadData.setStatus(id, qq.status.UPLOAD_RETRYING);
        this._handler.retry(id);
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
    _maybeParseAndSendUploadError: function(id, name, response, xhr) {
        //assuming no one will actually set the response code to something other than 200 and still set 'success' to true
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
        var validationDescriptors = this._getValidationDescriptors(items);

        this._handleCheckedCallback({
            name: "onValidateBatch",
            callback: qq.bind(this._options.callbacks.onValidateBatch, this, validationDescriptors),
            onSuccess: qq.bind(this._onValidateBatchCallbackSuccess, this, validationDescriptors, items, params, endpoint),
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
        this._uploadData.setStatus(id, qq.status.SUBMITTED);

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
    _onValidateBatchCallbackSuccess: function(validationDescriptors, items, params, endpoint) {
        var errorMessage,
            itemLimit = this._options.validation.itemLimit,
            proposedNetFilesUploadedOrQueued = this._netUploadedOrQueued + validationDescriptors.length;

        if (itemLimit === 0 || proposedNetFilesUploadedOrQueued <= itemLimit) {
            if (items.length > 0) {
                this._handleCheckedCallback({
                    name: "onValidate",
                    callback: qq.bind(this._options.callbacks.onValidate, this, items[0]),
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
    _validateFileOrBlobData: function(item, validationDescriptor) {
        var name = validationDescriptor.name,
            size = validationDescriptor.size,
            valid = true;

        if (this._options.callbacks.onValidate(validationDescriptor) === false) {
            valid = false;
        }

        if (qq.isFileOrInput(item) && !this._isAllowedExtension(name)){
            this._itemError('typeError', name);
            valid = false;

        }
        else if (size === 0){
            this._itemError('emptyError', name);
            valid = false;

        }
        else if (size && this._options.validation.sizeLimit && size > this._options.validation.sizeLimit){
            this._itemError('sizeError', name);
            valid = false;

        }
        else if (size && size < this._options.validation.minSizeLimit){
            this._itemError('minSizeError', name);
            valid = false;
        }

        if (!valid) {
            this._fileOrBlobRejected(undefined, name);
        }

        return valid;
    },
    _fileOrBlobRejected: function(id, name) {
        if (id !== undefined) {
            this._uploadData.setStatus(id, qq.status.REJECTED);
        }
    },
    _itemError: function(code, maybeNameOrNames) {
        var message = this._options.messages[code],
            allowedExtensions = [],
            names = [].concat(maybeNameOrNames),
            name = names[0],
            extensionsForMessage, placeholderMatch;

        function r(name, replacement){ message = message.replace(name, replacement); }

        qq.each(this._options.validation.allowedExtensions, function(idx, allowedExtension) {
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
        r('{sizeLimit}', this._formatSize(this._options.validation.sizeLimit));
        r('{minSizeLimit}', this._formatSize(this._options.validation.minSizeLimit));

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
    _isAllowedExtension: function(fileName){
        var allowed = this._options.validation.allowedExtensions,
            valid = false;

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
        var name, size, fileDescriptor;

        fileDescriptor = {};
        name = this._parseFileOrBlobDataName(fileOrBlobData);
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
    _handleCameraAccess: function() {
        if (this._options.camera.ios && qq.ios()) {
            this._options.multiple = false;

            if (this._options.validation.acceptFiles === null) {
                this._options.validation.acceptFiles = "image/*;capture=camera";
            }
            else {
                this._options.validation.acceptFiles += ",image/*;capture=camera";
            }
        }
    }
};
