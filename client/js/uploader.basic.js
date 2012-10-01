var qq = qq || {};

/**
 * Creates upload button, validates upload, but doesn't create file list or dd.
 */
qq.FileUploaderBasic = function(o){
    var that = this;
    this._options = {
        debug: false,
        endpoint: '/server/upload',
        params: {},
        customHeaders: {},
        button: null,
        multiple: true,
        maxConnections: 3,
        disableCancelForFormUploads: false,
        autoUpload: true,
        forceMultipart: false,
        inputName: 'qqfile',
        validation: {
            allowedExtensions: [],
            acceptFiles: null,		// comma separated string of mime-types for browser to display in browse dialog
            sizeLimit: 0,
            minSizeLimit: 0,
            stopOnFirstInvalidFile: true
        },
        callbacks: {
            // return false to cancel submit
            onSubmit: function(id, fileName){},
            onComplete: function(id, fileName, responseJSON){},
            onCancel: function(id, fileName){},
            onUpload: function(id, fileName, xhr){},
            onProgress: function(id, fileName, loaded, total){},
            onError: function(id, fileName, reason) {}
        },
        // messages
        messages: {
            typeError: "{file} has an invalid extension. Valid extension(s): {extensions}.",
            sizeError: "{file} is too large, maximum file size is {sizeLimit}.",
            minSizeError: "{file} is too small, minimum file size is {minSizeLimit}.",
            emptyError: "{file} is empty, please select files again without it.",
            noFilesError: "No files to upload.",
            onLeave: "The files are being uploaded, if you leave now the upload will be cancelled."
        },
        showMessage: function(message){
            alert(message);
        }
    };

    qq.extend(this._options, o, true);
    this._wrapCallbacks();
    qq.extend(this, qq.DisposeSupport);

    // number of files being uploaded
    this._filesInProgress = 0;

    this._storedFileIds = [];

    this._handler = this._createUploadHandler();

    if (this._options.button){
        this._button = this._createUploadButton(this._options.button);
    }

    this._preventLeaveInProgress();
};

