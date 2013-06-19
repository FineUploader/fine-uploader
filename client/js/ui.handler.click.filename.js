// Handles click events on a file item (FineUploader mode).
qq.FilenameClickHandler = function(s) {
    "use strict";

    var baseApi = {},
        spec = {
            listElement: document,
            log: function(message, lvl) {},
            classes: {
                file: 'qq-upload-file'
            },
            onGetUploadStatus: function(fileId) {},
            onGetName: function(fileId) {},
            onSetName: function(fileId, newName) {},
            onGetInput: function(item) {}
    };

    function getFilenameSansExtension(fileId) {
        var filenameSansExt = spec.onGetName(fileId),
            extIdx = filenameSansExt.lastIndexOf('.');

        if (extIdx > 0) {
            filenameSansExt = filenameSansExt.substr(0, extIdx);
        }

        return filenameSansExt;
    }

    function getOriginalExtension(fileId) {
        var origName = spec.onGetName(fileId),
            extIdx = origName.lastIndexOf('.'),
            ext;

        if (extIdx > 0) {
            return origName.substr(extIdx, origName.length - extIdx);
        }
    }

    // This will be called by the base handler when a click event is received on the list element.
    function examineEvent(target, event) {
        if (qq(target).hasClass(spec.classes.file)) {
            var item = baseApi.getItemFromEventTarget(target),
                fileId = baseApi.getFileIdFromItem(item),
                status = spec.onGetUploadStatus(fileId);

            // We only allow users to change filenames of files that have been submitted but not yet uploaded.
            if (status === qq.status.SUBMITTED) {
                spec.log(qq.format("Detected valid filename click event on file '{}', ID: {}.", spec.onGetName(fileId), fileId));
                qq.preventDefault(event);

                handleFilenameClick(fileId, target, item);
            }
        }
    }

    // Hide the input, change the displayed text, and record
    // the new filename when the input loses focus.
    function handleNameUpdate(newFilenameInputEl, filenameDisplayEl, fileId) {
        var newName = newFilenameInputEl.value;

        qq(newFilenameInputEl).hide();

        newName = newName + getOriginalExtension(fileId);

        qq(filenameDisplayEl).setText(newName);
        spec.onSetName(fileId, newName);

        qq(filenameDisplayEl).css({display: ''});
    }

    function registerInputBlurHandler(inputEl, displayEl, fileId) {
        baseApi.getDisposeSupport().attach(inputEl, 'blur', function() {
            handleNameUpdate(inputEl, displayEl, fileId)
        });
    }

    function registerInputEnterKeyHandler(inputEl, displayEl, fileId) {
        baseApi.getDisposeSupport().attach(inputEl, 'keyup', function(event) {
            var code = event.keyCode || event.which;

            if (code === 13) {
                handleNameUpdate(inputEl, displayEl, fileId)
            }
        });
    }

    // Allow the filename to be "changed", then update the file displayed when the input loses focus
    function handleFilenameClick(fileId, target, item) {
        var newFilenameInputEl = spec.onGetInput(item);

        // Here we hide the filename and show the input element
        // which we will use to store the new filename.
        qq(target).hide();
        qq(newFilenameInputEl).css({display: ''});

        newFilenameInputEl.value = getFilenameSansExtension(fileId);

        qq(newFilenameInputEl).insertBefore(target);
        newFilenameInputEl.focus();

        registerInputBlurHandler(newFilenameInputEl, target, fileId);
        registerInputEnterKeyHandler(newFilenameInputEl, target, fileId);
    }

    qq.extend(spec, s);

    spec.eventType = 'click';
    spec.onHandled = examineEvent;
    spec.attachTo = spec.listElement;

    qq.extend(this, new qq.UiEventHandler(spec, baseApi));
};
