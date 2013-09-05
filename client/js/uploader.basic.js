qq.FineUploaderBasic = function(o) {
    // These options define FineUploaderBasic mode.
    this._options = {
        debug: false,
        button: null,
        multiple: true,
        maxConnections: 3,
        disableCancelForFormUploads: false,
        autoUpload: true,
        request: {
            endpoint: '/server/upload',
            params: {},
            paramsInBody: true,
            customHeaders: {},
            forceMultipart: true,
            inputName: 'qqfile',
            uuidName: 'qquuid',
            totalFileSizeName: 'qqtotalfilesize',
            filenameParam: 'qqfilename'
        },
        validation: {
            allowedExtensions: [],
            sizeLimit: 0,
            minSizeLimit: 0,
            itemLimit: 0,
            stopOnFirstInvalidFile: true,
            acceptFiles: null
        },
        callbacks: {
            onSubmit: function(id, name){},
            onSubmitted: function(id, name){},
            onComplete: function(id, name, responseJSON, maybeXhr){},
            onCancel: function(id, name){},
            onUpload: function(id, name){},
            onUploadChunk: function(id, name, chunkData){},
            onResume: function(id, fileName, chunkData){},
            onProgress: function(id, name, loaded, total){},
            onError: function(id, name, reason, maybeXhrOrXdr) {},
            onAutoRetry: function(id, name, attemptNumber) {},
            onManualRetry: function(id, name) {},
            onValidateBatch: function(fileOrBlobData) {},
            onValidate: function(fileOrBlobData) {},
            onSubmitDelete: function(id) {},
            onDelete: function(id){},
            onDeleteComplete: function(id, xhrOrXdr, isError){},
            onPasteReceived: function(blob) {},
            onStatusChange: function(id, oldStatus, newStatus) {}
        },
        messages: {
            typeError: "{file} has an invalid extension. Valid extension(s): {extensions}.",
            sizeError: "{file} is too large, maximum file size is {sizeLimit}.",
            minSizeError: "{file} is too small, minimum file size is {minSizeLimit}.",
            emptyError: "{file} is empty, please select files again without it.",
            noFilesError: "No files to upload.",
            tooManyItemsError: "Too many items ({netItems}) would be uploaded.  Item limit is {itemLimit}.",
            retryFailTooManyItems: "Retry failed - you have reached your file limit.",
            onLeave: "The files are being uploaded, if you leave now the upload will be cancelled."
        },
        retry: {
            enableAuto: false,
            maxAutoAttempts: 3,
            autoAttemptDelay: 5,
            preventRetryResponseProperty: 'preventRetry'
        },
        classes: {
            buttonHover: 'qq-upload-button-hover',
            buttonFocus: 'qq-upload-button-focus'
        },
        chunking: {
            enabled: false,
            partSize: 2000000,
            paramNames: {
                partIndex: 'qqpartindex',
                partByteOffset: 'qqpartbyteoffset',
                chunkSize: 'qqchunksize',
                totalFileSize: 'qqtotalfilesize',
                totalParts: 'qqtotalparts'
            }
        },
        resume: {
            enabled: false,
            id: null,
            cookiesExpireIn: 7, //days
            paramNames: {
                resuming: "qqresume"
            }
        },
        formatFileName: function(fileOrBlobName) {
            if (fileOrBlobName !== undefined && fileOrBlobName.length > 33) {
                fileOrBlobName = fileOrBlobName.slice(0, 19) + '...' + fileOrBlobName.slice(-14);
            }
            return fileOrBlobName;
        },
        text: {
            defaultResponseError: "Upload failure reason unknown",
            sizeSymbols: ['kB', 'MB', 'GB', 'TB', 'PB', 'EB']
        },
        deleteFile : {
            enabled: false,
            method: "DELETE",
            endpoint: '/server/upload',
            customHeaders: {},
            params: {}
        },
        cors: {
            expected: false,
            sendCredentials: false,
            allowXdr: false
        },
        blobs: {
            defaultName: 'misc_data'
        },
        paste: {
            targetElement: null,
            defaultName: 'pasted_image'
        },
        camera: {
            ios: false,

            // if ios is true: button is null means target the default button, otherwise target the button specified
            button: null
        },

        // This refers to additional upload buttons to be handled by Fine Uploader.
        // Each element is an object, containing `element` as the only required
        // property.  The `element` must be a container that will ultimately
        // contain an invisible `<input type="file">` created by Fine Uploader.
        // Optional properties of each object include `multiple`, `validation`,
        // and `folders`.
        extraButtons: []
    };

    // Replace any default options with user defined ones
    qq.extend(this._options, o, true);

    this._buttons = [];
    this._extraButtonSpecs = {};
    this._buttonIdsForFileIds = [];

    this._wrapCallbacks();
    this._disposeSupport =  new qq.DisposeSupport();

    this._filesInProgress = [];
    this._storedIds = [];
    this._autoRetries = [];
    this._retryTimeouts = [];
    this._preventRetries = [];

    this._netUploadedOrQueued = 0;
    this._netUploaded = 0;
    this._uploadData = this._createUploadDataTracker();

    this._paramsStore = this._createParamsStore("request");
    this._deleteFileParamsStore = this._createParamsStore("deleteFile");

    this._endpointStore = this._createEndpointStore("request");
    this._deleteFileEndpointStore = this._createEndpointStore("deleteFile");

    this._handler = this._createUploadHandler();
    this._deleteHandler = this._createDeleteHandler();

    if (this._options.button) {
        this._defaultButtonId = this._createUploadButton({element: this._options.button}).getButtonId();
    }

    this._generateExtraButtonSpecs();

    this._handleCameraAccess();

    if (this._options.paste.targetElement) {
        this._pasteHandler = this._createPasteHandler();
    }

    this._preventLeaveInProgress();
};

// Define the private & public API methods.
qq.FineUploaderBasic.prototype = qq.basePublicApi;
qq.extend(qq.FineUploaderBasic.prototype, qq.basePrivateApi);