qq.FileUploaderBasic.prototype = {
    log: function(str){
        if (this._options.debug && window.console) console.log('[uploader] ' + str);
    },
    setParams: function(params){
        this._options.params = params;
    },
    getInProgress: function(){
        return this._filesInProgress;
    },
    uploadStoredFiles: function(){
        for (var i = 0; i < this._storedFileIds.length; i++) {
            this._filesInProgress++;
            this._handler.upload(this._storedFileIds[i], this._options.params);
        }
    },
    clearStoredFiles: function(){
        this._storedFileIds = [];
    },
    _createUploadButton: function(element){
        var self = this;

        var button = new qq.UploadButton({
            element: element,
            multiple: this._options.multiple && qq.UploadHandlerXhr.isSupported(),
            acceptFiles: this._options.validation.acceptFiles,
            onChange: function(input){
                self._onInputChange(input);
            }
        });

        this.addDisposer(function() { button.dispose(); });
        return button;
    },
    _createUploadHandler: function(){
        var self = this,
            handlerClass;

        if(qq.UploadHandlerXhr.isSupported()){
            handlerClass = 'UploadHandlerXhr';
        } else {
            handlerClass = 'UploadHandlerForm';
        }

        var handler = new qq[handlerClass]({
            debug: this._options.debug,
            endpoint: this._options.endpoint,
            forceMultipart: this._options.forceMultipart,
            maxConnections: this._options.maxConnections,
            customHeaders: this._options.customHeaders,
            inputName: this._options.inputName,
            demoMode: this._options.demoMode,
            onProgress: function(id, fileName, loaded, total){
                self._onProgress(id, fileName, loaded, total);
                self._options.callbacks.onProgress(id, fileName, loaded, total);
            },
            onComplete: function(id, fileName, result){
                self._onComplete(id, fileName, result);
                self._options.callbacks.onComplete(id, fileName, result);
            },
            onCancel: function(id, fileName){
                var indexToRemove = qq.indexOf(self._storedFileIds, id);
                if (indexToRemove >= 0) {
                    self._storedFileIds.splice(indexToRemove, 1);
                }

                self._onCancel(id, fileName);
                self._options.callbacks.onCancel(id, fileName);
            },
            onError: self._options.callbacks.onError,
            onUpload: function(id, fileName, xhr){
                self._onUpload(id, fileName, xhr);
                self._options.callbacks.onUpload(id, fileName, xhr);
            }
        });

        return handler;
    },
    _preventLeaveInProgress: function(){
        var self = this;

        this._attach(window, 'beforeunload', function(e){
            if (!self._filesInProgress){return;}

            var e = e || window.event;
            // for ie, ff
            e.returnValue = self._options.messages.onLeave;
            // for webkit
            return self._options.messages.onLeave;
        });
    },
    _onSubmit: function(id, fileName){
        if (this._options.autoUpload) {
            this._filesInProgress++;
        }
    },
    _onProgress: function(id, fileName, loaded, total){
    },
    _onComplete: function(id, fileName, result){
        var indexToRemove = qq.indexOf(this._storedFileIds, id);
        if (indexToRemove >= 0) {
            this._storedFileIds.splice(indexToRemove, 1);
        }
        this._filesInProgress--;
    },
    _onCancel: function(id, fileName){
        if (this._options.autoUpload) {
            this._filesInProgress--;
        }
    },
    _onUpload: function(id, fileName, xhr){
    },
    _onInputChange: function(input){
        if (this._handler instanceof qq.UploadHandlerXhr){
            this._uploadFileList(input.files);
        } else {
            if (this._validateFile(input)){
                this._uploadFile(input);
            }
        }
        this._button.reset();
    },
    _uploadFileList: function(files){
        if (files.length > 0) {
            for (var i=0; i<files.length; i++){
                if (this._validateFile(files[i])){
                    this._uploadFile(files[i]);
                } else {
                    if (this._options.validation.stopOnFirstInvalidFile){
                        return;
                    }
                }
            }
        }
        else {
            this._error('noFilesError', "");
        }
    },
    _uploadFile: function(fileContainer){
        var id = this._handler.add(fileContainer);
        var fileName = this._handler.getName(id);

        if (this._options.callbacks.onSubmit(id, fileName) !== false){
            this._onSubmit(id, fileName);
            if (this._options.autoUpload) {
                this._handler.upload(id, this._options.params);
            }
            else {
                this._storeFileForLater(id);
            }
        }
    },
    _storeFileForLater: function(id) {
        this._storedFileIds.push(id);
    },
    _validateFile: function(file){
        var name, size;

        if (file.value){
            // it is a file input
            // get input value and remove path to normalize
            name = file.value.replace(/.*(\/|\\)/, "");
        } else {
            // fix missing properties in Safari 4 and firefox 11.0a2
            name = (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
            size = (file.fileSize !== null && file.fileSize !== undefined) ? file.fileSize : file.size;
        }

        if (! this._isAllowedExtension(name)){
            this._error('typeError', name);
            return false;

        } else if (size === 0){
            this._error('emptyError', name);
            return false;

        } else if (size && this._options.validation.sizeLimit && size > this._options.validation.sizeLimit){
            this._error('sizeError', name);
            return false;

        } else if (size && size < this._options.validation.minSizeLimit){
            this._error('minSizeError', name);
            return false;
        }

        return true;
    },
    _error: function(code, fileName){
        var message = this._options.messages[code];
        function r(name, replacement){ message = message.replace(name, replacement); }

        var extensions = this._options.validation.allowedExtensions.join(', ');

        r('{file}', this._formatFileName(fileName));
        r('{extensions}', extensions);
        r('{sizeLimit}', this._formatSize(this._options.validation.sizeLimit));
        r('{minSizeLimit}', this._formatSize(this._options.validation.minSizeLimit));

        this._options.callbacks.onError(null, fileName, message);
        this._options.showMessage(message);
    },
    _formatFileName: function(name){
        if (name.length > 33){
            name = name.slice(0, 19) + '...' + name.slice(-13);
        }
        return name;
    },
    _isAllowedExtension: function(fileName){
        var ext = (-1 !== fileName.indexOf('.'))
            ? fileName.replace(/.*[.]/, '').toLowerCase()
            : '';
        var allowed = this._options.validation.allowedExtensions;

        if (!allowed.length){return true;}

        for (var i=0; i<allowed.length; i++){
            if (allowed[i].toLowerCase() == ext){ return true;}
        }

        return false;
    },
    _formatSize: function(bytes){
        var i = -1;
        do {
            bytes = bytes / 1024;
            i++;
        } while (bytes > 99);

        return Math.max(bytes, 0.1).toFixed(1) + ['kB', 'MB', 'GB', 'TB', 'PB', 'EB'][i];
    },
    _wrapCallbacks: function() {
        var self, safeCallback;

        self = this;

        safeCallback = function(callback, args) {
            try {
                return callback.apply(this, args);
            }
            catch (exception) {
                self.log("Caught " + exception + " in callback: " + callback);
            }
        }

        for (var prop in this._options) {
            if (/^on[A-Z]/.test(prop)) {
                (function() {
                    var oldCallback = self._options[prop];
                    self._options[prop] = function() {
                        return safeCallback(oldCallback, arguments);
                    }
                }());
            }
        }
    }
};
