// Handles click events on a file item (FineUploader mode).
qq.FilenameClickHandler = function(s) {
    "use strict";

    var baseApi = {},
        spec = {
            log: function(message, lvl) {},
            classes: {
                file: 'qq-upload-file'
            },
            onGetUploadStatus: function(fileId) {},
            onGetName: function(fileId) {}
    };

    qq.extend(spec, s);

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

                baseApi.handleFilenameEdit(fileId, target, item, true);
            }
        }
    }

    spec.eventType = 'click';
    spec.onHandled = examineEvent;

    return qq.extend(this, new qq.FilenameEditHandler(spec, baseApi));
};
