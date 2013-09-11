/**
 * Defines the public API for FineUploader mode.
 */
qq.uiPublicApi = {
    clearStoredFiles: function() {
        this._parent.prototype.clearStoredFiles.apply(this, arguments);
        this._listElement.innerHTML = "";
    },

    addExtraDropzone: function(element){
        this._dnd.setupExtraDropzone(element);
    },

    removeExtraDropzone: function(element){
        return this._dnd.removeDropzone(element);
    },

    getItemByFileId: function(id){
        var item = this._listElement.firstChild;

        // there can't be txt nodes in dynamically created list
        // and we can  use nextSibling
        while (item){
            if (item.qqFileId == id) return item;
            item = item.nextSibling;
        }
    },

    reset: function() {
        this._parent.prototype.reset.apply(this, arguments);
        this._element.innerHTML = this._options.template;
        this._listElement = this._options.listElement || this._find(this._element, 'list');

        if (!this._options.button) {
            this._defaultButtonId = this._createUploadButton({element: this._find(this._element, 'button')}).getButtonId();
        }

        this._dnd.dispose();
        this._dnd = this._setupDragAndDrop();

        this._totalFilesInBatch = 0;
        this._filesInBatchAddedToUi = 0;

        this._setupClickAndEditEventHandlers();
    }
};




/**
 * Defines the private (internal) API for FineUploader mode.
 */
