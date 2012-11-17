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
            failUpload: 'Upload failed',
            dragZone: 'Drop files here to upload',
            formatProgress: "{percent}% of {total_size}",
            waitingForResponse: "Processing..."
        },
        template: '<div class="qq-uploader">' +
            ((!this._options.dragAndDrop || !this._options.dragAndDrop.disableDefaultDropzone) ? '<div class="qq-upload-drop-area"><span>{dragZoneText}</span></div>' : '') +
            (!this._options.button ? '<div class="qq-upload-button"><div>{uploadButtonText}</div></div>' : '') +
            (!this._options.listElement ? '<ul class="qq-upload-list"></ul>' : '') +
            '</div>',

        // template for one item in file list
        fileTemplate: '<li>' +
            '<div class="qq-progress-bar"></div>' +
            '<span class="qq-upload-spinner"></span>' +
            '<span class="qq-upload-finished"></span>' +
            '<span class="qq-upload-file"></span>' +
            '<span class="qq-upload-size"></span>' +
            '<a class="qq-upload-cancel" href="#">{cancelButtonText}</a>' +
            '<a class="qq-upload-retry" href="#">{retryButtonText}</a>' +
            '<span class="qq-upload-status-text">{statusText}</span>' +
            '</li>',
        classes: {
            // used to get elements from templates
            button: 'qq-upload-button',
            drop: 'qq-upload-drop-area',
            dropActive: 'qq-upload-drop-area-active',
            dropDisabled: 'qq-upload-drop-area-disabled',
            list: 'qq-upload-list',
            progressBar: 'qq-progress-bar',
            file: 'qq-upload-file',
            spinner: 'qq-upload-spinner',
            finished: 'qq-upload-finished',
            retrying: 'qq-upload-retrying',
            retryable: 'qq-upload-retryable',
            size: 'qq-upload-size',
            cancel: 'qq-upload-cancel',
            retry: 'qq-upload-retry',
            statusText: 'qq-upload-status-text',

            // added to list item <li> when upload completes
            // used in css to hide progress spinner
            success: 'qq-upload-success',
            fail: 'qq-upload-fail',

            successIcon: null,
            failIcon: null
        },
        failedUploadTextDisplay: {
            mode: 'default', //default, custom, or none
            maxChars: 50,
            responseProperty: 'error',
            enableTooltip: true
        },
        messages: {
            tooManyFilesError: "You may only drop one file"
        },
        retry: {
            showAutoRetryNote: true,
            autoRetryNote: "Retrying {retryNum}/{maxAuto}...",
            showButton: false
        },
        showMessage: function(message){
            alert(message);
        }
    }, true);

    // overwrite options with user supplied
    qq.extend(this._options, o, true);
    this._wrapCallbacks();

    // overwrite the upload button text if any
    // same for the Cancel button and Fail message text
    this._options.template     = this._options.template.replace(/\{dragZoneText\}/g, this._options.text.dragZone);
    this._options.template     = this._options.template.replace(/\{uploadButtonText\}/g, this._options.text.uploadButton);
    this._options.fileTemplate = this._options.fileTemplate.replace(/\{cancelButtonText\}/g, this._options.text.cancelButton);
    this._options.fileTemplate = this._options.fileTemplate.replace(/\{retryButtonText\}/g, this._options.text.retryButton);
    this._options.fileTemplate = this._options.fileTemplate.replace(/\{statusText\}/g, "");

    this._element = this._options.element;
    this._element.innerHTML = this._options.template;
    this._listElement = this._options.listElement || this._find(this._element, 'list');

    this._classes = this._options.classes;

    if (!this._button) {
        this._button = this._createUploadButton(this._find(this._element, 'button'));
    }

    this._bindCancelAndRetryEvents();
    this._setupDragDrop();
};

// inherit from Basic Uploader
qq.extend(qq.FineUploader.prototype, qq.FineUploaderBasic.prototype);

