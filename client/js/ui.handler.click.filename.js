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
            onGetInput: function(item) {},
            onEditingStatusChange: function(fileId, isEditing) {}
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
            extIdx = origName.lastIndexOf('.');

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

    // Callback iff the name has been changed
    function handleNameUpdate(newFilenameInputEl, fileId) {
        var newName = newFilenameInputEl.value;

        if (newName !== undefined && qq.trimStr(newName).length > 0) {
            newName = newName + getOriginalExtension(fileId);

            spec.onSetName(fileId, newName);
        }

        spec.onEditingStatusChange(fileId, false);
    }

    function registerInputBlurHandler(inputEl, fileId) {
        baseApi.getDisposeSupport().attach(inputEl, 'blur', function() {
            handleNameUpdate(inputEl, fileId)
        });
    }

    function registerInputEnterKeyHandler(inputEl, fileId) {
        baseApi.getDisposeSupport().attach(inputEl, 'keyup', function(event) {

            var code = event.keyCode || event.which;

            if (code === 13) {
                handleNameUpdate(inputEl, fileId)
            }
        });
    }

    // Allow the filename to be "changed", then callback when the input loses focus
    function handleFilenameClick(fileId, target, item) {
        var newFilenameInputEl = spec.onGetInput(item);

        spec.onEditingStatusChange(fileId, true);

        newFilenameInputEl.value = getFilenameSansExtension(fileId);

        qq(newFilenameInputEl).insertBefore(target);
        newFilenameInputEl.focus();

        registerInputBlurHandler(newFilenameInputEl, fileId);
        registerInputEnterKeyHandler(newFilenameInputEl, fileId);
    }

    qq.extend(spec, s);

    spec.eventType = 'click';
    spec.onHandled = examineEvent;
    spec.attachTo = spec.listElement;

    qq.extend(this, new qq.UiEventHandler(spec, baseApi));
};
