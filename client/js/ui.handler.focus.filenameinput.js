qq.FilenameInputFocusHandler = function(s) {
    "use strict";

    var baseApi = {},
        spec = {
            listElement: document,
            classes: {
                editFilenameInput: 'qq-edit-filename'
            },
            log: function(message, lvl) {}
    };

    qq.extend(spec, s);

    function handleInputFocus(target, event) {
        if (qq(target).hasClass(spec.classes.editFilenameInput)) {
            var item = baseApi.getItemFromEventTarget(target),
                fileId = baseApi.getFileIdFromItem(item);

            baseApi.handleFilenameEdit(fileId, target, item);
        }
    }

    spec.eventType = 'focusin';
    spec.onHandled = handleInputFocus;

    return qq.extend(this, new qq.FilenameEditHandler(spec, baseApi));
};
