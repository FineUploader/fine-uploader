/*globals qq, File, XMLHttpRequest, FormData, Blob*/
qq.UploadHandlerXhr = function(o, uploadCompleteCallback, onUuidChange, logCallback) {
    "use strict";
    
    var options = o,
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        fileState = [],
        cookieItemDelimiter = "|",
        chunkFiles = options.chunking.enabled && qq.supportedFeatures.chunking,
        resumeEnabled = options.resume.enabled && chunkFiles && qq.supportedFeatures.resume,
        resumeId = getResumeId(),
        multipart = options.forceMultipart || options.paramsInBody,
        api;


     function addChunkingSpecificParams(id, params, chunkData) {
        var size = api.getSize(id),
            name = api.getName(id);

        params[options.chunking.paramNames.partIndex] = chunkData.part;
        params[options.chunking.paramNames.partByteOffset] = chunkData.start;
        params[options.chunking.paramNames.chunkSize] = chunkData.size;
        params[options.chunking.paramNames.totalParts] = chunkData.count;
        params[options.totalFileSizeParamName] = size;

        /**
         * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
         * or an empty string.  So, we will need to include the actual file name as a param in this case.
         */
        if (multipart) {
            params[options.chunking.paramNames.filename] = name;
        }
    }

    function addResumeSpecificParams(params) {
        params[options.resume.paramNames.resuming] = true;
    }

     function getChunk(fileOrBlob, startByte, endByte) {
        if (fileOrBlob.slice) {
            return fileOrBlob.slice(startByte, endByte);
        }
        else if (fileOrBlob.mozSlice) {
            return fileOrBlob.mozSlice(startByte, endByte);
        }
        else if (fileOrBlob.webkitSlice) {
            return fileOrBlob.webkitSlice(startByte, endByte);
        }
    }

    function getChunkData(id, chunkIndex) {
        var chunkSize = options.chunking.partSize,
            fileSize = api.getSize(id),
            fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
            startBytes = chunkSize * chunkIndex,
            endBytes = startBytes+chunkSize >= fileSize ? fileSize : startBytes+chunkSize,
            totalChunks = getTotalChunks(id);

        return {
            part: chunkIndex,
            start: startBytes,
            end: endBytes,
            count: totalChunks,
            blob: getChunk(fileOrBlob, startBytes, endBytes),
            size: endBytes - startBytes
        };
    }

    function getTotalChunks(id) {
        var fileSize = api.getSize(id),
            chunkSize = options.chunking.partSize;

        return Math.ceil(fileSize / chunkSize);
    }

    function createXhr(id) {
        var xhr = new XMLHttpRequest();

        fileState[id].xhr = xhr;

        return xhr;
    }

    function setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id) {
        var formData = new FormData(),
            method = options.demoMode ? "GET" : "POST",
            endpoint = options.endpointStore.getEndpoint(id),
            url = endpoint,
            name = api.getName(id),
            size = api.getSize(id),
            blobData = fileState[id].blobData;

        params[options.uuidParamName] = fileState[id].uuid;

        if (multipart) {
            params[options.totalFileSizeParamName] = size;

            if (blobData) {
                /**
                 * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
                 * or an empty string.  So, we will need to include the actual file name as a param in this case.
                 */
                params[options.blobs.paramNames.name] = blobData.name;
            }
        }

        //build query string
        if (!options.paramsInBody) {
            if (!multipart) {
                params[options.inputName] = name;
            }
            url = qq.obj2url(params, endpoint);
        }

        xhr.open(method, url, true);

        if (options.cors.expected && options.cors.sendCredentials) {
            xhr.withCredentials = true;
        }

        if (multipart) {
            if (options.paramsInBody) {
                qq.obj2FormData(params, formData);
            }

            formData.append(options.inputName, fileOrBlob);
            return formData;
        }

        return fileOrBlob;
    }

    function setHeaders(id, xhr) {
        var extraHeaders = options.customHeaders,
            fileOrBlob = fileState[id].file || fileState[id].blobData.blob;

        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("Cache-Control", "no-cache");

        if (!multipart) {
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            //NOTE: return mime type in xhr works on chrome 16.0.9 firefox 11.0a2
            xhr.setRequestHeader("X-Mime-Type", fileOrBlob.type);
        }

        qq.each(extraHeaders, function(name, val) {
            xhr.setRequestHeader(name, val);
        });
    }

    function handleCompletedItem(id, response, xhr) {
        var name = api.getName(id),
            size = api.getSize(id);

        fileState[id].attemptingResume = false;

        options.onProgress(id, name, size, size);
        options.onComplete(id, name, response, xhr);

        if (fileState[id]) {
            delete fileState[id].xhr;
        }

        uploadComplete(id);
    }

    function uploadNextChunk(id) {
        var chunkIdx = fileState[id].remainingChunkIdxs[0],
            chunkData = getChunkData(id, chunkIdx),
            xhr = createXhr(id),
            size = api.getSize(id),
            name = api.getName(id),
            toSend, params;

        if (fileState[id].loaded === undefined) {
            fileState[id].loaded = 0;
        }

        if (resumeEnabled && fileState[id].file) {
            persistChunkData(id, chunkData);
        }

        xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                var totalLoaded = e.loaded + fileState[id].loaded,
                    estTotalRequestsSize = calcAllRequestsSizeForChunkedUpload(id, chunkIdx, e.total);

                options.onProgress(id, name, totalLoaded, estTotalRequestsSize);
            }
        };

        options.onUploadChunk(id, name, getChunkDataForCallback(chunkData));

        params = options.paramsStore.getParams(id);
        addChunkingSpecificParams(id, params, chunkData);

        if (fileState[id].attemptingResume) {
            addResumeSpecificParams(params);
        }

        toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
        setHeaders(id, xhr);

        log('Sending chunked upload request for item ' + id + ": bytes " + (chunkData.start+1) + "-" + chunkData.end + " of " + size);
        xhr.send(toSend);
    }

    function calcAllRequestsSizeForChunkedUpload(id, chunkIdx, requestSize) {
        var chunkData = getChunkData(id, chunkIdx),
            blobSize = chunkData.size,
            overhead = requestSize - blobSize,
            size = api.getSize(id),
            chunkCount = chunkData.count,
            initialRequestOverhead = fileState[id].initialRequestOverhead,
            overheadDiff = overhead - initialRequestOverhead;

        fileState[id].lastRequestOverhead = overhead;

        if (chunkIdx === 0) {
            fileState[id].lastChunkIdxProgress = 0;
            fileState[id].initialRequestOverhead = overhead;
            fileState[id].estTotalRequestsSize = size + (chunkCount * overhead);
        }
        else if (fileState[id].lastChunkIdxProgress !== chunkIdx) {
            fileState[id].lastChunkIdxProgress = chunkIdx;
            fileState[id].estTotalRequestsSize += overheadDiff;
        }

        return fileState[id].estTotalRequestsSize;
    }

    function getLastRequestOverhead(id) {
        if (multipart) {
            return fileState[id].lastRequestOverhead;
        }
        else {
            return 0;
        }
    }

    function handleSuccessfullyCompletedChunk(id, response, xhr) {
        var chunkIdx = fileState[id].remainingChunkIdxs.shift(),
            chunkData = getChunkData(id, chunkIdx);

        fileState[id].attemptingResume = false;
        fileState[id].loaded += chunkData.size + getLastRequestOverhead(id);

        if (fileState[id].remainingChunkIdxs.length > 0) {
            uploadNextChunk(id);
        }
        else {
            if (resumeEnabled) {
                deletePersistedChunkData(id);
            }

            handleCompletedItem(id, response, xhr);
        }
    }

    function isErrorResponse(xhr, response) {
        return xhr.status !== 200 || !response.success || response.reset;
    }

    function parseResponse(id, xhr) {
        var response;

        try {
            response = qq.parseJson(xhr.responseText);

            if (response.newUuid !== undefined) {
                log("Server requested UUID change from '" + fileState[id].uuid + "' to '" + response.newUuid + "'");
                fileState[id].uuid = response.newUuid;
                onUuidChanged(id, response.newUuid);
            }
        }
        catch(error) {
            log('Error when attempting to parse xhr response text (' + error + ')', 'error');
            response = {};
        }

        return response;
    }

    function handleResetResponse(id) {
        log('Server has ordered chunking effort to be restarted on next attempt for item ID ' + id, 'error');

        if (resumeEnabled) {
            deletePersistedChunkData(id);
            fileState[id].attemptingResume = false;
        }

        fileState[id].remainingChunkIdxs = [];
        delete fileState[id].loaded;
        delete fileState[id].estTotalRequestsSize;
        delete fileState[id].initialRequestOverhead;
    }

    function handleResetResponseOnResumeAttempt(id) {
        fileState[id].attemptingResume = false;
        log("Server has declared that it cannot handle resume for item ID " + id + " - starting from the first chunk", 'error');
        handleResetResponse(id);
        api.upload(id, true);
    }

    function handleNonResetErrorResponse(id, response, xhr) {
        var name = api.getName(id);

        if (options.onAutoRetry(id, name, response, xhr)) {
            return;
        }
        else {
            handleCompletedItem(id, response, xhr);
        }
    }

    function onComplete(id, xhr) {
        var response;

        // the request was aborted/cancelled
        if (!fileState[id]) {
            return;
        }

        log("xhr - server response received for " + id);
        log("responseText = " + xhr.responseText);
        response = parseResponse(id, xhr);

        if (isErrorResponse(xhr, response)) {
            if (response.reset) {
                handleResetResponse(id);
            }

            if (fileState[id].attemptingResume && response.reset) {
                handleResetResponseOnResumeAttempt(id);
            }
            else {
                handleNonResetErrorResponse(id, response, xhr);
            }
        }
        else if (chunkFiles) {
            handleSuccessfullyCompletedChunk(id, response, xhr);
        }
        else {
            handleCompletedItem(id, response, xhr);
        }
    }

    function getChunkDataForCallback(chunkData) {
        return {
            partIndex: chunkData.part,
            startByte: chunkData.start + 1,
            endByte: chunkData.end,
            totalParts: chunkData.count
        };
    }

    function getReadyStateChangeHandler(id, xhr) {
        return function() {
            if (xhr.readyState === 4) {
                onComplete(id, xhr);
            }
        };
    }

    function persistChunkData(id, chunkData) {
        var fileUuid = api.getUuid(id),
            lastByteSent = fileState[id].loaded,
            initialRequestOverhead = fileState[id].initialRequestOverhead,
            estTotalRequestsSize = fileState[id].estTotalRequestsSize,
            cookieName = getChunkDataCookieName(id),
            cookieValue = fileUuid +
                cookieItemDelimiter + chunkData.part +
                cookieItemDelimiter + lastByteSent +
                cookieItemDelimiter + initialRequestOverhead +
                cookieItemDelimiter + estTotalRequestsSize,
            cookieExpDays = options.resume.cookiesExpireIn;

        qq.setCookie(cookieName, cookieValue, cookieExpDays);
    }

    function deletePersistedChunkData(id) {
        if (fileState[id].file) {
            var cookieName = getChunkDataCookieName(id);
            qq.deleteCookie(cookieName);
        }
    }

    function getPersistedChunkData(id) {
        var chunkCookieValue = qq.getCookie(getChunkDataCookieName(id)),
            filename = api.getName(id),
            sections, uuid, partIndex, lastByteSent, initialRequestOverhead, estTotalRequestsSize;

        if (chunkCookieValue) {
            sections = chunkCookieValue.split(cookieItemDelimiter);

            if (sections.length === 5) {
                uuid = sections[0];
                partIndex = parseInt(sections[1], 10);
                lastByteSent = parseInt(sections[2], 10);
                initialRequestOverhead = parseInt(sections[3], 10);
                estTotalRequestsSize = parseInt(sections[4], 10);

                return {
                    uuid: uuid,
                    part: partIndex,
                    lastByteSent: lastByteSent,
                    initialRequestOverhead: initialRequestOverhead,
                    estTotalRequestsSize: estTotalRequestsSize
                };
            }
            else {
                log('Ignoring previously stored resume/chunk cookie for ' + filename + " - old cookie format", "warn");
            }
        }
    }

    function getChunkDataCookieName(id) {
        var filename = api.getName(id),
            fileSize = api.getSize(id),
            maxChunkSize = options.chunking.partSize,
            cookieName;

        cookieName = "qqfilechunk" + cookieItemDelimiter + encodeURIComponent(filename) + cookieItemDelimiter + fileSize + cookieItemDelimiter + maxChunkSize;

        if (resumeId !== undefined) {
            cookieName += cookieItemDelimiter + resumeId;
        }

        return cookieName;
    }

    function getResumeId() {
        if (options.resume.id !== null &&
            options.resume.id !== undefined &&
            !qq.isFunction(options.resume.id) &&
            !qq.isObject(options.resume.id)) {

            return options.resume.id;
        }
    }

    function calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex) {
        var currentChunkIndex;

        for (currentChunkIndex = getTotalChunks(id)-1; currentChunkIndex >= firstChunkIndex; currentChunkIndex-=1) {
            fileState[id].remainingChunkIdxs.unshift(currentChunkIndex);
        }

        uploadNextChunk(id);
    }

    function onResumeSuccess(id, name, firstChunkIndex, persistedChunkInfoForResume) {
        firstChunkIndex = persistedChunkInfoForResume.part;
        fileState[id].loaded = persistedChunkInfoForResume.lastByteSent;
        fileState[id].estTotalRequestsSize = persistedChunkInfoForResume.estTotalRequestsSize;
        fileState[id].initialRequestOverhead = persistedChunkInfoForResume.initialRequestOverhead;
        fileState[id].attemptingResume = true;
        log('Resuming ' + name + " at partition index " + firstChunkIndex);

        calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
    }

    function handlePossibleResumeAttempt(id, persistedChunkInfoForResume, firstChunkIndex) {
        var name = api.getName(id),
            firstChunkDataForResume = getChunkData(id, persistedChunkInfoForResume.part),
            onResumeRetVal;

        onResumeRetVal = options.onResume(id, name, getChunkDataForCallback(firstChunkDataForResume));
        if (qq.isPromise(onResumeRetVal)) {
            log("Waiting for onResume promise to be fulfilled for " + id);
            onResumeRetVal.then(
                function() {
                    onResumeSuccess(id, name, firstChunkIndex, persistedChunkInfoForResume);
                },
                function() {
                    log("onResume promise fulfilled - failure indicated.  Will not resume.")
                    calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
                }
            );
        }
        else if (onResumeRetVal !== false) {
            onResumeSuccess(id, name, firstChunkIndex, persistedChunkInfoForResume);
        }
        else {
            log("onResume callback returned false.  Will not resume.");
            calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
        }
    }

    function handleFileChunkingUpload(id, retry) {
        var firstChunkIndex = 0,
            persistedChunkInfoForResume;

        if (!fileState[id].remainingChunkIdxs || fileState[id].remainingChunkIdxs.length === 0) {
            fileState[id].remainingChunkIdxs = [];

            if (resumeEnabled && !retry && fileState[id].file) {
                persistedChunkInfoForResume = getPersistedChunkData(id);
                if (persistedChunkInfoForResume) {
                    handlePossibleResumeAttempt(id, persistedChunkInfoForResume, firstChunkIndex);
                }
                else {
                    calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
                }
            }
            else {
                calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
            }
        }
        else {
            uploadNextChunk(id);
        }
    }

    function handleStandardFileUpload(id) {
        var fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
            name = api.getName(id),
            xhr, params, toSend;

        fileState[id].loaded = 0;

        xhr = createXhr(id);

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                fileState[id].loaded = e.loaded;
                options.onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

        params = options.paramsStore.getParams(id);
        toSend = setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id);
        setHeaders(id, xhr);

        log('Sending upload request for ' + id);
        xhr.send(toSend);
    }

    function expungeItem(id) {
        var xhr = fileState[id].xhr;

        if (xhr) {
            xhr.onreadystatechange = null;
            xhr.abort();
        }

        if (resumeEnabled) {
            deletePersistedChunkData(id);
        }

        delete fileState[id];
    }

    api = {
        /**
         * Adds File or Blob to the queue
         * Returns id to use with upload, cancel
         **/
        add: function(fileOrBlobData){
            var id, persistedChunkData,
                uuid = qq.getUniqueId();

            if (fileOrBlobData instanceof File) {
                id = fileState.push({file: fileOrBlobData}) - 1;
            }
            else if (qq.isBlob(fileOrBlobData.blob)) {
                id = fileState.push({blobData: fileOrBlobData}) - 1;
            }
            else {
                throw new Error('Passed obj in not a File or BlobData (in qq.UploadHandlerXhr)');
            }

            if (resumeEnabled) {
                persistedChunkData = getPersistedChunkData(id);

                if (persistedChunkData) {
                    uuid = persistedChunkData.uuid;
                }
            }

            fileState[id].uuid = uuid;

            return id;
        },
        getName: function(id){
            if (api.isValid(id)) {
                var file = fileState[id].file,
                    blobData = fileState[id].blobData;

                if (file) {
                    // fix missing name in Safari 4
                    //NOTE: fixed missing name firefox 11.0a2 file.fileName is actually undefined
                    return (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
                }
                else {
                    return blobData.name;
                }
            }
            else {
                log(id + " is not a valid item ID.", "error");
            }
        },
        getSize: function(id){
            /*jshint eqnull: true*/
            var fileOrBlob = fileState[id].file || fileState[id].blobData.blob;

            if (qq.isFileOrInput(fileOrBlob)) {
                return fileOrBlob.fileSize != null ? fileOrBlob.fileSize : fileOrBlob.size;
            }
            else {
                return fileOrBlob.size;
            }
        },
        getFile: function(id) {
            if (fileState[id]) {
                return fileState[id].file || fileState[id].blobData.blob;
            }
        },
        isValid: function(id) {
            return fileState[id] !== undefined;
        },
        reset: function() {
            fileState = [];
        },
        expunge: function(id) {
            return expungeItem(id);
        },
        getUuid: function(id) {
            return fileState[id].uuid;
        },
        /**
         * Sends the file identified by id to the server
         */
        upload: function(id, retry) {
            var name = this.getName(id);

            if (this.isValid(id)) {
                options.onUpload(id, name);

                if (chunkFiles) {
                    handleFileChunkingUpload(id, retry);
                }
                else {
                    handleStandardFileUpload(id);
                }
            }
        },
        cancel: function(id) {
            var onCancelRetVal = options.onCancel(id, this.getName(id));

            if (qq.isPromise(onCancelRetVal)) {
                return onCancelRetVal.then(function() {
                    expungeItem(id);
                });
            }
            else if (onCancelRetVal !== false) {
                expungeItem(id);
                return true;
            }

            return false;
        },
        getResumableFilesData: function() {
            var matchingCookieNames = [],
                resumableFilesData = [];

            if (chunkFiles && resumeEnabled) {
                if (resumeId === undefined) {
                    matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
                        cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + options.chunking.partSize + "="));
                }
                else {
                    matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
                        cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + options.chunking.partSize + "\\" +
                        cookieItemDelimiter + resumeId + "="));
                }

                qq.each(matchingCookieNames, function(idx, cookieName) {
                    var cookiesNameParts = cookieName.split(cookieItemDelimiter);
                    var cookieValueParts = qq.getCookie(cookieName).split(cookieItemDelimiter);

                    resumableFilesData.push({
                        name: decodeURIComponent(cookiesNameParts[1]),
                        size: cookiesNameParts[2],
                        uuid: cookieValueParts[0],
                        partIdx: cookieValueParts[1]
                    });
                });

                return resumableFilesData;
            }
            return [];
        }
    };

    return api;
};
