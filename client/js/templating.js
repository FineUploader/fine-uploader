qq.Templating = function(spec) {
    "use strict";

    var api,
        fileIdAttr = "qq-file-id",
        fileClassPrefix = "qq-file-id-",
        isCancelDisabled = false,
        options = {
            templateIdOrEl: "qq-template",
            containerEl: null,
            fileContainerEl: null,
            hideClass: "qq-hide",
            button: null,
            disableDnd: false
        },
        selectorClasses = {
            button: 'qq-upload-button-selector',
            drop: 'qq-upload-drop-area-selector',
            list: 'qq-upload-list-selector',
            progressBar: 'qq-progress-bar-selector',
            file: 'qq-upload-file-selector',
            spinner: 'qq-upload-spinner-selector',
            size: 'qq-upload-size-selector',
            cancel: 'qq-upload-cancel-selector',
            deleteButton: 'qq-upload-delete-selector',
            retry: 'qq-upload-retry-selector',
            statusText: 'qq-upload-status-text-selector',
            editFilenameInput: 'qq-edit-filename-selector',
            editNameIcon: 'qq-edit-filename-icon-selector',
            dropProcessing: 'qq-drop-processing-selector',
            dropProcessingSpinner: 'qq-drop-processing-spinner-selector'
        },
        templateHtml, container, fileList;

    qq.extend(options, spec);
    container = options.containerEl;


    function getTemplateHtml() {
        var scriptHtml, fileListNode, tempTemplateEl, fileListHtml, defaultButton, dropzone;

        if (qq.isString(options.templateIdOrEl)) {
            scriptHtml = document.getElementById(options.templateIdOrEl).innerHTML;
        }
        else {
            scriptHtml = options.templateIdOrEl.innerHTML;
        }

        scriptHtml = qq.trimStr(scriptHtml);
        tempTemplateEl = document.createElement("div");
        tempTemplateEl.appendChild(qq.toElement(scriptHtml));

        if (spec.button) {
            defaultButton = qq(tempTemplateEl).getByClass(selectorClasses.button)[0];
            if (defaultButton) {
                qq(defaultButton).remove();
            }
        }

        if (spec.disableDnd) {
            dropzone = qq(tempTemplateEl).getByClass(selectorClasses.drop)[0];
            if (dropzone) {
                qq(dropzone).remove();
            }
        }

        fileListNode = qq(tempTemplateEl).getByClass(selectorClasses.list)[0];
        fileListHtml = fileListNode.innerHTML;
        fileListNode.innerHTML = "";

        return {
            template: qq.trimStr(tempTemplateEl.innerHTML),
            fileTemplate: qq.trimStr(fileListHtml)
        }
    }

    function getFile(id) {
        return qq(fileList).getByClass(fileClassPrefix + id)[0];
    }

    function getTemplateEl(context, cssClass) {
        return qq(context).getByClass(cssClass)[0];
    }

    function prependFile(el, index) {
        var parentEl = fileList,
            beforeEl = parentEl.firstChild;

        if (index > 0) {
            beforeEl = qq(parentEl).children()[index].nextSibling;

        }

        parentEl.insertBefore(el, beforeEl);
    }

    function getCancel(id) {
        return getTemplateEl(getFile(id), selectorClasses.cancel);
    }

    templateHtml = getTemplateHtml();

    api = {
        render: function() {
            container.innerHTML = templateHtml.template;
            fileList = options.fileContainerEl || getTemplateEl(container, selectorClasses.list)
        },

        renderFailure: function(message) {
            var cantRenderEl = qq.toElement(message);
            container.innerHTML = "";
            container.appendChild(cantRenderEl);
        },

        reset: function() {
            api.render();
        },

        clearFiles: function() {
            fileList.innerHTML = "";
        },

        disableCancel: function() {
            isCancelDisabled = true;
        },

        addFile: function(id, name, prependInfo) {
            var fileEl = qq.toElement(templateHtml.fileTemplate),
                fileNameEl = getTemplateEl(fileEl, selectorClasses.file);

            qq(fileEl).addClass(fileClassPrefix + id);
            qq(fileNameEl).setText(name);
            fileEl.setAttribute(fileIdAttr, id);

            if (prependInfo) {
                prependFile(fileEl, prependInfo.index);
            }
            else {
                fileList.appendChild(fileEl);
            }

            if (isCancelDisabled) {
                api.hideCancel(id);
            }
        },

        removeFile: function(id) {
            qq(getFile(id)).remove();
        },

        getFileId: function(el) {
            var currentNode = el;

            while (currentNode.getAttribute(fileIdAttr) == null) {
                currentNode = el.parentNode;
            }

            return currentNode.getAttribute(fileIdAttr);
        },

        getFileList: function() {
            return fileList;
        },

        getFileName: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.file);
        },

        isFileName: function(el) {
            return qq(el).hasClass(selectorClasses.file);
        },

        getButton: function() {
            return options.button || getTemplateEl(container, selectorClasses.button);
        },

        getDropProcessing: function() {
            return getTemplateEl(container, selectorClasses.dropProcessing);
        },

        getDropZone: function() {
            return getTemplateEl(container, selectorClasses.drop);
        },

        getFileContainer: function(id) {
            return getFile(id);
        },

        getEditIcon: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.editNameIcon);
        },

        isEditIcon: function(el) {
            return qq(el).hasClass(selectorClasses.editNameIcon);
        },

        getEditInput: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.editFilenameInput);
        },

        isEditInput: function(el) {
            return qq(el).hasClass(selectorClasses.editFilenameInput);
        },

        getProgressBar: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.progressBar);
        },

        showCancel: function(id) {
            if (!isCancelDisabled) {
                qq(getCancel(id)).removeClass(spec.hideClass);
            }
        },

        hideCancel: function(id) {
            qq(getCancel(id)).addClass(spec.hideClass);
        },

        isCancel: function(el)  {
            return qq(el).hasClass(selectorClasses.cancel);
        },

        getDelete: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.deleteButton);
        },

        isDelete: function(el) {
            return qq(el).hasClass(selectorClasses.deleteButton);
        },

        getRetry: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.retry);
        },

        isRetry: function(el) {
            return qq(el).hasClass(selectorClasses.retry);
        },

        setStatusText: function(id, text) {
            var textEl = getTemplateEl(getFile(id), selectorClasses.statusText);

            if (text == null) {
                qq(textEl).clearText();
            }
            else {
                qq(textEl).setText(text);
            }
        },

        getSize: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.size);
        },

        getSpinner: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.spinner);
        }
    };

    return api;
};
