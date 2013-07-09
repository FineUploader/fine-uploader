/**
 * Class that creates upload widget with drag-and-drop and file list
 * @inherits qq.FineUploaderBasic
 */
qq.FineUploader = function(o){
    // call parent constructor
    qq.FineUploaderBasic.apply(this, arguments);

    // additional options
    qq.extend(this._options, {
        element: null,
        listElement: null,
        dragAndDrop: {
            extraDropzones: [],
            hideDropzones: true,
            disableDefaultDropzone: false
        },
        text: {
            uploadButton: 'Upload a file',
            cancelButton: 'Cancel',
            retryButton: 'Retry',
            deleteButton: 'Delete',
            failUpload: 'Upload failed',
            dragZone: 'Drop files here to upload',
            dropProcessing: 'Processing dropped files...',
            formatProgress: "{percent}% of {total_size}",
            waitingForResponse: "Processing..."
        },
        template: '<div class="qq-uploader">' +
            ((!this._options.dragAndDrop || !this._options.dragAndDrop.disableDefaultDropzone) ? '<div class="qq-upload-drop-area"><span>{dragZoneText}</span></div>' : '') +
            (!this._options.button ? '<div class="qq-upload-button"><div>{uploadButtonText}</div></div>' : '') +
            '<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
            (!this._options.listElement ? '<ul class="qq-upload-list"></ul>' : '') +
            '</div>',

        // template for one item in file list
        fileTemplate: '<li>' +
            '<div class="qq-progress-bar"></div>' +
            '<span class="qq-upload-spinner"></span>' +
            '<span class="qq-upload-finished"></span>' +
            (this._options.editFilename && this._options.editFilename.enabled ? '<span class="qq-edit-filename-icon"></span>' : '') +
            '<span class="qq-upload-file"></span>' +
            (this._options.editFilename && this._options.editFilename.enabled ? '<input class="qq-edit-filename" tabindex="0" type="text">' : '') +
            '<span class="qq-upload-size"></span>' +
            '<a class="qq-upload-cancel" href="#">{cancelButtonText}</a>' +
            '<a class="qq-upload-retry" href="#">{retryButtonText}</a>' +
            '<a class="qq-upload-delete" href="#">{deleteButtonText}</a>' +
            '<span class="qq-upload-status-text">{statusText}</span>' +
            '</li>',
        classes: {
            button: 'qq-upload-button',
            drop: 'qq-upload-drop-area',
            dropActive: 'qq-upload-drop-area-active',
            list: 'qq-upload-list',
            progressBar: 'qq-progress-bar',
            file: 'qq-upload-file',
            spinner: 'qq-upload-spinner',
            finished: 'qq-upload-finished',
            retrying: 'qq-upload-retrying',
            retryable: 'qq-upload-retryable',
            size: 'qq-upload-size',
            cancel: 'qq-upload-cancel',
            deleteButton: 'qq-upload-delete',
            retry: 'qq-upload-retry',
            statusText: 'qq-upload-status-text',
            editFilenameInput: 'qq-edit-filename',

            success: 'qq-upload-success',
            fail: 'qq-upload-fail',

            successIcon: null,
            failIcon: null,
            editNameIcon: 'qq-edit-filename-icon',
            editable: 'qq-editable',

            dropProcessing: 'qq-drop-processing',
            dropProcessingSpinner: 'qq-drop-processing-spinner'
        },
        failedUploadTextDisplay: {
            mode: 'default', //default, custom, or none
            maxChars: 50,
            responseProperty: 'error',
            enableTooltip: true
        },
        messages: {
            tooManyFilesError: "You may only drop one file",
            unsupportedBrowser: "Unrecoverable error - this browser does not permit file uploading of any kind."
        },
        retry: {
            showAutoRetryNote: true,
            autoRetryNote: "Retrying {retryNum}/{maxAuto}...",
            showButton: false
        },
        deleteFile: {
            forceConfirm: false,
            confirmMessage: "Are you sure you want to delete {filename}?",
            deletingStatusText: "Deleting...",
            deletingFailedText: "Delete failed"

        },
        display: {
            fileSizeOnSubmit: false,
            prependFiles: false
        },
        paste: {
            promptForName: false,
            namePromptMessage: "Please name this image"
        },
        editFilename: {
            enabled: false
        },
        showMessage: function(message){
            setTimeout(function() {
                window.alert(message);
            }, 0);
        },
        showConfirm: function(message, okCallback, cancelCallback) {
            setTimeout(function() {
                var result = window.confirm(message);
                if (result) {
                    okCallback();
                }
                else if (cancelCallback) {
                    cancelCallback();
                }
            }, 0);
        },
        showPrompt: function(message, defaultValue) {
            var promise = new qq.Promise(),
                retVal = window.prompt(message, defaultValue);

            /*jshint eqeqeq: true, eqnull: true*/
            if (retVal != null && qq.trimStr(retVal).length > 0) {
                promise.success(retVal);
            }
            else {
                promise.failure("Undefined or invalid user-supplied value.");
            }

            return promise;
        }
    }, true);

    // overwrite options with user supplied
    qq.extend(this._options, o, true);

    if (!qq.supportedFeatures.uploading || (this._options.cors.expected && !qq.supportedFeatures.uploadCors)) {
        this._options.element.innerHTML = "<div>" + this._options.messages.unsupportedBrowser + "</div>"
    }
    else {
        this._wrapCallbacks();

        // overwrite the upload button text if any
        // same for the Cancel button and Fail message text
        this._options.template     = this._options.template.replace(/\{dragZoneText\}/g, this._options.text.dragZone);
        this._options.template     = this._options.template.replace(/\{uploadButtonText\}/g, this._options.text.uploadButton);
        this._options.template     = this._options.template.replace(/\{dropProcessingText\}/g, this._options.text.dropProcessing);
        this._options.fileTemplate = this._options.fileTemplate.replace(/\{cancelButtonText\}/g, this._options.text.cancelButton);
        this._options.fileTemplate = this._options.fileTemplate.replace(/\{retryButtonText\}/g, this._options.text.retryButton);
        this._options.fileTemplate = this._options.fileTemplate.replace(/\{deleteButtonText\}/g, this._options.text.deleteButton);
        this._options.fileTemplate = this._options.fileTemplate.replace(/\{statusText\}/g, "");

        this._element = this._options.element;
        this._element.innerHTML = this._options.template;
        this._listElement = this._options.listElement || this._find(this._element, 'list');

        this._classes = this._options.classes;

        if (!this._button) {
            this._button = this._createUploadButton(this._find(this._element, 'button'));
        }

        this._deleteRetryOrCancelClickHandler = this._bindDeleteRetryOrCancelClickEvent();

        // A better approach would be to check specifically for focusin event support by querying the DOM API,
        // but the DOMFocusIn event is not exposed as a property, so we have to resort to UA string sniffing.
        this._focusinEventSupported = !qq.firefox();

        if (this._isEditFilenameEnabled()) {
            this._filenameClickHandler = this._bindFilenameClickEvent();
            this._filenameInputFocusInHandler = this._bindFilenameInputFocusInEvent();
            this._filenameInputFocusHandler = this._bindFilenameInputFocusEvent();
        }

        this._dnd = this._setupDragAndDrop();

        if (this._options.paste.targetElement && this._options.paste.promptForName) {
            this._setupPastePrompt();
        }

        this._totalFilesInBatch = 0;
        this._filesInBatchAddedToUi = 0;
    }
};

