/*globals qq, document, CustomEvent*/
qq.DragAndDrop = function(o) {
    "use strict";

    var options,
        HIDE_ZONES_EVENT_NAME = "qq-hidezones",
        HIDE_BEFORE_ENTER_ATTR = "qq-hide-dropzone",
        uploadDropZones = [],
        droppedFiles = [],
        disposeSupport = new qq.DisposeSupport();

    options = {
        dropZoneElements: [],
        allowMultipleItems: true,
        classes: {
            dropActive: null
        },
        callbacks: new qq.DragAndDrop.callbacks()
    };

    qq.extend(options, o, true);

    function uploadDroppedFiles(files, uploadDropZone) {
        // We need to convert the `FileList` to an actual `Array` to avoid iteration issues
        var filesAsArray = Array.prototype.slice.call(files);

        options.callbacks.dropLog("Grabbed " + files.length + " dropped files.");
        uploadDropZone.dropDisabled(false);
        options.callbacks.processingDroppedFilesComplete(filesAsArray, uploadDropZone.getElement());
    }

    function traverseFileTree(entry) {
        var dirReader,
            parseEntryPromise = new qq.Promise();

        if (entry.isFile) {
            entry.file(function(file) {
                droppedFiles.push(file);
                parseEntryPromise.success();
            },
            function(fileError) {
                options.callbacks.dropLog("Problem parsing '" + entry.fullPath + "'.  FileError code " + fileError.code + ".", "error");
                parseEntryPromise.failure();
            });
        }
        else if (entry.isDirectory) {
            dirReader = entry.createReader();
            dirReader.readEntries(function(entries) {
                var entriesLeft = entries.length;

                qq.each(entries, function(idx, entry) {
                    traverseFileTree(entry).done(function() {
                        entriesLeft-=1;

                        if (entriesLeft === 0) {
                            parseEntryPromise.success();
                        }
                    });
                });

                if (!entries.length) {
                    parseEntryPromise.success();
                }
            }, function(fileError) {
                options.callbacks.dropLog("Problem parsing '" + entry.fullPath + "'.  FileError code " + fileError.code + ".", "error");
                parseEntryPromise.failure();
            });
        }

        return parseEntryPromise;
    }

    function handleDataTransfer(dataTransfer, uploadDropZone) {
        var pendingFolderPromises = [],
            handleDataTransferPromise = new qq.Promise();

        options.callbacks.processingDroppedFiles();
        uploadDropZone.dropDisabled(true);

        if (dataTransfer.files.length > 1 && !options.allowMultipleItems) {
            options.callbacks.processingDroppedFilesComplete([]);
            options.callbacks.dropError("tooManyFilesError", "");
            uploadDropZone.dropDisabled(false);
            handleDataTransferPromise.failure();
        }
        else {
            droppedFiles = [];

            if (qq.isFolderDropSupported(dataTransfer)) {
                qq.each(dataTransfer.items, function(idx, item) {
                    var entry = item.webkitGetAsEntry();

                    if (entry) {
                        //due to a bug in Chrome's File System API impl - #149735
                        if (entry.isFile) {
                            droppedFiles.push(item.getAsFile());
                        }

                        else {
                            pendingFolderPromises.push(traverseFileTree(entry).done(function() {
                                pendingFolderPromises.pop();
                                if (pendingFolderPromises.length === 0) {
                                    handleDataTransferPromise.success();
                                }
                            }));
                        }
                    }
                });
            }
            else {
                droppedFiles = dataTransfer.files;
            }

            if (pendingFolderPromises.length === 0) {
                handleDataTransferPromise.success();
            }
        }

        return handleDataTransferPromise;
    }

    function setupDropzone(dropArea) {
        var dropZone = new qq.UploadDropZone({
            HIDE_ZONES_EVENT_NAME: HIDE_ZONES_EVENT_NAME,
            element: dropArea,
            onEnter: function(e){
                qq(dropArea).addClass(options.classes.dropActive);
                e.stopPropagation();
            },
            onLeaveNotDescendants: function(e){
                qq(dropArea).removeClass(options.classes.dropActive);
            },
            onDrop: function(e){
                handleDataTransfer(e.dataTransfer, dropZone).then(
                    function() {
                        uploadDroppedFiles(droppedFiles, dropZone);
                    },
                    function() {
                        options.callbacks.dropLog("Drop event DataTransfer parsing failed.  No files will be uploaded.", "error");
                    }
                );
            }
        });

        disposeSupport.addDisposer(function() {
            dropZone.dispose();
        });

        qq(dropArea).hasAttribute(HIDE_BEFORE_ENTER_ATTR) && qq(dropArea).hide();

        uploadDropZones.push(dropZone);

        return dropZone;
    }

    function isFileDrag(dragEvent) {
        var fileDrag;

        qq.each(dragEvent.dataTransfer.types, function(key, val) {
            if (val === "Files") {
                fileDrag = true;
                return false;
            }
        });

        return fileDrag;
    }

    function leavingDocumentOut(e) {
        /* jshint -W041, eqeqeq:false */
            // null coords for Chrome and Safari Windows
        return ((qq.chrome() || (qq.safari() && qq.windows())) && e.clientX == 0 && e.clientY == 0) ||
            // null e.relatedTarget for Firefox
            (qq.firefox() && !e.relatedTarget);
    }

    function setupDragDrop() {
        var dropZones = options.dropZoneElements;

        qq.each(dropZones, function(idx, dropZone) {
            var uploadDropZone = setupDropzone(dropZone);

            // IE <= 9 does not support the File API used for drag+drop uploads
            if (dropZones.length && (!qq.ie() || qq.ie10())) {
                disposeSupport.attach(document, "dragenter", function(e) {
                    if (!uploadDropZone.dropDisabled() && isFileDrag(e)) {
                        qq.each(dropZones, function(idx, dropZone) {
                            // We can't apply styles to non-HTMLElements, since they lack the `style` property
                            if (dropZone instanceof HTMLElement) {
                                qq(dropZone).css({display: "block"});
                            }
                        });
                    }
                });
            }
        });

        disposeSupport.attach(document, "dragleave", function(e) {
            if (leavingDocumentOut(e)) {
                qq.each(dropZones, function(idx, dropZone) {
                    qq(dropZone).hasAttribute(HIDE_BEFORE_ENTER_ATTR) && qq(dropZone).hide();
                });
            }
        });

        disposeSupport.attach(document, "drop", function(e){
            qq.each(dropZones, function(idx, dropZone) {
                qq(dropZone).hasAttribute(HIDE_BEFORE_ENTER_ATTR) && qq(dropZone).hide();
            });
            e.preventDefault();
        });

        disposeSupport.attach(document, HIDE_ZONES_EVENT_NAME, function(e) {
            qq.each(options.dropZoneElements, function(idx, zone) {
                qq(zone).hasAttribute(HIDE_BEFORE_ENTER_ATTR) && qq(zone).hide();
                qq(zone).removeClass(options.classes.dropActive);
            });
        });
    }

    setupDragDrop();

    qq.extend(this, {
        setupExtraDropzone: function(element) {
            options.dropZoneElements.push(element);
            setupDropzone(element);
        },

        removeDropzone: function(element) {
            var i,
                dzs = options.dropZoneElements;

            for(i in dzs) {
                if (dzs[i] === element) {
                    return dzs.splice(i, 1);
                }
            }
        },

        dispose: function() {
            disposeSupport.dispose();
            qq.each(uploadDropZones, function(idx, dropZone) {
                dropZone.dispose();
            });
        }
    });
};

