// Child of FilenameEditHandler.  Used to detect focus events on file edit input elements.
qq.FilenameInputFocusHandler = function(s) {
    "use strict";

    var inheritedInternalApi = {},
        spec = {
            listElement: document,
            classes: {
                editFilenameInput: 'qq-edit-filename'
            },
            onGetUploadStatus: function(fileId) {},
            log: function(message, lvl) {}
    };

    qq.extend(spec, s);

    // This will be called by the parent handler when a `focusin` event is received on the list element.
    function handleInputFocus(target, event) {
        if (qq(target).hasClass(spec.classes.editFilenameInput)) {
            var item = inheritedInternalApi.getItemFromEventTarget(target),
                fileId = inheritedInternalApi.getFileIdFromItem(item),
                status = spec.onGetUploadStatus(fileId);

            if (status === qq.status.SUBMITTED) {
                spec.log(qq.format("Detected valid filename input focus event on file '{}', ID: {}.", spec.onGetName(fileId), fileId));
                inheritedInternalApi.handleFilenameEdit(fileId, target, item);
            }
        }
    }

    spec.eventType = 'focusin';
    spec.onHandled = handleInputFocus;

    return qq.extend(this, new qq.FilenameEditHandler(spec, inheritedInternalApi));
};
