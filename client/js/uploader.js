/*globals qq */
/**
 * This defines FineUploader mode, which is a default UI w/ drag & drop uploading.
 */
qq.FineUploader = function(o, namespace) {
    "use strict";

    // By default this should inherit instance data from FineUploaderBasic, but this can be overridden
    // if the (internal) caller defines a different parent.  The parent is also used by
    // the private and public API functions that need to delegate to a parent function.
    this._parent = namespace ? qq[namespace].FineUploaderBasic : qq.FineUploaderBasic;
    this._parent.apply(this, arguments);

    // Options provided by FineUploader mode
    qq.extend(this._options, {
        element: null,

        button: null,

        listElement: null,

        dragAndDrop: {
            extraDropzones: [],
            reportDirectoryPaths: false
        },

        text: {
            formatProgress: "{percent}% of {total_size}",
            failUpload: "Upload failed",
            waitingForResponse: "Processing...",
            paused: "Paused"
        },

        template: "qq-template",

        classes: {
            retrying: "qq-upload-retrying",
            retryable: "qq-upload-retryable",
            success: "qq-upload-success",
            fail: "qq-upload-fail",
            editable: "qq-editable",
            hide: "qq-hide",
            dropActive: "qq-upload-drop-area-active"
        },

        failedUploadTextDisplay: {
            mode: "default", //default, custom, or none
            maxChars: 50,
            responseProperty: "error",
            enableTooltip: true
        },

        messages: {
            tooManyFilesError: "You may only drop one file",
            unsupportedBrowser: "Unrecoverable error - this browser does not permit file uploading of any kind."
        },

        retry: {
            showAutoRetryNote: true,
            autoRetryNote: "Retrying {retryNum}/{maxAuto}..."
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

        thumbnails: {
            maxCount: 0,
            placeholders: {
                waitUntilResponse: false,
                notAvailablePath: null,
                waitingPath: null
            },
            timeBetweenThumbs: 750
        },

        scaling: {
            hideScaled: false
        },

        showMessage: function(message) {
            setTimeout(function() {
                window.alert(message);
            }, 0);
        },

        showConfirm: function(message) {
            return window.confirm(message);
        },

        showPrompt: function(message, defaultValue) {
            return window.prompt(message, defaultValue);
        }
    }, true);

    // Replace any default options with user defined ones
    qq.extend(this._options, o, true);

    this._templating = new qq.Templating({
        log: qq.bind(this.log, this),
        templateIdOrEl: this._options.template,
        containerEl: this._options.element,
        fileContainerEl: this._options.listElement,
        button: this._options.button,
        imageGenerator: this._imageGenerator,
        classes: {
            hide: this._options.classes.hide,
            editable: this._options.classes.editable
        },
        limits: {
            maxThumbs: this._options.thumbnails.maxCount,
            timeBetweenThumbs: this._options.thumbnails.timeBetweenThumbs
        },
        placeholders: {
            waitUntilUpdate: this._options.thumbnails.placeholders.waitUntilResponse,
            thumbnailNotAvailable: this._options.thumbnails.placeholders.notAvailablePath,
            waitingForThumbnail: this._options.thumbnails.placeholders.waitingPath
        },
        text: this._options.text
    });

    if (this._options.workarounds.ios8SafariUploads && qq.ios800() && qq.iosSafari()) {
        this._templating.renderFailure(this._options.messages.unsupportedBrowserIos8Safari);
    }
    else if (!qq.supportedFeatures.uploading || (this._options.cors.expected && !qq.supportedFeatures.uploadCors)) {
        this._templating.renderFailure(this._options.messages.unsupportedBrowser);
    }
    else {
        this._wrapCallbacks();

        this._templating.render();

        this._classes = this._options.classes;

        if (!this._options.button && this._templating.getButton()) {
            this._defaultButtonId = this._createUploadButton({element: this._templating.getButton()}).getButtonId();
        }

        this._setupClickAndEditEventHandlers();

        if (qq.DragAndDrop && qq.supportedFeatures.fileDrop) {
            this._dnd = this._setupDragAndDrop();
        }

        if (this._options.paste.targetElement && this._options.paste.promptForName) {
            if (qq.PasteSupport) {
                this._setupPastePrompt();
            }
            else {
                this.log("Paste support module not found.", "error");
            }
        }

        this._totalFilesInBatch = 0;
        this._filesInBatchAddedToUi = 0;
    }
};

// Inherit the base public & private API methods
qq.extend(qq.FineUploader.prototype, qq.basePublicApi);
qq.extend(qq.FineUploader.prototype, qq.basePrivateApi);

// Add the FineUploader/default UI public & private UI methods, which may override some base methods.
qq.extend(qq.FineUploader.prototype, qq.uiPublicApi);
qq.extend(qq.FineUploader.prototype, qq.uiPrivateApi);
