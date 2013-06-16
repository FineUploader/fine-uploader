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
            onSetName: function(fileId, newName) {}
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

                handleFilenameClick(fileId, target);
            }
        }
    }

    // Allow the filename to be "changed", then update the file displayed when the input loses focus
    function handleFilenameClick(fileId, target) {
        var newFilenameInputEl;

        // Here we hide the filename and create/show an input element
        // which we will use to store the new filename.
        qq(target).hide();

        newFilenameInputEl = document.createElement('input');
        newFilenameInputEl.type = "text";
        newFilenameInputEl.value = getFilenameSansExtension(fileId);

        qq(newFilenameInputEl).insertBefore(target);
        newFilenameInputEl.focus();

        // Hide the input, change the displayed text, and record
        // the new filename when the input loses focus.
        baseApi.getDisposeSupport().attach(newFilenameInputEl, 'blur', function() {
            var newName = newFilenameInputEl.value;

            qq(newFilenameInputEl).remove();

            newName = newName + getOriginalExtension(fileId);

            qq(target).setText(newName);
            spec.onSetName(fileId, newName);

            qq(target).css({display: ''});
        });
    }

    qq.extend(spec, s);

    spec.eventType = 'click';
    spec.onHandled = examineEvent;
    spec.attachTo = spec.listElement;

    qq.extend(this, new qq.UiEventHandler(spec, baseApi));
};
