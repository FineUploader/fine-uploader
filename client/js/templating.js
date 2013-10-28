/**
 * Module responsible for rendering all Fine Uploader UI templates.  This module also asserts at least
 * a limited amount of control over the template elements after they are added to the DOM.
 * Wherever possible, this module asserts total control over template elements present in the DOM.
 *
 * @param spec Specification object used to control various templating behaviors
 * @returns various API methods
 * @constructor
 */
qq.Templating = function(spec) {
    "use strict";

    var FILE_ID_ATTR = "qq-file-id",
        FILE_CLASS_PREFIX = "qq-file-id-",
        THUMBNAIL_MAX_SIZE_ATTR = "qq-max-size",
        PREVIEW_GENERATED_ATTR = "qq-preview-generated",
        THUMBNAIL_SERVER_SCALE_ATTR = "qq-server-scale",
        // This variable is duplicated in the DnD module since it can function as a standalone as well
        HIDE_DROPZONE_ATTR = "qq-hide-dropzone",
        isCancelDisabled = false,
        thumbnailMaxSize = -1,
        options = {
            log: null,
            templateIdOrEl: "qq-template",
            containerEl: null,
            fileContainerEl: null,
            button: null,
            imageGenerator: null,
            classes: {
                hide: "qq-hide",
                editable: "qq-editable"
            },
            placeholders: {
                waitUntilUpdate: false,
                thumbnailNotAvailable: null,
                waitingForThumbnail: null
            }
        },
        selectorClasses = {
            button: 'qq-upload-button-selector',
            drop: 'qq-upload-drop-area-selector',
            list: 'qq-upload-list-selector',
            progressBarContainer: "qq-progress-bar-container-selector",
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
            dropProcessingSpinner: 'qq-drop-processing-spinner-selector',
            thumbnail: 'qq-thumbnail-selector'
        },
        log,
        api,
        isEditElementsExist,
        isRetryElementExist,
        templateHtml,
        container,
        fileList,
        showThumbnails,
        serverScale,
        cachedThumbnailNotAvailableImg,
        cachedWaitingForThumbnailImg;

    /**
     * Grabs the HTML from the script tag holding the template markup.  This function will also adjust
     * some internally-tracked state variables based on the contents of the template.
     * The template is filtered so that irrelevant elements (such as the drop zone if DnD is not supported)
     * are omitted from the DOM.  Useful errors will be thrown if the template cannot be parsed.
     *
     * @returns {{template: *, fileTemplate: *}} HTML for the top-level file items templates
     */
    function parseAndGetTemplate() {
        var scriptEl,
            scriptHtml,
            fileListNode,
            tempTemplateEl,
            fileListHtml,
            defaultButton,
            dropArea,
            thumbnail,
            dropProcessing;

        log("Parsing template");

        if (options.templateIdOrEl == null) {
            throw new Error("You MUST specify either a template element or ID!");
        }

        // Grab the contents of the script tag holding the template.
        if (qq.isString(options.templateIdOrEl)) {
            scriptEl = document.getElementById(options.templateIdOrEl);

            if (scriptEl === null) {
                throw new Error(qq.format("Cannot find template script at ID '{}'!", options.templateIdOrEl));
            }

            scriptHtml = scriptEl.innerHTML;
        }
        else {
            if (options.templateIdOrEl.innerHTML === undefined) {
                throw new Error("You have specified an invalid value for the template option!  " +
                    "It must be an ID or an Element.");
            }

            scriptHtml = options.templateIdOrEl.innerHTML;
        }

        scriptHtml = qq.trimStr(scriptHtml);
        tempTemplateEl = document.createElement("div");
        tempTemplateEl.appendChild(qq.toElement(scriptHtml));

        // Don't include the default template button in the DOM
        // if an alternate button container has been specified.
        if (options.button) {
            defaultButton = qq(tempTemplateEl).getByClass(selectorClasses.button)[0];
            if (defaultButton) {
                qq(defaultButton).remove();
            }
        }

        // Omit the drop processing element from the DOM if DnD is not supported by the UA.
        // NOTE: We are consciously not removing the drop zone if the UA doesn't support DnD
        // to support layouts where the drop zone is also a container for visible elements,
        // such as the file list.
        if (!qq.DragAndDrop || !qq.supportedFeatures.fileDrop) {
            dropProcessing = qq(tempTemplateEl).getByClass(selectorClasses.dropProcessing)[0];
            if (dropProcessing) {
                qq(dropProcessing).remove();
            }

        }

        dropArea = qq(tempTemplateEl).getByClass(selectorClasses.drop)[0];

        // If DnD is not available then remove
        // it from the DOM as well.
        if (dropArea && !qq.DragAndDrop) {
            qq.log("DnD module unavailable.", "info");
            qq(dropArea).remove();
        }

        // If there is a drop area defined in the template, and the current UA doesn't support DnD,
        // and the drop area is marked as "hide before enter", ensure it is hidden as the DnD module
        // will not do this (since we will not be loading the DnD module)
        if (dropArea
            && !qq.supportedFeatures.fileDrop
            && qq(dropArea).hasAttribute(HIDE_DROPZONE_ATTR)) {

            qq(dropArea).css({
                display: "none"
            });
        }

        // Ensure the `showThumbnails` flag is only set if the thumbnail element
        // is present in the template AND the current UA is capable of generating client-side previews.
        thumbnail = qq(tempTemplateEl).getByClass(selectorClasses.thumbnail)[0];
        if (!showThumbnails) {
            thumbnail && qq(thumbnail).remove();
        }
        else if (thumbnail) {
            thumbnailMaxSize = parseInt(thumbnail.getAttribute(THUMBNAIL_MAX_SIZE_ATTR));
            // Only enforce max size if the attr value is non-zero
            thumbnailMaxSize = thumbnailMaxSize > 0 ? thumbnailMaxSize : null;

            serverScale = qq(thumbnail).hasAttribute(THUMBNAIL_SERVER_SCALE_ATTR);
        }
        showThumbnails = showThumbnails && thumbnail;

        isEditElementsExist = qq(tempTemplateEl).getByClass(selectorClasses.editFilenameInput).length > 0;
        isRetryElementExist = qq(tempTemplateEl).getByClass(selectorClasses.retry).length > 0;

        fileListNode = qq(tempTemplateEl).getByClass(selectorClasses.list)[0];
        if (fileListNode == null) {
            throw new Error("Could not find the file list container in the template!");
        }

        fileListHtml = fileListNode.innerHTML;
        fileListNode.innerHTML = "";

       log("Template parsing complete");

        return {
            template: qq.trimStr(tempTemplateEl.innerHTML),
            fileTemplate: qq.trimStr(fileListHtml)
        }
    }

    function getFile(id) {
        return qq(fileList).getByClass(FILE_CLASS_PREFIX + id)[0];
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

    function getProgress(id) {
        return getTemplateEl(getFile(id), selectorClasses.progressBarContainer) ||
            getTemplateEl(getFile(id), selectorClasses.progressBar);
    }

    function getSpinner(id) {
        return getTemplateEl(getFile(id), selectorClasses.spinner);
    }

    function getEditIcon(id) {
        return getTemplateEl(getFile(id), selectorClasses.editNameIcon);
    }

    function getSize(id) {
        return getTemplateEl(getFile(id), selectorClasses.size);
    }

    function getDelete(id) {
        return getTemplateEl(getFile(id), selectorClasses.deleteButton);
    }

    function getRetry(id) {
        return getTemplateEl(getFile(id), selectorClasses.retry);
    }

    function getFilename(id) {
        return getTemplateEl(getFile(id), selectorClasses.file);
    }

    function getDropProcessing() {
        return getTemplateEl(container, selectorClasses.dropProcessing);
    }

    function getThumbnail(id) {
        return showThumbnails && getTemplateEl(getFile(id), selectorClasses.thumbnail);
    }

    function hide(el) {
        el && qq(el).addClass(options.classes.hide);
    }

    function show(el) {
        el && qq(el).removeClass(options.classes.hide);
    }

    function setProgressBarWidth(id, percent) {
        var bar = getProgress(id);

        if (bar && !qq(bar).hasClass(selectorClasses.progressBar)) {
            bar = qq(bar).getByClass(selectorClasses.progressBar)[0];
        }

        bar && qq(bar).css({width: percent + '%'});
    }

    // During initialization of the templating module we should cache any
    // placeholder images so we can quickly swap them into the file list on demand.
    // Any placeholder images that cannot be loaded/found are simply ignored.
    function cacheThumbnailPlaceholders() {
        var notAvailableUrl =  options.placeholders.thumbnailNotAvailable,
            waitingUrl = options.placeholders.waitingForThumbnail,
            spec = {
                maxSize: thumbnailMaxSize,
                scale: serverScale
            };

        if (showThumbnails) {
            if (notAvailableUrl) {
                options.imageGenerator.generate(notAvailableUrl, new Image(), spec).then(
                    function(updatedImg) {
                        cachedThumbnailNotAvailableImg = updatedImg;
                    },
                    function() {
                        log("Problem loading 'not available' placeholder image at " + notAvailableUrl, "error");
                    }
                );
            }

            if (waitingUrl) {
                options.imageGenerator.generate(waitingUrl, new Image(), spec).then(
                    function(updatedImg) {
                        cachedWaitingForThumbnailImg = updatedImg;
                    },
                    function() {
                        log("Problem loading 'waiting for thumbnail' placeholder image at " + waitingUrl, "error");
                    }
                );
            }
        }
    }

    // Displays a "waiting for thumbnail" type placeholder image
    // iff we were able to load it during initialization of the templating module.
    function displayWaitingImg(thumbnail) {
        if (cachedWaitingForThumbnailImg) {
            maybeScalePlaceholderViaCss(cachedWaitingForThumbnailImg, thumbnail);
            thumbnail.src = cachedWaitingForThumbnailImg.src;
            show(thumbnail);
        }
        // In some browsers (such as IE9 and older) an img w/out a src attribute
        // are displayed as "broken" images, so we sohuld just hide the img tag
        // if we aren't going to display the "waiting" placeholder.
        else {
            hide(thumbnail);
        }
    }

    // Displays a "thumbnail not available" type placeholder image
    // iff we were able to load this placeholder during initialization
    // of the templating module AND a valid preview does not already exist in the thumbnail element.
    function displayNotAvailableImg(thumbnail) {
        if (cachedThumbnailNotAvailableImg && !hasValidPreview(thumbnail)) {
            maybeScalePlaceholderViaCss(cachedThumbnailNotAvailableImg, thumbnail);
            thumbnail.src = cachedThumbnailNotAvailableImg.src;
            show(thumbnail);
        }
    }

    // Ensures a placeholder image does not exceed any max size specified
    // via `style` attribute properties iff <canvas> was not used to scale
    // the placeholder AND the target <img> doesn't already have these `style` attribute properties set.
    function maybeScalePlaceholderViaCss(placeholder, thumbnail) {
        var maxWidth = placeholder.style.maxWidth,
            maxHeight = placeholder.style.maxHeight;

        if (maxHeight && maxWidth && !thumbnail.style.maxWidth && !thumbnail.style.maxHeight) {
            qq(thumbnail).css({
                maxWidth: maxWidth,
                maxHeight: maxHeight
            });
        }
    }

    // Allows us to determine if a thumbnail element has already received a valid preview.
    function hasValidPreview(thumbnail) {
        return qq(thumbnail).hasAttribute(PREVIEW_GENERATED_ATTR);
    }


    qq.extend(options, spec);
    log = options.log;

    container = options.containerEl;
    showThumbnails = options.imageGenerator !== undefined;
    templateHtml = parseAndGetTemplate();

    cacheThumbnailPlaceholders();

    api = {
        render: function() {
            log("Rendering template in DOM.");

            container.innerHTML = templateHtml.template;
            hide(getDropProcessing());
            fileList = options.fileContainerEl || getTemplateEl(container, selectorClasses.list)

            log("Template rendering complete");
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

            qq(fileEl).addClass(FILE_CLASS_PREFIX + id);
            fileNameEl && qq(fileNameEl).setText(name);
            fileEl.setAttribute(FILE_ID_ATTR, id);

            if (prependInfo) {
                prependFile(fileEl, prependInfo.index);
            }
            else {
                fileList.appendChild(fileEl);
            }

            hide(getProgress(id));
            hide(getSize(id));
            hide(getDelete(id));
            hide(getRetry(id));

            if (isCancelDisabled) {
                api.hideCancel(id);
            }
        },

        removeFile: function(id) {
            qq(getFile(id)).remove();
        },

        getFileId: function(el) {
            var currentNode = el;

            while (currentNode.getAttribute(FILE_ID_ATTR) == null) {
                currentNode = currentNode.parentNode;
            }

            return parseInt(currentNode.getAttribute(FILE_ID_ATTR));
        },

        getFileList: function() {
            return fileList;
        },

        markFilenameEditable: function(id) {
            var filename = getFilename(id);

            filename && qq(filename).addClass(options.classes.editable);
        },

        updateFilename: function(id, name) {
            var filename = getFilename(id);

            filename && qq(filename).setText(name);
        },

        hideFilename: function(id) {
            hide(getFilename(id));
        },

        showFilename: function(id) {
            show(getFilename(id));
        },

        isFileName: function(el) {
            return qq(el).hasClass(selectorClasses.file);
        },

        getButton: function() {
            return options.button || getTemplateEl(container, selectorClasses.button);
        },

        hideDropProcessing: function() {
            hide(getDropProcessing());
        },

        showDropProcessing: function() {
            show(getDropProcessing());
        },

        getDropZone: function() {
            return getTemplateEl(container, selectorClasses.drop);
        },

        isEditFilenamePossible: function() {
            return isEditElementsExist;
        },

        isRetryPossible: function() {
            return isRetryElementExist;
        },

        getFileContainer: function(id) {
            return getFile(id);
        },

        showEditIcon: function(id) {
            var icon = getEditIcon(id);

            icon && qq(icon).addClass(options.classes.editable);
        },

        hideEditIcon: function(id) {
            var icon = getEditIcon(id);

            icon && qq(icon).removeClass(options.classes.editable);
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

        updateProgress: function(id, loaded, total) {
            var bar = getProgress(id),
                percent;

            if (bar) {
                percent = Math.round(loaded / total * 100);

                if (loaded === total) {
                    hide(bar);
                }
                else {
                    show(bar);
                }

                setProgressBarWidth(id, percent);
            }
        },

        hideProgress: function(id) {
            var bar = getProgress(id);

            bar && hide(bar);
        },

        resetProgress: function(id) {
            setProgressBarWidth(id, 0);
        },

        showCancel: function(id) {
            if (!isCancelDisabled) {
                var cancel = getCancel(id);

                cancel && qq(cancel).removeClass(options.classes.hide);
            }
        },

        hideCancel: function(id) {
            hide(getCancel(id));
        },

        isCancel: function(el)  {
            return qq(el).hasClass(selectorClasses.cancel);
        },

        showDelete: function(id) {
            show(getDelete(id));
        },

        hideDelete: function(id) {
            hide(getDelete(id));
        },

        isDelete: function(el) {
            return qq(el).hasClass(selectorClasses.deleteButton);
        },

        isRetry: function(el) {
            return qq(el).hasClass(selectorClasses.retry);
        },

        updateSize: function(id, text) {
            var size = getSize(id);

            if (size) {
                show(size);
                qq(size).setText(text);
            }
        },

        setStatusText: function(id, text) {
            var textEl = getTemplateEl(getFile(id), selectorClasses.statusText);

            if (textEl) {
                if (text == null) {
                    qq(textEl).clearText();
                }
                else {
                    qq(textEl).setText(text);
                }
            }
        },

        hideSpinner: function(id) {
            hide(getSpinner(id));
        },

        showSpinner: function(id) {
            show(getSpinner(id));
        },

        generatePreview: function(id, fileOrBlob) {
            var thumbnail = getThumbnail(id),
                spec = {
                    maxSize: thumbnailMaxSize,
                    scale: true,
                    orient: true
                };

            if (qq.supportedFeatures.imagePreviews) {
                if (thumbnail) {
                    displayWaitingImg(thumbnail);
                    return options.imageGenerator.generate(fileOrBlob, thumbnail, spec).then(
                        function() {
                            thumbnail.setAttribute(PREVIEW_GENERATED_ATTR, "true");
                            show(thumbnail);
                        },
                        function() {
                            // Display the "not available" placeholder img only if we are
                            // not expecting a thumbnail at a later point, such as in a server response.
                            if (!options.placeholders.waitUntilUpdate) {
                                displayNotAvailableImg(thumbnail);
                            }
                        });
                }
            }
            else if (thumbnail) {
                displayWaitingImg(thumbnail);
            }
        },

        updateThumbnail: function(id, thumbnailUrl) {
            var thumbnail = getThumbnail(id),
                spec = {
                    maxSize: thumbnailMaxSize,
                    scale: serverScale
                };

            if (thumbnail) {
                if (thumbnailUrl) {
                    return options.imageGenerator.generate(thumbnailUrl, thumbnail, spec).then(
                        function() {
                            show(thumbnail);
                        },
                        function() {
                            displayNotAvailableImg(thumbnail);
                        }
                    );
                }
                else {
                    displayNotAvailableImg(thumbnail);
                }
            }
        }
    };

    return api;
};
