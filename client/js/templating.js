/* globals qq */
/* jshint -W065 */
/**
 * Module responsible for rendering all Fine Uploader UI templates.  This module also asserts at least
 * a limited amount of control over the template elements after they are added to the DOM.
 * Wherever possible, this module asserts total control over template elements present in the DOM.
 *
 * @param spec Specification object used to control various templating behaviors
 * @constructor
 */
qq.Templating = function(spec) {
    "use strict";

    var FILE_ID_ATTR = "qq-file-id",
        FILE_CLASS_PREFIX = "qq-file-id-",
        THUMBNAIL_MAX_SIZE_ATTR = "qq-max-size",
        THUMBNAIL_SERVER_SCALE_ATTR = "qq-server-scale",
        // This variable is duplicated in the DnD module since it can function as a standalone as well
        HIDE_DROPZONE_ATTR = "qq-hide-dropzone",
        DROPZPONE_TEXT_ATTR = "qq-drop-area-text",
        IN_PROGRESS_CLASS = "qq-in-progress",
        isCancelDisabled = false,
        generatedThumbnails = 0,
        thumbnailQueueMonitorRunning = false,
        thumbGenerationQueue = [],
        thumbnailMaxSize = -1,
        options = {
            log: null,
            limits: {
                maxThumbs: 0,
                timeBetweenThumbs: 750
            },
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
            },
            text: {
                paused: "Paused"
            }
        },
        selectorClasses = {
            button: "qq-upload-button-selector",
            alertDialog: "qq-alert-dialog-selector",
            dialogCancelButton: "qq-cancel-button-selector",
            confirmDialog: "qq-confirm-dialog-selector",
            dialogMessage: "qq-dialog-message-selector",
            dialogOkButton: "qq-ok-button-selector",
            promptDialog: "qq-prompt-dialog-selector",
            uploader: "qq-uploader-selector",
            drop: "qq-upload-drop-area-selector",
            list: "qq-upload-list-selector",
            progressBarContainer: "qq-progress-bar-container-selector",
            progressBar: "qq-progress-bar-selector",
            totalProgressBarContainer: "qq-total-progress-bar-container-selector",
            totalProgressBar: "qq-total-progress-bar-selector",
            file: "qq-upload-file-selector",
            spinner: "qq-upload-spinner-selector",
            size: "qq-upload-size-selector",
            cancel: "qq-upload-cancel-selector",
            pause: "qq-upload-pause-selector",
            continueButton: "qq-upload-continue-selector",
            deleteButton: "qq-upload-delete-selector",
            retry: "qq-upload-retry-selector",
            statusText: "qq-upload-status-text-selector",
            editFilenameInput: "qq-edit-filename-selector",
            editNameIcon: "qq-edit-filename-icon-selector",
            dropText: "qq-upload-drop-area-text-selector",
            dropProcessing: "qq-drop-processing-selector",
            dropProcessingSpinner: "qq-drop-processing-spinner-selector",
            thumbnail: "qq-thumbnail-selector"
        },
        previewGeneration = {},
        cachedThumbnailNotAvailableImg = new qq.Promise(),
        cachedWaitingForThumbnailImg = new qq.Promise(),
        log,
        isEditElementsExist,
        isRetryElementExist,
        templateHtml,
        container,
        fileList,
        showThumbnails,
        serverScale,

        // During initialization of the templating module we should cache any
        // placeholder images so we can quickly swap them into the file list on demand.
        // Any placeholder images that cannot be loaded/found are simply ignored.
        cacheThumbnailPlaceholders = function() {
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
                            cachedThumbnailNotAvailableImg.success(updatedImg);
                        },
                        function() {
                            cachedThumbnailNotAvailableImg.failure();
                            log("Problem loading 'not available' placeholder image at " + notAvailableUrl, "error");
                        }
                    );
                }
                else {
                    cachedThumbnailNotAvailableImg.failure();
                }

                if (waitingUrl) {
                    options.imageGenerator.generate(waitingUrl, new Image(), spec).then(
                        function(updatedImg) {
                            cachedWaitingForThumbnailImg.success(updatedImg);
                        },
                        function() {
                            cachedWaitingForThumbnailImg.failure();
                            log("Problem loading 'waiting for thumbnail' placeholder image at " + waitingUrl, "error");
                        }
                    );
                }
                else {
                    cachedWaitingForThumbnailImg.failure();
                }
            }
        },

        // Displays a "waiting for thumbnail" type placeholder image
        // iff we were able to load it during initialization of the templating module.
        displayWaitingImg = function(thumbnail) {
            var waitingImgPlacement = new qq.Promise();

            cachedWaitingForThumbnailImg.then(function(img) {
                maybeScalePlaceholderViaCss(img, thumbnail);
                /* jshint eqnull:true */
                if (!thumbnail.src) {
                    thumbnail.src = img.src;
                    thumbnail.onload = function() {
                        thumbnail.onload = null;
                        show(thumbnail);
                        waitingImgPlacement.success();
                    };
                }
                else {
                    waitingImgPlacement.success();
                }
            }, function() {
                // In some browsers (such as IE9 and older) an img w/out a src attribute
                // are displayed as "broken" images, so we should just hide the img tag
                // if we aren't going to display the "waiting" placeholder.
                hide(thumbnail);
                waitingImgPlacement.success();
            });

            return waitingImgPlacement;
        },

        generateNewPreview = function(id, blob, spec) {
            var thumbnail = getThumbnail(id);

            log("Generating new thumbnail for " + id);
            blob.qqThumbnailId = id;

            return options.imageGenerator.generate(blob, thumbnail, spec).then(
                function() {
                    generatedThumbnails++;
                    show(thumbnail);
                    previewGeneration[id].success();
                },
                function() {
                    previewGeneration[id].failure();

                    // Display the "not available" placeholder img only if we are
                    // not expecting a thumbnail at a later point, such as in a server response.
                    if (!options.placeholders.waitUntilUpdate) {
                        maybeSetDisplayNotAvailableImg(id, thumbnail);
                    }
                });
        },

        generateNextQueuedPreview = function() {
            if (thumbGenerationQueue.length) {
                thumbnailQueueMonitorRunning = true;

                var queuedThumbRequest = thumbGenerationQueue.shift();

                if (queuedThumbRequest.update) {
                    processUpdateQueuedPreviewRequest(queuedThumbRequest);
                }
                else {
                    processNewQueuedPreviewRequest(queuedThumbRequest);
                }
            }
            else {
                thumbnailQueueMonitorRunning = false;
            }
        },

        getCancel = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.cancel);
        },

        getContinue = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.continueButton);
        },

        getDialog = function(type) {
            return getTemplateEl(container, selectorClasses[type + "Dialog"]);
        },

        getDelete = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.deleteButton);
        },

        getDropProcessing = function() {
            return getTemplateEl(container, selectorClasses.dropProcessing);
        },

        getEditIcon = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.editNameIcon);
        },

        getFile = function(id) {
            return qq(fileList).getByClass(FILE_CLASS_PREFIX + id)[0];
        },

        getFilename = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.file);
        },

        getPause = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.pause);
        },

        getProgress = function(id) {
            /* jshint eqnull:true */
            // Total progress bar
            if (id == null) {
                return getTemplateEl(container, selectorClasses.totalProgressBarContainer) ||
                    getTemplateEl(container, selectorClasses.totalProgressBar);
            }

            // Per-file progress bar
            return getTemplateEl(getFile(id), selectorClasses.progressBarContainer) ||
                getTemplateEl(getFile(id), selectorClasses.progressBar);
        },

        getRetry = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.retry);
        },

        getSize = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.size);
        },

        getSpinner = function(id) {
            return getTemplateEl(getFile(id), selectorClasses.spinner);
        },

        getTemplateEl = function(context, cssClass) {
            return context && qq(context).getByClass(cssClass)[0];
        },

        getThumbnail = function(id) {
            return showThumbnails && getTemplateEl(getFile(id), selectorClasses.thumbnail);
        },

        hide = function(el) {
            el && qq(el).addClass(options.classes.hide);
        },

        // Ensures a placeholder image does not exceed any max size specified
        // via `style` attribute properties iff <canvas> was not used to scale
        // the placeholder AND the target <img> doesn't already have these `style` attribute properties set.
        maybeScalePlaceholderViaCss = function(placeholder, thumbnail) {
            var maxWidth = placeholder.style.maxWidth,
                maxHeight = placeholder.style.maxHeight;

            if (maxHeight && maxWidth && !thumbnail.style.maxWidth && !thumbnail.style.maxHeight) {
                qq(thumbnail).css({
                    maxWidth: maxWidth,
                    maxHeight: maxHeight
                });
            }
        },

        // Displays a "thumbnail not available" type placeholder image
        // iff we were able to load this placeholder during initialization
        // of the templating module or after preview generation has failed.
        maybeSetDisplayNotAvailableImg = function(id, thumbnail) {
            var previewing = previewGeneration[id] || new qq.Promise().failure(),
                notAvailableImgPlacement = new qq.Promise();

            cachedThumbnailNotAvailableImg.then(function(img) {
                previewing.then(
                    function() {
                        notAvailableImgPlacement.success();
                    },
                    function() {
                        maybeScalePlaceholderViaCss(img, thumbnail);

                        thumbnail.onload = function() {
                            thumbnail.onload = null;
                            notAvailableImgPlacement.success();
                        };

                        thumbnail.src = img.src;
                        show(thumbnail);
                    }
                );
            });

            return notAvailableImgPlacement;
        },

        /**
         * Grabs the HTML from the script tag holding the template markup.  This function will also adjust
         * some internally-tracked state variables based on the contents of the template.
         * The template is filtered so that irrelevant elements (such as the drop zone if DnD is not supported)
         * are omitted from the DOM.  Useful errors will be thrown if the template cannot be parsed.
         *
         * @returns {{template: *, fileTemplate: *}} HTML for the top-level file items templates
         */
        parseAndGetTemplate = function() {
            var scriptEl,
                scriptHtml,
                fileListNode,
                tempTemplateEl,
                fileListHtml,
                defaultButton,
                dropArea,
                thumbnail,
                dropProcessing,
                dropTextEl,
                uploaderEl;

            log("Parsing template");

            /*jshint -W116*/
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
            uploaderEl = qq(tempTemplateEl).getByClass(selectorClasses.uploader)[0];

            // Don't include the default template button in the DOM
            // if an alternate button container has been specified.
            if (options.button) {
                defaultButton = qq(tempTemplateEl).getByClass(selectorClasses.button)[0];
                if (defaultButton) {
                    qq(defaultButton).remove();
                }
            }

            // Omit the drop processing element from the DOM if DnD is not supported by the UA,
            // or the drag and drop module is not found.
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
                log("DnD module unavailable.", "info");
                qq(dropArea).remove();
            }

            if (!qq.supportedFeatures.fileDrop) {
                // don't display any "drop files to upload" background text
                uploaderEl.removeAttribute(DROPZPONE_TEXT_ATTR);

                if (dropArea && qq(dropArea).hasAttribute(HIDE_DROPZONE_ATTR)) {
                    // If there is a drop area defined in the template, and the current UA doesn't support DnD,
                    // and the drop area is marked as "hide before enter", ensure it is hidden as the DnD module
                    // will not do this (since we will not be loading the DnD module)
                    qq(dropArea).css({
                        display: "none"
                    });
                }
            }
            else if (qq(uploaderEl).hasAttribute(DROPZPONE_TEXT_ATTR) && dropArea) {
                dropTextEl = qq(dropArea).getByClass(selectorClasses.dropText)[0];
                dropTextEl && qq(dropTextEl).remove();
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
            /*jshint -W116*/
            if (fileListNode == null) {
                throw new Error("Could not find the file list container in the template!");
            }

            fileListHtml = fileListNode.innerHTML;
            fileListNode.innerHTML = "";

            // We must call `createElement` in IE8 in order to target and hide any <dialog> via CSS
            if (tempTemplateEl.getElementsByTagName("DIALOG").length) {
                document.createElement("dialog");
            }

            log("Template parsing complete");

            return {
                template: qq.trimStr(tempTemplateEl.innerHTML),
                fileTemplate: qq.trimStr(fileListHtml)
            };
        },

        prependFile = function(el, index) {
            var parentEl = fileList,
                beforeEl = parentEl.firstChild;

            if (index > 0) {
                beforeEl = qq(parentEl).children()[index].nextSibling;

            }

            parentEl.insertBefore(el, beforeEl);
        },

        processNewQueuedPreviewRequest = function(queuedThumbRequest) {
            var id = queuedThumbRequest.id,
                optFileOrBlob = queuedThumbRequest.optFileOrBlob,
                relatedThumbnailId = optFileOrBlob && optFileOrBlob.qqThumbnailId,
                thumbnail = getThumbnail(id),
                spec = {
                    maxSize: thumbnailMaxSize,
                    scale: true,
                    orient: true
                };

            if (qq.supportedFeatures.imagePreviews) {
                if (thumbnail) {
                    if (options.limits.maxThumbs && options.limits.maxThumbs <= generatedThumbnails) {
                        maybeSetDisplayNotAvailableImg(id, thumbnail);
                        generateNextQueuedPreview();
                    }
                    else {
                        displayWaitingImg(thumbnail).done(function() {
                            previewGeneration[id] = new qq.Promise();

                            previewGeneration[id].done(function() {
                                setTimeout(generateNextQueuedPreview, options.limits.timeBetweenThumbs);
                            });

                            /* jshint eqnull: true */
                            // If we've already generated an <img> for this file, use the one that exists,
                            // don't waste resources generating a new one.
                            if (relatedThumbnailId != null) {
                                useCachedPreview(id, relatedThumbnailId);
                            }
                            else {
                                generateNewPreview(id, optFileOrBlob, spec);
                            }
                        });
                    }
                }
                // File element in template may have been removed, so move on to next item in queue
                else {
                    generateNextQueuedPreview();
                }
            }
            else if (thumbnail) {
                displayWaitingImg(thumbnail);
                generateNextQueuedPreview();
            }
        },

        processUpdateQueuedPreviewRequest = function(queuedThumbRequest) {
            var id = queuedThumbRequest.id,
                thumbnailUrl = queuedThumbRequest.thumbnailUrl,
                showWaitingImg = queuedThumbRequest.showWaitingImg,
                thumbnail = getThumbnail(id),
                spec = {
                    maxSize: thumbnailMaxSize,
                    scale: serverScale
                };

            if (thumbnail) {
                if (thumbnailUrl) {
                    if (options.limits.maxThumbs && options.limits.maxThumbs <= generatedThumbnails) {
                        maybeSetDisplayNotAvailableImg(id, thumbnail);
                        generateNextQueuedPreview();
                    }
                    else {
                        if (showWaitingImg) {
                            displayWaitingImg(thumbnail);
                        }

                        return options.imageGenerator.generate(thumbnailUrl, thumbnail, spec).then(
                            function() {
                                show(thumbnail);
                                generatedThumbnails++;
                                setTimeout(generateNextQueuedPreview, options.limits.timeBetweenThumbs);
                            },

                            function() {
                                maybeSetDisplayNotAvailableImg(id, thumbnail);
                                setTimeout(generateNextQueuedPreview, options.limits.timeBetweenThumbs);
                            }
                        );
                    }
                }
                else {
                    maybeSetDisplayNotAvailableImg(id, thumbnail);
                    generateNextQueuedPreview();
                }
            }
        },

        setProgressBarWidth = function(id, percent) {
            var bar = getProgress(id),
                /* jshint eqnull:true */
                progressBarSelector = id == null ? selectorClasses.totalProgressBar : selectorClasses.progressBar;

            if (bar && !qq(bar).hasClass(progressBarSelector)) {
                bar = qq(bar).getByClass(progressBarSelector)[0];
            }

            if (bar) {
                qq(bar).css({width: percent + "%"});
                bar.setAttribute("aria-valuenow", percent);
            }
        },

        show = function(el) {
            el && qq(el).removeClass(options.classes.hide);
        },

        useCachedPreview = function(targetThumbnailId, cachedThumbnailId) {
            var targetThumnail = getThumbnail(targetThumbnailId),
                cachedThumbnail = getThumbnail(cachedThumbnailId);

            log(qq.format("ID {} is the same file as ID {}.  Will use generated thumbnail from ID {} instead.", targetThumbnailId, cachedThumbnailId, cachedThumbnailId));

            // Generation of the related thumbnail may still be in progress, so, wait until it is done.
            previewGeneration[cachedThumbnailId].then(function() {
                generatedThumbnails++;
                previewGeneration[targetThumbnailId].success();
                log(qq.format("Now using previously generated thumbnail created for ID {} on ID {}.", cachedThumbnailId, targetThumbnailId));
                targetThumnail.src = cachedThumbnail.src;
                show(targetThumnail);
            },
            function() {
                previewGeneration[targetThumbnailId].failure();
                if (!options.placeholders.waitUntilUpdate) {
                    maybeSetDisplayNotAvailableImg(targetThumbnailId, targetThumnail);
                }
            });
        };

    qq.extend(options, spec);
    log = options.log;

    // No need to worry about conserving CPU or memory on older browsers,
    // since there is no ability to preview, and thumbnail display is primitive and quick.
    if (!qq.supportedFeatures.imagePreviews) {
        options.limits.timeBetweenThumbs = 0;
        options.limits.maxThumbs = 0;
    }

    container = options.containerEl;
    showThumbnails = options.imageGenerator !== undefined;
    templateHtml = parseAndGetTemplate();

    cacheThumbnailPlaceholders();

    qq.extend(this, {
        render: function() {
            log("Rendering template in DOM.");

            generatedThumbnails = 0;

            container.innerHTML = templateHtml.template;
            hide(getDropProcessing());
            this.hideTotalProgress();
            fileList = options.fileContainerEl || getTemplateEl(container, selectorClasses.list);

            log("Template rendering complete");
        },

        renderFailure: function(message) {
            var cantRenderEl = qq.toElement(message);
            container.innerHTML = "";
            container.appendChild(cantRenderEl);
        },

        reset: function() {
            this.render();
        },

        clearFiles: function() {
            fileList.innerHTML = "";
        },

        disableCancel: function() {
            isCancelDisabled = true;
        },

        addFile: function(id, name, prependInfo) {
            var fileEl = qq.toElement(templateHtml.fileTemplate),
                fileNameEl = getTemplateEl(fileEl, selectorClasses.file),
                uploaderEl = getTemplateEl(container, selectorClasses.uploader),
                thumb;

            qq(fileEl).addClass(FILE_CLASS_PREFIX + id);
            uploaderEl.removeAttribute(DROPZPONE_TEXT_ATTR);

            if (fileNameEl) {
                qq(fileNameEl).setText(name);
                fileNameEl.setAttribute("title", name);
            }

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
            hide(getPause(id));
            hide(getContinue(id));

            if (isCancelDisabled) {
                this.hideCancel(id);
            }

            thumb = getThumbnail(id);
            if (thumb && !thumb.src) {
                cachedWaitingForThumbnailImg.then(function(waitingImg) {
                    thumb.src = waitingImg.src;
                    if (waitingImg.style.maxHeight && waitingImg.style.maxWidth) {
                        qq(thumb).css({
                            maxHeight: waitingImg.style.maxHeight,
                            maxWidth: waitingImg.style.maxWidth
                        });
                    }

                    show(thumb);
                });
            }
        },

        removeFile: function(id) {
            qq(getFile(id)).remove();
        },

        getFileId: function(el) {
            var currentNode = el;

            if (currentNode) {
                /*jshint -W116*/
                while (currentNode.getAttribute(FILE_ID_ATTR) == null) {
                    currentNode = currentNode.parentNode;
                }

                return parseInt(currentNode.getAttribute(FILE_ID_ATTR));
            }
        },

        getFileList: function() {
            return fileList;
        },

        markFilenameEditable: function(id) {
            var filename = getFilename(id);

            filename && qq(filename).addClass(options.classes.editable);
        },

        updateFilename: function(id, name) {
            var filenameEl = getFilename(id);

            if (filenameEl) {
                qq(filenameEl).setText(name);
                filenameEl.setAttribute("title", name);
            }
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

        hideRetry: function(id) {
            hide(getRetry(id));
        },

        isRetryPossible: function() {
            return isRetryElementExist;
        },

        showRetry: function(id) {
            show(getRetry(id));
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
            return qq(el).hasClass(selectorClasses.editNameIcon, true);
        },

        getEditInput: function(id) {
            return getTemplateEl(getFile(id), selectorClasses.editFilenameInput);
        },

        isEditInput: function(el) {
            return qq(el).hasClass(selectorClasses.editFilenameInput, true);
        },

        updateProgress: function(id, loaded, total) {
            var bar = getProgress(id),
                percent;

            if (bar && total > 0) {
                percent = Math.round(loaded / total * 100);

                if (percent === 100) {
                    hide(bar);
                }
                else {
                    show(bar);
                }

                setProgressBarWidth(id, percent);
            }
        },

        updateTotalProgress: function(loaded, total) {
            this.updateProgress(null, loaded, total);
        },

        hideProgress: function(id) {
            var bar = getProgress(id);

            bar && hide(bar);
        },

        hideTotalProgress: function() {
            this.hideProgress();
        },

        resetProgress: function(id) {
            setProgressBarWidth(id, 0);
            this.hideTotalProgress(id);
        },

        resetTotalProgress: function() {
            this.resetProgress();
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
            return qq(el).hasClass(selectorClasses.cancel, true);
        },

        allowPause: function(id) {
            show(getPause(id));
            hide(getContinue(id));
        },

        uploadPaused: function(id) {
            this.setStatusText(id, options.text.paused);
            this.allowContinueButton(id);
            hide(getSpinner(id));
        },

        hidePause: function(id) {
            hide(getPause(id));
        },

        isPause: function(el) {
            return qq(el).hasClass(selectorClasses.pause, true);
        },

        isContinueButton: function(el) {
            return qq(el).hasClass(selectorClasses.continueButton, true);
        },

        allowContinueButton: function(id) {
            show(getContinue(id));
            hide(getPause(id));
        },

        uploadContinued: function(id) {
            this.setStatusText(id, "");
            this.allowPause(id);
            show(getSpinner(id));
        },

        showDeleteButton: function(id) {
            show(getDelete(id));
        },

        hideDeleteButton: function(id) {
            hide(getDelete(id));
        },

        isDeleteButton: function(el) {
            return qq(el).hasClass(selectorClasses.deleteButton, true);
        },

        isRetry: function(el) {
            return qq(el).hasClass(selectorClasses.retry, true);
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
                /*jshint -W116*/
                if (text == null) {
                    qq(textEl).clearText();
                }
                else {
                    qq(textEl).setText(text);
                }
            }
        },

        hideSpinner: function(id) {
            qq(getFile(id)).removeClass(IN_PROGRESS_CLASS);
            hide(getSpinner(id));
        },

        showSpinner: function(id) {
            qq(getFile(id)).addClass(IN_PROGRESS_CLASS);
            show(getSpinner(id));
        },

        generatePreview: function(id, optFileOrBlob) {
            thumbGenerationQueue.push({id: id, optFileOrBlob: optFileOrBlob});
            !thumbnailQueueMonitorRunning && generateNextQueuedPreview();
        },

        updateThumbnail: function(id, thumbnailUrl, showWaitingImg) {
            thumbGenerationQueue.push({update: true, id: id, thumbnailUrl: thumbnailUrl, showWaitingImg: showWaitingImg});
            !thumbnailQueueMonitorRunning && generateNextQueuedPreview();
        },

        hasDialog: function(type) {
            return qq.supportedFeatures.dialogElement && !!getDialog(type);
        },

        showDialog: function(type, message, defaultValue) {
            var dialog = getDialog(type),
                messageEl = getTemplateEl(dialog, selectorClasses.dialogMessage),
                inputEl = dialog.getElementsByTagName("INPUT")[0],
                cancelBtn = getTemplateEl(dialog, selectorClasses.dialogCancelButton),
                okBtn = getTemplateEl(dialog, selectorClasses.dialogOkButton),
                promise = new qq.Promise(),

                closeHandler = function() {
                    cancelBtn.removeEventListener("click", cancelClickHandler);
                    okBtn && okBtn.removeEventListener("click", okClickHandler);
                    promise.failure();
                },

                cancelClickHandler = function() {
                    cancelBtn.removeEventListener("click", cancelClickHandler);
                    dialog.close();
                },

                okClickHandler = function() {
                    dialog.removeEventListener("close", closeHandler);
                    okBtn.removeEventListener("click", okClickHandler);
                    dialog.close();

                    promise.success(inputEl && inputEl.value);
                };

            dialog.addEventListener("close", closeHandler);
            cancelBtn.addEventListener("click", cancelClickHandler);
            okBtn && okBtn.addEventListener("click", okClickHandler);

            if (inputEl) {
                inputEl.value = defaultValue;
            }
            messageEl.textContent = message;

            dialog.showModal();

            return promise;
        }
    });
};