qq.extend(qq.FineUploader.prototype, {
    clearStoredFiles: function() {
        qq.FineUploaderBasic.prototype.clearStoredFiles.apply(this, arguments);
        this._listElement.innerHTML = "";
    },
    addExtraDropzone: function(element){
        this._setupExtraDropzone(element);
    },
    removeExtraDropzone: function(element){
        var dzs = this._options.dragAndDrop.extraDropzones;
        for(var i in dzs) if (dzs[i] === element) return this._options.dragAndDrop.extraDropzones.splice(i,1);
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
        this._bindCancelAndRetryEvents();
        this._setupDragDrop();
    },
    _leaving_document_out: function(e){
        return ((qq.chrome() || (qq.safari() && qq.windows())) && e.clientX == 0 && e.clientY == 0) // null coords for Chrome and Safari Windows
            || (qq.firefox() && !e.relatedTarget); // null e.relatedTarget for Firefox
    },
    _storeFileForLater: function(id) {
        qq.FineUploaderBasic.prototype._storeFileForLater.apply(this, arguments);
        var item = this.getItemByFileId(id);
        qq(this._find(item, 'spinner')).hide();
    },
    /**
     * Gets one of the elements listed in this._options.classes
     **/
    _find: function(parent, type){
        var element = qq(parent).getByClass(this._options.classes[type])[0];
        if (!element){
            throw new Error('element not found ' + type);
        }

        return element;
    },
    _setupExtraDropzone: function(element){
        this._options.dragAndDrop.extraDropzones.push(element);
        this._setupDropzone(element);
    },
    _setupDropzone: function(dropArea){
        var self = this;

        var dz = new qq.UploadDropZone({
            element: dropArea,
            onEnter: function(e){
                qq(dropArea).addClass(self._classes.dropActive);
                e.stopPropagation();
            },
            onLeave: function(e){
                //e.stopPropagation();
            },
            onLeaveNotDescendants: function(e){
                qq(dropArea).removeClass(self._classes.dropActive);
            },
            onDrop: function(e){
                if (self._options.dragAndDrop.hideDropzones) {
                    qq(dropArea).hide();
                }

                qq(dropArea).removeClass(self._classes.dropActive);
                if (e.dataTransfer.files.length > 1 && !self._options.multiple) {
                    self._error('tooManyFilesError', "");
                }
                else {
                    self._uploadFileList(e.dataTransfer.files);
                }
            }
        });

        this.addDisposer(function() { dz.dispose(); });

        if (this._options.dragAndDrop.hideDropzones) {
            qq(dropArea).hide();
        }
    },
    _setupDragDrop: function(){
        var self, dropArea;

        self = this;

        if (!this._options.dragAndDrop.disableDefaultDropzone) {
            dropArea = this._find(this._element, 'drop');
            this._options.dragAndDrop.extraDropzones.push(dropArea);
        }

        var dropzones = this._options.dragAndDrop.extraDropzones;
        var i;
        for (i=0; i < dropzones.length; i++){
            this._setupDropzone(dropzones[i]);
        }

        // IE <= 9 does not support the File API used for drag+drop uploads
        if (!this._options.dragAndDrop.disableDefaultDropzone && (!qq.ie() || qq.ie10())) {
            this._attach(document, 'dragenter', function(e){
                if (qq(dropArea).hasClass(self._classes.dropDisabled)) return;

                dropArea.style.display = 'block';
                for (i=0; i < dropzones.length; i++){ dropzones[i].style.display = 'block'; }

            });
        }
        this._attach(document, 'dragleave', function(e){
            if (self._options.dragAndDrop.hideDropzones && qq.FineUploader.prototype._leaving_document_out(e)) {
                for (i=0; i < dropzones.length; i++) {
                    qq(dropzones[i]).hide();
                }
            }
        });
        qq(document).attach('drop', function(e){
            if (self._options.dragAndDrop.hideDropzones) {
                for (i=0; i < dropzones.length; i++) {
                    qq(dropzones[i]).hide();
                }
            }
            e.preventDefault();
        });
    },
    _onSubmit: function(id, fileName){
        qq.FineUploaderBasic.prototype._onSubmit.apply(this, arguments);
        this._addToList(id, fileName);
    },
    // Update the progress bar & percentage as the file is uploaded
    _onProgress: function(id, fileName, loaded, total){
        qq.FineUploaderBasic.prototype._onProgress.apply(this, arguments);

        var item, progressBar, text, percent, cancelLink, size;

        item = this.getItemByFileId(id);
        progressBar = this._find(item, 'progressBar');
        percent = Math.round(loaded / total * 100);

        if (loaded === total) {
            cancelLink = this._find(item, 'cancel');
            qq(cancelLink).hide();

            qq(progressBar).hide();
            qq(this._find(item, 'statusText')).setText(this._options.text.waitingForResponse);

            // If last byte was sent, just display final size
            text = this._formatSize(total);
        }
        else {
            // If still uploading, display percentage
            text = this._formatProgress(loaded, total);

            qq(progressBar).css({display: 'block'});
        }

        // Update progress bar element
        qq(progressBar).css({width: percent + '%'});

        size = this._find(item, 'size');
        qq(size).css({display: 'inline'});
        qq(size).setText(text);
    },
    _onComplete: function(id, fileName, result, xhr){
        qq.FineUploaderBasic.prototype._onComplete.apply(this, arguments);

        var item = this.getItemByFileId(id);

        qq(this._find(item, 'statusText')).clearText();

        qq(item).removeClass(this._classes.retrying);
        qq(this._find(item, 'progressBar')).hide();

        if (!this._options.disableCancelForFormUploads || qq.UploadHandlerXhr.isSupported()) {
            qq(this._find(item, 'cancel')).hide();
        }
        qq(this._find(item, 'spinner')).hide();

        if (result.success){
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
    _onUpload: function(id, fileName, xhr){
        qq.FineUploaderBasic.prototype._onUpload.apply(this, arguments);

        var item = this.getItemByFileId(id);
        this._showSpinner(item);
    },
    _onBeforeAutoRetry: function(id) {
        var item, progressBar, cancelLink, failTextEl, retryNumForDisplay, maxAuto, retryNote;

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
        if (qq.FineUploaderBasic.prototype._onBeforeManualRetry.apply(this, arguments)) {
            var item = this.getItemByFileId(id);
            this._find(item, 'progressBar').style.width = 0;
            qq(item).removeClass(this._classes.fail);
            this._showSpinner(item);
            this._showCancelLink(item);
            return true;
        }
        return false;
    },
    _addToList: function(id, fileName){
        var item = qq.toElement(this._options.fileTemplate);
        if (this._options.disableCancelForFormUploads && !qq.UploadHandlerXhr.isSupported()) {
            var cancelLink = this._find(item, 'cancel');
            qq(cancelLink).remove();
        }

        item.qqFileId = id;

        var fileElement = this._find(item, 'file');
        qq(fileElement).setText(this._formatFileName(fileName));
        qq(this._find(item, 'size')).hide();
        if (!this._options.multiple) this._clearList();
        this._listElement.appendChild(item);
    },
    _clearList: function(){
        this._listElement.innerHTML = '';
        this.clearStoredFiles();
    },
    /**
     * delegate click event for cancel & retry links
     **/
    _bindCancelAndRetryEvents: function(){
        var self = this,
            list = this._listElement;

        this._attach(list, 'click', function(e){
            e = e || window.event;
            var target = e.target || e.srcElement;

            if (qq(target).hasClass(self._classes.cancel) || qq(target).hasClass(self._classes.retry)){
                qq.preventDefault(e);

                var item = target.parentNode;
                while(item.qqFileId == undefined) {
                    item = target = target.parentNode;
                }

                if (qq(target).hasClass(self._classes.cancel)) {
                    self.cancel(item.qqFileId);
                    qq(item).remove();
                }
                else {
                    qq(item).removeClass(self._classes.retryable);
                    self.retry(item.qqFileId);
                }
            }
        });
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
    //TODO turn this into a real tooltip, with click trigger (so it is usable on mobile devices).  See case #355 for details.
    _showTooltip: function(item, text) {
        item.title = text;
    },
    _showSpinner: function(item) {
        var spinnerEl = this._find(item, 'spinner');
        spinnerEl.style.display = "inline-block";
    },
    _showCancelLink: function(item) {
        if (!this._options.disableCancelForFormUploads || qq.UploadHandlerXhr.isSupported()) {
            var cancelLink = this._find(item, 'cancel');
            cancelLink.style.display = 'inline';
        }
    },
    _error: function(code, fileName){
        var message = qq.FineUploaderBasic.prototype._error.apply(this, arguments);
        this._options.showMessage(message);
    }
});

qq.UploadDropZone = function(o){
    this._options = {
        element: null,
        onEnter: function(e){},
        onLeave: function(e){},
        // is not fired when leaving element by hovering descendants
        onLeaveNotDescendants: function(e){},
        onDrop: function(e){}
    };
    qq.extend(this._options, o);
    qq.extend(this, qq.DisposeSupport);

    this._element = this._options.element;

    this._disableDropOutside();
    this._attachEvents();
};

qq.UploadDropZone.prototype = {
    _dragover_should_be_canceled: function(){
        return qq.safari() || (qq.firefox() && qq.windows());
    },
    _disableDropOutside: function(e){
        // run only once for all instances
        if (!qq.UploadDropZone.dropOutsideDisabled ){

            // for these cases we need to catch onDrop to reset dropArea
            if (this._dragover_should_be_canceled){
                qq(document).attach('dragover', function(e){
                    e.preventDefault();
                });
            } else {
                qq(document).attach('dragover', function(e){
                    if (e.dataTransfer){
                        e.dataTransfer.dropEffect = 'none';
                        e.preventDefault();
                    }
                });
            }

            qq.UploadDropZone.dropOutsideDisabled = true;
        }
    },
    _attachEvents: function(){
        var self = this;

        self._attach(self._element, 'dragover', function(e){
            if (!self._isValidFileDrag(e)) return;

            var effect = qq.ie() ? null : e.dataTransfer.effectAllowed;
            if (effect == 'move' || effect == 'linkMove'){
                e.dataTransfer.dropEffect = 'move'; // for FF (only move allowed)
            } else {
                e.dataTransfer.dropEffect = 'copy'; // for Chrome
            }

            e.stopPropagation();
            e.preventDefault();
        });

        self._attach(self._element, 'dragenter', function(e){
            if (!self._isValidFileDrag(e)) return;

            self._options.onEnter(e);
        });

        self._attach(self._element, 'dragleave', function(e){
            if (!self._isValidFileDrag(e)) return;

            self._options.onLeave(e);

            var relatedTarget = document.elementFromPoint(e.clientX, e.clientY);
            // do not fire when moving a mouse over a descendant
            if (qq(this).contains(relatedTarget)) return;

            self._options.onLeaveNotDescendants(e);
        });

        self._attach(self._element, 'drop', function(e){
            if (!self._isValidFileDrag(e)) return;

            e.preventDefault();
            self._options.onDrop(e);
        });
    },
    _isValidFileDrag: function(e){
        // e.dataTransfer currently causing IE errors
        // IE9 does NOT support file API, so drag-and-drop is not possible
        if (qq.ie() && !qq.ie10()) return false;

        var dt = e.dataTransfer,
        // do not check dt.types.contains in webkit, because it crashes safari 4
            isSafari = qq.safari();

        // dt.effectAllowed is none in Safari 5
        // dt.types.contains check is for firefox
        var effectTest = qq.ie10() ? true : dt.effectAllowed != 'none';
        return dt && effectTest && (dt.files || (!isSafari && dt.types.contains && dt.types.contains('Files')));
    }
};
