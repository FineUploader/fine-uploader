// Child of FilenameEditHandler.  Used to detect click events on filename display elements.
qq.FilenameClickHandler = function(s) {
    "use strict";

    var inheritedInternalApi = {},
        spec = {
            log: function(message, lvl) {},
            classes: {
                file: 'qq-upload-file',
                editNameIcon: 'qq-edit-filename-icon'
            },
            onGetUploadStatus: function(fileId) {},
            onGetName: function(fileId) {}
    };

    qq.extend(spec, s);

    // This will be called by the parent handler when a `click` event is received on the list element.
    function examineEvent(target, event) {
        if (qq(target).hasClass(spec.classes.file) || qq(target).hasClass(spec.classes.editNameIcon)) {
            var item = inheritedInternalApi.getItemFromEventTarget(target),
                fileId = inheritedInternalApi.getFileIdFromItem(item),
                status = spec.onGetUploadStatus(fileId);

            // We only allow users to change filenames of files that have been submitted but not yet uploaded.
            if (status === qq.status.SUBMITTED) {
                spec.log(qq.format("Detected valid filename click event on file '{}', ID: {}.", spec.onGetName(fileId), fileId));
                qq.preventDefault(event);

                inheritedInternalApi.handleFilenameEdit(fileId, target, item, true);
            }
        }
    }

    spec.eventType = 'click';
    spec.onHandled = examineEvent;

    return qq.extend(this, new qq.FilenameEditHandler(spec, inheritedInternalApi));
};