qq.uiPrivateApi = {
    _getButton: function(buttonId) {
        var button = this._parent.prototype._getButton.apply(this, arguments);

        if (!button) {
            if (buttonId === this._defaultButtonId) {
                button = this._find(this._element, "button");
            }
        }

        return button;
    },

    _removeFileItem: function(fileId) {
        var item = this.getItemByFileId(fileId);
        qq(item).remove();
    },

    _setupClickAndEditEventHandlers: function() {
        this._deleteRetryOrCancelClickHandler = this._bindDeleteRetryOrCancelClickEvent();

        // A better approach would be to check specifically for focusin event support by querying the DOM API,
        // but the DOMFocusIn event is not exposed as a property, so we have to resort to UA string sniffing.
        this._focusinEventSupported = !qq.firefox();

        if (this._isEditFilenameEnabled()) {
            this._filenameClickHandler = this._bindFilenameClickEvent();
            this._filenameInputFocusInHandler = this._bindFilenameInputFocusInEvent();
            this._filenameInputFocusHandler = this._bindFilenameInputFocusEvent();
        }
    },

    _setupDragAndDrop: function() {
        var self = this,
            dropProcessingEl = this._find(this._element, 'dropProcessing'),
            dropZoneElements = this._options.dragAndDrop.extraDropzones,
            preventSelectFiles;

        preventSelectFiles = function(event) {
            event.preventDefault();
        };

        if (!this._options.dragAndDrop.disableDefaultDropzone) {
            dropZoneElements.push(this._find(this._options.element, 'drop'));
        }

        return new qq.DragAndDrop({
            dropZoneElements: dropZoneElements,
            hideDropZonesBeforeEnter: this._options.dragAndDrop.hideDropzones,
            allowMultipleItems: this._options.multiple,
            classes: {
                dropActive: this._options.classes.dropActive
            },
            callbacks: {
                processingDroppedFiles: function() {
                    qq(dropProcessingEl).css({display: 'block'});
                },
                processingDroppedFilesComplete: function(files) {
                    qq(dropProcessingEl).hide();

                    if (files) {
                        self.addFiles(files);
                    }
                },
                dropError: function(code, errorData) {
                    self._itemError(code, errorData);
                },
                dropLog: function(message, level) {
                    self.log(message, level);
                }
            }
        });
    },

    _bindDeleteRetryOrCancelClickEvent: function() {
        var self = this;

        return new qq.DeleteRetryOrCancelClickHandler({
            listElement: this._listElement,
            classes: this._classes,
            log: function(message, lvl) {
                self.log(message, lvl);
            },
            onDeleteFile: function(fileId) {
                self.deleteFile(fileId);
            },
            onCancel: function(fileId) {
                self.cancel(fileId);
            },
            onRetry: function(fileId) {
                var item = self.getItemByFileId(fileId);

                qq(item).removeClass(self._classes.retryable);
                self.retry(fileId);
            },
            onGetName: function(fileId) {
                return self.getName(fileId);
            }
        });
    },

    _isEditFilenameEnabled: function() {
        return this._options.editFilename.enabled && !this._options.autoUpload;
    },

    _filenameEditHandler: function() {
        var self = this;

        return {
            listElement: this._listElement,
            classes: this._classes,
            log: function(message, lvl) {
                self.log(message, lvl);
            },
            onGetUploadStatus: function(fileId) {
                return self.getUploads({id: fileId}).status;
            },
            onGetName: function(fileId) {
                return self.getName(fileId);
            },
            onSetName: function(fileId, newName) {
                var item = self.getItemByFileId(fileId),
                    qqFilenameDisplay = qq(self._find(item, 'file')),
                    formattedFilename = self._options.formatFileName(newName);

                qqFilenameDisplay.setText(formattedFilename);
                self.setName(fileId, newName);
            },
            onGetInput: function(item) {
                return self._find(item, 'editFilenameInput');
            },
            onEditingStatusChange: function(fileId, isEditing) {
                var item = self.getItemByFileId(fileId),
                    qqInput = qq(self._find(item, 'editFilenameInput')),
                    qqFilenameDisplay = qq(self._find(item, 'file')),
                    qqEditFilenameIcon = qq(self._find(item, 'editNameIcon')),
                    editableClass = self._classes.editable;

                if (isEditing) {
                    qqInput.addClass('qq-editing');

                    qqFilenameDisplay.hide();
                    qqEditFilenameIcon.removeClass(editableClass);
                }
                else {
                    qqInput.removeClass('qq-editing');
                    qqFilenameDisplay.css({display: ''});
                    qqEditFilenameIcon.addClass(editableClass);
                }

                // Force IE8 and older to repaint
                qq(item).addClass('qq-temp').removeClass('qq-temp');
            }
        };
    },

    _onUploadStatusChange: function(id, oldStatus, newStatus) {
        if (this._isEditFilenameEnabled()) {
            var item = this.getItemByFileId(id),
                editableClass = this._classes.editable,
                qqFilenameDisplay, qqEditFilenameIcon;

            // Status for a file exists before it has been added to the DOM, so we must be careful here.
            if (item && newStatus !== qq.status.SUBMITTED) {
                qqFilenameDisplay = qq(this._find(item, 'file'));
                qqEditFilenameIcon = qq(this._find(item, 'editNameIcon'));

                qqFilenameDisplay.removeClass(editableClass);
                qqEditFilenameIcon.removeClass(editableClass);
            }
        }
    },

    _bindFilenameInputFocusInEvent: function() {
        var spec = qq.extend({}, this._filenameEditHandler());

        return new qq.FilenameInputFocusInHandler(spec);
    },

    _bindFilenameInputFocusEvent: function() {
        var spec = qq.extend({}, this._filenameEditHandler());

        return new qq.FilenameInputFocusHandler(spec);
    },

    _bindFilenameClickEvent: function() {
        var spec = qq.extend({}, this._filenameEditHandler());

        return new qq.FilenameClickHandler(spec);
    },

    _leaving_document_out: function(e){
        return ((qq.chrome() || (qq.safari() && qq.windows())) && e.clientX == 0 && e.clientY == 0) // null coords for Chrome and Safari Windows
            || (qq.firefox() && !e.relatedTarget); // null e.relatedTarget for Firefox
    },

    _storeForLater: function(id) {
        this._parent.prototype._storeForLater.apply(this, arguments);
        var item = this.getItemByFileId(id);
        qq(this._find(item, 'spinner')).hide();
    },

    /**
     * Gets one of the elements listed in this._options.classes
     **/
    _find: function(parent, type) {
        var element = qq(parent).getByClass(this._options.classes[type])[0];
        if (!element){
            throw new Error('element not found ' + type);
        }

        return element;
    },

    _onSubmit: function(id, name) {
        this._parent.prototype._onSubmit.apply(this, arguments);
        this._addToList(id, name);
    },

    // The file item has been added to the DOM.
    _onSubmitted: function(id) {
        // If the edit filename feature is enabled, mark the filename element as "editable" and the associated edit icon
        if (this._isEditFilenameEnabled()) {
            var item = this.getItemByFileId(id),
                qqFilenameDisplay = qq(this._find(item, 'file')),
                qqEditFilenameIcon = qq(this._find(item, 'editNameIcon')),
                editableClass = this._classes.editable;

            qqFilenameDisplay.addClass(editableClass);
            qqEditFilenameIcon.addClass(editableClass);

            // If the focusin event is not supported, we must add a focus handler to the newly create edit filename text input
            if (!this._focusinEventSupported) {
                this._filenameInputFocusHandler.addHandler(this._find(item, 'editFilenameInput'));
            }
        }
    },

    // Update the progress bar & percentage as the file is uploaded
    _onProgress: function(id, name, loaded, total){
        this._parent.prototype._onProgress.apply(this, arguments);

        var item, progressBar, percent, cancelLink;

        item = this.getItemByFileId(id);
        progressBar = this._find(item, 'progressBar');
        percent = Math.round(loaded / total * 100);

        if (loaded === total) {
            cancelLink = this._find(item, 'cancel');
            qq(cancelLink).hide();

            qq(progressBar).hide();
            qq(this._find(item, 'statusText')).setText(this._options.text.waitingForResponse);

            // If last byte was sent, display total file size
            this._displayFileSize(id);
        }
        else {
            // If still uploading, display percentage - total size is actually the total request(s) size
            this._displayFileSize(id, loaded, total);

            qq(progressBar).css({display: 'block'});
        }

        // Update progress bar element
        qq(progressBar).css({width: percent + '%'});
    },

    _onComplete: function(id, name, result, xhr) {
        var parentRetVal = this._parent.prototype._onComplete.apply(this, arguments),
            self = this;

        function completeUpload(result) {
            var item = self.getItemByFileId(id);

            qq(self._find(item, 'statusText')).clearText();

            qq(item).removeClass(self._classes.retrying);
            qq(self._find(item, 'progressBar')).hide();

            if (!self._options.disableCancelForFormUploads || qq.supportedFeatures.ajaxUploading) {
                qq(self._find(item, 'cancel')).hide();
            }
            qq(self._find(item, 'spinner')).hide();

            if (result.success) {
                if (self._isDeletePossible()) {
                    self._showDeleteLink(id);
                }

                qq(item).addClass(self._classes.success);
                if (self._classes.successIcon) {
                    self._find(item, 'finished').style.display = "inline-block";
                    qq(item).addClass(self._classes.successIcon);
                }
            }
            else {
                qq(item).addClass(self._classes.fail);
                if (self._classes.failIcon) {
                    self._find(item, 'finished').style.display = "inline-block";
                    qq(item).addClass(self._classes.failIcon);
                }
                if (self._options.retry.showButton && !self._preventRetries[id]) {
                    qq(item).addClass(self._classes.retryable);
                }
                self._controlFailureTextDisplay(item, result);
            }
        }

        // The parent may need to perform some async operation before we can accurately determine the status of the upload.
        if (qq.isPromise(parentRetVal)) {
            parentRetVal.done(function(newResult) {
                completeUpload(newResult);
            });

        }
        else {
            completeUpload(result);
        }

        return parentRetVal;
    },

    _onUpload: function(id, name){
        var parentRetVal = this._parent.prototype._onUpload.apply(this, arguments);

        this._showSpinner(id);

        return parentRetVal;
    },

    _onCancel: function(id, name) {
        this._parent.prototype._onCancel.apply(this, arguments);
        this._removeFileItem(id);
    },

    _onBeforeAutoRetry: function(id) {
        var item, progressBar, failTextEl, retryNumForDisplay, maxAuto, retryNote;

        this._parent.prototype._onBeforeAutoRetry.apply(this, arguments);

        item = this.getItemByFileId(id);
        progressBar = this._find(item, 'progressBar');

        this._showCancelLink(item);
        progressBar.style.width = 0;
        qq(progressBar).hide();

        if (this._options.retry.showAutoRetryNote) {
            failTextEl = this._find(item, 'statusText');
            retryNumForDisplay = this._autoRetries[id] + 1;
            maxAuto = this._options.retry.maxAutoAttempts;

            retryNote = this._options.retry.autoRetryNote.replace(/\{retryNum\}/g, retryNumForDisplay);
            retryNote = retryNote.replace(/\{maxAuto\}/g, maxAuto);

            qq(failTextEl).setText(retryNote);
            if (retryNumForDisplay === 1) {
                qq(item).addClass(this._classes.retrying);
            }
        }
    },

    //return false if we should not attempt the requested retry
    _onBeforeManualRetry: function(id) {
        var item = this.getItemByFileId(id);

        if (this._parent.prototype._onBeforeManualRetry.apply(this, arguments)) {
            this._find(item, 'progressBar').style.width = 0;
            qq(item).removeClass(this._classes.fail);
            qq(this._find(item, 'statusText')).clearText();
            this._showSpinner(id);
            this._showCancelLink(item);
            return true;
        }
        else {
            qq(item).addClass(this._classes.retryable);
            return false;
        }
    },

    _onSubmitDelete: function(id) {
        var onSuccessCallback = qq.bind(this._onSubmitDeleteSuccess, this);

        this._parent.prototype._onSubmitDelete.call(this, id, onSuccessCallback);
    },

    _onSubmitDeleteSuccess: function(id, uuid, additionalMandatedParams) {
        if (this._options.deleteFile.forceConfirm) {
            this._showDeleteConfirm.apply(this, arguments);
        }
        else {
            this._sendDeleteRequest.apply(this, arguments);
        }
    },

    _onDeleteComplete: function(id, xhr, isError) {
        this._parent.prototype._onDeleteComplete.apply(this, arguments);

        var item = this.getItemByFileId(id),
            spinnerEl = this._find(item, 'spinner'),
            statusTextEl = this._find(item, 'statusText');

        qq(spinnerEl).hide();

        if (isError) {
            qq(statusTextEl).setText(this._options.deleteFile.deletingFailedText);
            this._showDeleteLink(id);
        }
        else {
            this._removeFileItem(id);
        }
    },

    _sendDeleteRequest: function(id, uuid, additionalMandatedParams) {
        var item = this.getItemByFileId(id),
            deleteLink = this._find(item, 'deleteButton'),
            statusTextEl = this._find(item, 'statusText');

        qq(deleteLink).hide();
        this._showSpinner(id);
        qq(statusTextEl).setText(this._options.deleteFile.deletingStatusText);
        this._deleteHandler.sendDelete.apply(this, arguments);
    },

    _showDeleteConfirm: function(id, uuid, mandatedParams) {
        var fileName = this._handler.getName(id),
            confirmMessage = this._options.deleteFile.confirmMessage.replace(/\{filename\}/g, fileName),
            uuid = this.getUuid(id),
            deleteRequestArgs = arguments,
            self = this,
            retVal;

        retVal = this._options.showConfirm(confirmMessage);

        if (qq.isPromise(retVal)) {
            retVal.then(function () {
                self._sendDeleteRequest.apply(self, deleteRequestArgs);
            });
        }
        else if (retVal !== false) {
            self._sendDeleteRequest.apply(self, deleteRequestArgs);
        }
    },

    _addToList: function(id, name){
        var item = qq.toElement(this._options.fileTemplate);
        if (this._options.disableCancelForFormUploads && !qq.supportedFeatures.ajaxUploading) {
            var cancelLink = this._find(item, 'cancel');
            qq(cancelLink).remove();
        }

        item.qqFileId = id;

        var fileElement = this._find(item, 'file');
        qq(fileElement).setText(this._options.formatFileName(name));
        qq(this._find(item, 'size')).hide();
        if (!this._options.multiple) {
            this._handler.cancelAll();
            this._clearList();
        }

        if (this._options.display.prependFiles) {
            this._prependItem(item);
        }
        else {
            this._listElement.appendChild(item);
        }
        this._filesInBatchAddedToUi += 1;

        if (this._options.display.fileSizeOnSubmit && qq.supportedFeatures.ajaxUploading) {
            this._displayFileSize(id);
        }
    },

    _prependItem: function(item) {
        var parentEl = this._listElement,
            beforeEl = parentEl.firstChild;

        if (this._totalFilesInBatch > 1 && this._filesInBatchAddedToUi > 0) {
            beforeEl = qq(parentEl).children()[this._filesInBatchAddedToUi - 1].nextSibling;

        }

        parentEl.insertBefore(item, beforeEl);
    },

    _clearList: function(){
        this._listElement.innerHTML = '';
        this.clearStoredFiles();
    },

    _displayFileSize: function(id, loadedSize, totalSize) {
        var item = this.getItemByFileId(id),
            size = this.getSize(id),
            sizeForDisplay = this._formatSize(size),
            sizeEl = this._find(item, 'size');

        if (loadedSize !== undefined && totalSize !== undefined) {
            sizeForDisplay = this._formatProgress(loadedSize, totalSize);
        }

        qq(sizeEl).css({display: 'inline'});
        qq(sizeEl).setText(sizeForDisplay);
    },

    _formatProgress: function (uploadedSize, totalSize) {
        var message = this._options.text.formatProgress;
        function r(name, replacement) { message = message.replace(name, replacement); }

        r('{percent}', Math.round(uploadedSize / totalSize * 100));
        r('{total_size}', this._formatSize(totalSize));
        return message;
    },

    _controlFailureTextDisplay: function(item, response) {
        var mode, maxChars, responseProperty, failureReason, shortFailureReason;

        mode = this._options.failedUploadTextDisplay.mode;
        maxChars = this._options.failedUploadTextDisplay.maxChars;
        responseProperty = this._options.failedUploadTextDisplay.responseProperty;

        if (mode === 'custom') {
            failureReason = response[responseProperty];
            if (failureReason) {
                if (failureReason.length > maxChars) {
                    shortFailureReason = failureReason.substring(0, maxChars) + '...';
                }
            }
            else {
                failureReason = this._options.text.failUpload;
                this.log("'" + responseProperty + "' is not a valid property on the server response.", 'warn');
            }

            qq(this._find(item, 'statusText')).setText(shortFailureReason || failureReason);

            if (this._options.failedUploadTextDisplay.enableTooltip) {
                this._showTooltip(item, failureReason);
            }
        }
        else if (mode === 'default') {
            qq(this._find(item, 'statusText')).setText(this._options.text.failUpload);
        }
        else if (mode !== 'none') {
            this.log("failedUploadTextDisplay.mode value of '" + mode + "' is not valid", 'warn');
        }
    },

    _showTooltip: function(item, text) {
        item.title = text;
    },

    _showSpinner: function(id) {
        var item = this.getItemByFileId(id),
            spinnerEl = this._find(item, 'spinner');

        spinnerEl.style.display = "inline-block";
    },

    _showCancelLink: function(item) {
        if (!this._options.disableCancelForFormUploads || qq.supportedFeatures.ajaxUploading) {
            var cancelLink = this._find(item, 'cancel');

            qq(cancelLink).css({display: 'inline'});
        }
    },

    _showDeleteLink: function(id) {
        var item = this.getItemByFileId(id),
            deleteLink = this._find(item, 'deleteButton');

        qq(deleteLink).css({display: 'inline'});
    },

    _itemError: function(code, name, item) {
        var message = this._parent.prototype._itemError.apply(this, arguments);
        this._options.showMessage(message);
    },

    _batchError: function(message) {
        this._parent.prototype._batchError.apply(this, arguments);
        this._options.showMessage(message);
    },

    _setupPastePrompt: function() {
        var self = this;

        this._options.callbacks.onPasteReceived = function() {
            var message = self._options.paste.namePromptMessage,
                defaultVal = self._options.paste.defaultName;

            return self._options.showPrompt(message, defaultVal);
        };
    },

    _fileOrBlobRejected: function(id, name) {
        this._totalFilesInBatch -= 1;
        this._parent.prototype._fileOrBlobRejected.apply(this, arguments);
    },

    _prepareItemsForUpload: function(items, params, endpoint) {
        this._totalFilesInBatch = items.length;
        this._filesInBatchAddedToUi = 0;
        this._parent.prototype._prepareItemsForUpload.apply(this, arguments);
    }
};
