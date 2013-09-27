qq.DeleteRetryOrCancelClickHandler = function(s) {
    "use strict";

    var inheritedInternalApi = {},
        spec = {
            listElement: document,
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
        if (qq(target).hasClass(spec.classes.cancel)
            || qq(target).hasClass(spec.classes.retry)
            || qq(target).hasClass(spec.classes.deleteButton)) {

            var item = inheritedInternalApi.getItemFromEventTarget(target),
                fileId = inheritedInternalApi.getFileIdFromItem(item);

            qq.preventDefault(event);

            spec.log(qq.format("Detected valid cancel, retry, or delete click event on file '{}', ID: {}.", spec.onGetName(fileId), fileId));
            deleteRetryOrCancel(target, fileId);
        }
    }

    function deleteRetryOrCancel(target, fileId) {
        if (qq(target).hasClass(spec.classes.deleteButton)) {
            spec.onDeleteFile(fileId);
        }
        else if (qq(target).hasClass(spec.classes.cancel)) {
            spec.onCancel(fileId);
        }
        else {
            spec.onRetry(fileId);
        }
    }

    qq.extend(spec, s);

    spec.eventType = 'click';
    spec.onHandled = examineEvent;
    spec.attachTo = spec.listElement;

    qq.extend(this, new qq.UiEventHandler(spec, inheritedInternalApi));
};