qq.DragAndDrop.callbacks = function() {
    "use strict";

    return {
        processingDroppedFiles: function() {},
        processingDroppedFilesComplete: function(files, targetEl) {},
        dropError: function(code, errorSpecifics) {
            qq.log("Drag & drop error code '" + code + " with these specifics: '" + errorSpecifics + "'", "error");
        },
        dropLog: function(message, level) {
            qq.log(message, level);
        }
    };
};

qq.UploadDropZone = function(o){
    "use strict";

    var disposeSupport = new qq.DisposeSupport(),
        options, element, preventDrop, dropOutsideDisabled;

    options = {
        element: null,
        onEnter: function(e){},
        onLeave: function(e){},
        // is not fired when leaving element by hovering descendants
        onLeaveNotDescendants: function(e){},
        onDrop: function(e){}
    };

    qq.extend(options, o);
    element = options.element;

    function dragover_should_be_canceled(){
        return qq.safari() || (qq.firefox() && qq.windows());
    }

    function disableDropOutside(e){
        // run only once for all instances
        if (!dropOutsideDisabled ){

            // for these cases we need to catch onDrop to reset dropArea
            if (dragover_should_be_canceled){
                disposeSupport.attach(document, "dragover", function(e){
                    e.preventDefault();
                });
            } else {
                disposeSupport.attach(document, "dragover", function(e){
                    if (e.dataTransfer){
                        e.dataTransfer.dropEffect = "none";
                        e.preventDefault();
                    }
                });
            }

            dropOutsideDisabled = true;
        }
    }

    function isValidFileDrag(e){
        // e.dataTransfer currently causing IE errors
        // IE9 does NOT support file API, so drag-and-drop is not possible
        if (qq.ie() && !qq.ie10()) {
            return false;
        }

        var effectTest, dt = e.dataTransfer,
        // do not check dt.types.contains in webkit, because it crashes safari 4
        isSafari = qq.safari();

        // dt.effectAllowed is none in Safari 5
        // dt.types.contains check is for firefox

        // dt.effectAllowed crashes IE11 when files have been dragged from
        // the filesystem
        effectTest = (qq.ie10() || qq.ie11()) ? true : dt.effectAllowed !== "none";
        return dt && effectTest && (dt.files || (!isSafari && dt.types.contains && dt.types.contains("Files")));
    }

    function isOrSetDropDisabled(isDisabled) {
        if (isDisabled !== undefined) {
            preventDrop = isDisabled;
        }
        return preventDrop;
    }

    function triggerHidezonesEvent() {
        var hideZonesEvent;

        function triggerUsingOldApi() {
            hideZonesEvent = document.createEvent("Event");
            hideZonesEvent.initEvent(options.HIDE_ZONES_EVENT_NAME, true, true);
        }

        if (window.CustomEvent) {
            try {
                hideZonesEvent = new CustomEvent(options.HIDE_ZONES_EVENT_NAME);
            }
            catch (err) {
                triggerUsingOldApi();
            }
        }
        else {
            triggerUsingOldApi();
        }

        document.dispatchEvent(hideZonesEvent);
    }

    function attachEvents(){
        disposeSupport.attach(element, "dragover", function(e){
            if (!isValidFileDrag(e)) {
                return;
            }

            // dt.effectAllowed crashes IE11 when files have been dragged from
            // the filesystem
            var effect = (qq.ie() || qq.ie11()) ? null : e.dataTransfer.effectAllowed;
            if (effect === "move" || effect === "linkMove"){
                e.dataTransfer.dropEffect = "move"; // for FF (only move allowed)
            } else {
                e.dataTransfer.dropEffect = "copy"; // for Chrome
            }

            e.stopPropagation();
            e.preventDefault();
        });

        disposeSupport.attach(element, "dragenter", function(e){
            if (!isOrSetDropDisabled()) {
                if (!isValidFileDrag(e)) {
                    return;
                }
                options.onEnter(e);
            }
        });

        disposeSupport.attach(element, "dragleave", function(e){
            if (!isValidFileDrag(e)) {
                return;
            }

            options.onLeave(e);

            var relatedTarget = document.elementFromPoint(e.clientX, e.clientY);
            // do not fire when moving a mouse over a descendant
            if (qq(this).contains(relatedTarget)) {
                return;
            }

            options.onLeaveNotDescendants(e);
        });

        disposeSupport.attach(element, "drop", function(e) {
            if (!isOrSetDropDisabled()) {
                if (!isValidFileDrag(e)) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();
                options.onDrop(e);

                triggerHidezonesEvent();
            }
        });
    }

    disableDropOutside();
    attachEvents();

    qq.extend(this, {
        dropDisabled: function(isDisabled) {
            return isOrSetDropDisabled(isDisabled);
        },

        dispose: function() {
            disposeSupport.dispose();
        },

        getElement: function() {
            return element;
        }
    });
};