// inherit from Basic Uploader
qq.extend(qq.FineUploader.prototype, qq.FineUploaderBasic.prototype);

qq.extend(qq.FineUploader.prototype, {
    clearStoredFiles: function() {
        qq.FineUploaderBasic.prototype.clearStoredFiles.apply(this, arguments);
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
        qq.FineUploaderBasic.prototype.reset.apply(this, arguments);
        this._element.innerHTML = this._options.template;
        this._listElement = this._options.listElement || this._find(this._element, 'list');
        if (!this._options.button) {
            this._button = this._createUploadButton(this._find(this._element, 'button'));
        }

        this._dnd.dispose();
        this._dnd = this._setupDragAndDrop();

        this._totalFilesInBatch = 0;
        this._filesInBatchAddedToUi = 0;
    },
    _removeFileItem: function(fileId) {
        var item = this.getItemByFileId(fileId);
        qq(item).remove();
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
                    var input = self._button.getInput();

                    qq(dropProcessingEl).css({display: 'block'});
                    qq(input).attach('click', preventSelectFiles);
                },
                processingDroppedFilesComplete: function(files) {
                    var input = self._button.getInput();

                    qq(dropProcessingEl).hide();
                    qq(input).detach('click', preventSelectFiles);

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
        qq.FineUploaderBasic.prototype._storeForLater.apply(this, arguments);
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
        qq.FineUploaderBasic.prototype._onSubmit.apply(this, arguments);
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
        qq.FineUploaderBasic.prototype._onProgress.apply(this, arguments);

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
    _onComplete: function(id, name, result, xhr){
        qq.FineUploaderBasic.prototype._onComplete.apply(this, arguments);

        var item = this.getItemByFileId(id);

        qq(this._find(item, 'statusText')).clearText();

        qq(item).removeClass(this._classes.retrying);
        qq(this._find(item, 'progressBar')).hide();

        if (!this._options.disableCancelForFormUploads || qq.supportedFeatures.ajaxUploading) {
            qq(this._find(item, 'cancel')).hide();
        }
        qq(this._find(item, 'spinner')).hide();

        if (result.success) {
            if (this._isDeletePossible()) {
                this._showDeleteLink(id);
            }

            qq(item).addClass(this._classes.success);
            if (this._classes.successIcon) {
                this._find(item, 'finished').style.display = "inline-block";
                qq(item).addClass(this._classes.successIcon);
            }
        } else {
            qq(item).addClass(this._classes.fail);
            if (this._classes.failIcon) {
                this._find(item, 'finished').style.display = "inline-block";
                qq(item).addClass(this._classes.failIcon);
            }
            if (this._options.retry.showButton && !this._preventRetries[id]) {
                qq(item).addClass(this._classes.retryable);
            }
            this._controlFailureTextDisplay(item, result);
        }
    },
    _onUpload: function(id, name){
        qq.FineUploaderBasic.prototype._onUpload.apply(this, arguments);

        this._showSpinner(id);
    },
    _onCancel: function(id, name) {
        qq.FineUploaderBasic.prototype._onCancel.apply(this, arguments);
        this._removeFileItem(id);
    },
    _onBeforeAutoRetry: function(id) {
        var item, progressBar, failTextEl, retryNumForDisplay, maxAuto, retryNote;

        qq.FineUploaderBasic.prototype._onBeforeAutoRetry.apply(this, arguments);

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

        if (qq.FineUploaderBasic.prototype._onBeforeManualRetry.apply(this, arguments)) {
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
        var onSuccessCallback = qq.bind(this._onSubmitDeleteSuccess, this, id);

        qq.FineUploaderBasic.prototype._onSubmitDelete.call(this, id, onSuccessCallback);
    },
    _onSubmitDeleteSuccess: function(id) {
        if (this._options.deleteFile.forceConfirm) {
            this._showDeleteConfirm(id);
        }
        else {
            this._sendDeleteRequest(id);
        }
    },
    _onDeleteComplete: function(id, xhr, isError) {
        qq.FineUploaderBasic.prototype._onDeleteComplete.apply(this, arguments);

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
    _sendDeleteRequest: function(id) {
        var item = this.getItemByFileId(id),
            deleteLink = this._find(item, 'deleteButton'),
            statusTextEl = this._find(item, 'statusText');

        qq(deleteLink).hide();
        this._showSpinner(id);
        qq(statusTextEl).setText(this._options.deleteFile.deletingStatusText);
        this._deleteHandler.sendDelete(id, this.getUuid(id));
    },
    _showDeleteConfirm: function(id) {
        var fileName = this._handler.getName(id),
            confirmMessage = this._options.deleteFile.confirmMessage.replace(/\{filename\}/g, fileName),
            uuid = this.getUuid(id),
            self = this;

        this._options.showConfirm(confirmMessage, function() {
            self._sendDeleteRequest(id);
        });
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
    _itemError: function(code, name){
        var message = qq.FineUploaderBasic.prototype._itemError.apply(this, arguments);
        this._options.showMessage(message);
    },
    _batchError: function(message) {
        qq.FineUploaderBasic.prototype._batchError.apply(this, arguments);
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
        qq.FineUploaderBasic.prototype._fileOrBlobRejected.apply(this, arguments);
    },
    _prepareItemsForUpload: function(items, params, endpoint) {
        this._totalFilesInBatch = items.length;
        this._filesInBatchAddedToUi = 0;
        qq.FineUploaderBasic.prototype._prepareItemsForUpload.apply(this, arguments);
    }
});
