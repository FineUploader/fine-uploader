qq.DeleteRetryOrCancelClickHandler = function(s) {
    "use strict";

    var inheritedInternalApi = {},
        spec = {
            templating: null,
            log: function(message, lvl) {},
            classes: {
                cancel: 'qq-upload-cancel',
                deleteButton: 'qq-upload-delete',
                retry: 'qq-upload-retry'
            },
            onDeleteFile: function(fileId) {},
            onCancel: function(fileId) {},
            onRetry: function(fileId) {},
            onGetName: function(fileId) {}
    };

    function examineEvent(target, event) {
        if (spec.templating.isCancel(target) ||
            spec.templating.isRetry(target) ||
            spec.templating.isDelete(target)) {

            var fileId = spec.templating.getFileId(target);

            qq.preventDefault(event);

            spec.log(qq.format("Detected valid cancel, retry, or delete click event on file '{}', ID: {}.", spec.onGetName(fileId), fileId));
            deleteRetryOrCancel(target, fileId);
        }
    }

    function deleteRetryOrCancel(target, fileId) {
        if (spec.templating.isDelete(target)) {
            spec.onDeleteFile(fileId);
        }
        else if (spec.templating.isCancel(target)) {
            spec.onCancel(fileId);
        }
        else {
            spec.onRetry(fileId);
        }
    }

    qq.extend(spec, s);

    spec.eventType = 'click';
    spec.onHandled = examineEvent;
    spec.attachTo = spec.templating.getFileList();

    qq.extend(this, new qq.UiEventHandler(spec, inheritedInternalApi));
};
