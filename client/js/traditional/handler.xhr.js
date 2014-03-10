/*globals qq*/
/**
 * Upload handler used to upload to traditional endpoints.  It depends on File API support, and, therefore,
 * makes use of `XMLHttpRequest` level 2 to upload `File`s and `Blob`s to a generic server.
 *
 * @param spec Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
qq.UploadHandlerXhr = function(spec, proxy) {
    "use strict";

    var uploadComplete = proxy.onUploadComplete,
        onUuidChanged = proxy.onUuidChanged,
        getName = proxy.getName,
        getUuid = proxy.getUuid,
        getSize = proxy.getSize,
        getDataByUuid = proxy.getDataByUuid,
        log = proxy.log,
        cookieItemDelimiter = "|",
        chunkFiles = spec.chunking.enabled && qq.supportedFeatures.chunking,
        resumeEnabled = spec.resume.enabled && chunkFiles && qq.supportedFeatures.resume,
        multipart = spec.forceMultipart || spec.paramsInBody,
        handler = this,
        resumeId;

    function getResumeId() {
        if (spec.resume.id !== null &&
            spec.resume.id !== undefined &&
            !qq.isFunction(spec.resume.id) &&
            !qq.isObject(spec.resume.id)) {

            return spec.resume.id;
        }
    }

    resumeId = getResumeId();

    function addChunkingSpecificParams(id, params, chunkData) {
        var size = getSize(id),
            name = getName(id);

        params[spec.chunking.paramNames.partIndex] = chunkData.part;
        params[spec.chunking.paramNames.partByteOffset] = chunkData.start;
        params[spec.chunking.paramNames.chunkSize] = chunkData.size;
        params[spec.chunking.paramNames.totalParts] = chunkData.count;
        params[spec.totalFileSizeName] = size;

        /**
         * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
         * or an empty string.  So, we will need to include the actual file name as a param in this case.
         */
        if (multipart) {
            params[spec.filenameParam] = name;
        }
    }

    function addResumeSpecificParams(params) {
        params[spec.resume.paramNames.resuming] = true;
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

    function setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id) {
        var formData = new FormData(),
            method = spec.demoMode ? "GET" : "POST",
            endpoint = spec.endpointStore.get(id),
            url = endpoint,
            name = getName(id),
            size = getSize(id);

        params[spec.uuidName] = getUuid(id);
        params[spec.filenameParam] = name;


        if (multipart) {
            params[spec.totalFileSizeName] = size;
        }

        //build query string
        if (!spec.paramsInBody) {
            if (!multipart) {
                params[spec.inputName] = name;
            }
            url = qq.obj2url(params, endpoint);
        }

        xhr.open(method, url, true);

        if (spec.cors.expected && spec.cors.sendCredentials) {
            xhr.withCredentials = true;
        }

        if (multipart) {
            if (spec.paramsInBody) {
                qq.obj2FormData(params, formData);
            }

            formData.append(spec.inputName, fileOrBlob);
            return formData;
        }

        return fileOrBlob;
    }

    function setHeaders(id, xhr) {
        var extraHeaders = spec.customHeaders,
            fileOrBlob = handler.getFile(id);

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
        var name = getName(id),
            size = getSize(id);

        handler._getFileState(id).attemptingResume = false;

        spec.onProgress(id, name, size, size);
        spec.onComplete(id, name, response, xhr);

        if (handler._getFileState(id)) {
            delete handler._getFileState(id).xhr;
        }

        uploadComplete(id);
    }

    function uploadNextChunk(id) {
        var chunkIdx = handler._getFileState(id).remainingChunkIdxs[0],
            chunkData = handler._getChunkData(id, chunkIdx),
            xhr = handler._createXhr(id),
            size = getSize(id),
            name = getName(id),
            toSend, params;

        if (handler._getFileState(id).loaded === undefined) {
            handler._getFileState(id).loaded = 0;
        }

        if (resumeEnabled && handler.getFile(id)) {
            persistChunkData(id, chunkData);
        }

        xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                var totalLoaded = e.loaded + handler._getFileState(id).loaded,
                    estTotalRequestsSize = calcAllRequestsSizeForChunkedUpload(id, chunkIdx, e.total);

                spec.onProgress(id, name, totalLoaded, estTotalRequestsSize);
            }
        };

        spec.onUploadChunk(id, name, handler._getChunkDataForCallback(chunkData));

        params = spec.paramsStore.get(id);
        addChunkingSpecificParams(id, params, chunkData);

        if (handler._getFileState(id).attemptingResume) {
            addResumeSpecificParams(params);
        }

        toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
        setHeaders(id, xhr);

        log("Sending chunked upload request for item " + id + ": bytes " + (chunkData.start+1) + "-" + chunkData.end + " of " + size);
        xhr.send(toSend);
    }

    function calcAllRequestsSizeForChunkedUpload(id, chunkIdx, requestSize) {
        var chunkData = handler._getChunkData(id, chunkIdx),
            blobSize = chunkData.size,
            overhead = requestSize - blobSize,
            size = getSize(id),
            chunkCount = chunkData.count,
            initialRequestOverhead = handler._getFileState(id).initialRequestOverhead,
            overheadDiff = overhead - initialRequestOverhead;

        handler._getFileState(id).lastRequestOverhead = overhead;

        if (chunkIdx === 0) {
            handler._getFileState(id).lastChunkIdxProgress = 0;
            handler._getFileState(id).initialRequestOverhead = overhead;
            handler._getFileState(id).estTotalRequestsSize = size + (chunkCount * overhead);
        }
        else if (handler._getFileState(id).lastChunkIdxProgress !== chunkIdx) {
            handler._getFileState(id).lastChunkIdxProgress = chunkIdx;
            handler._getFileState(id).estTotalRequestsSize += overheadDiff;
        }

        return handler._getFileState(id).estTotalRequestsSize;
    }

    function getLastRequestOverhead(id) {
        if (multipart) {
            return handler._getFileState(id).lastRequestOverhead;
        }
        else {
            return 0;
        }
    }

    function handleSuccessfullyCompletedChunk(id, response, xhr) {
        var chunkIdx = handler._getFileState(id).remainingChunkIdxs.shift(),
            chunkData = handler._getChunkData(id, chunkIdx);

        handler._getFileState(id).attemptingResume = false;
        handler._getFileState(id).loaded += chunkData.size + getLastRequestOverhead(id);

        spec.onUploadChunkSuccess(id, handler._getChunkDataForCallback(chunkData), response, xhr);

        if (handler._getFileState(id).remainingChunkIdxs.length > 0) {
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
            log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));

            response = qq.parseJson(xhr.responseText);

            if (response.newUuid !== undefined) {
                onUuidChanged(id, response.newUuid);
            }
        }
        catch(error) {
            log("Error when attempting to parse xhr response text (" + error.message + ")", "error");
            response = {};
        }

        return response;
    }

    function handleResetResponse(id) {
        log("Server has ordered chunking effort to be restarted on next attempt for item ID " + id, "error");

        if (resumeEnabled) {
            deletePersistedChunkData(id);
            handler._getFileState(id).attemptingResume = false;
        }

        handler._getFileState(id).remainingChunkIdxs = [];
        delete handler._getFileState(id).loaded;
        delete handler._getFileState(id).estTotalRequestsSize;
        delete handler._getFileState(id).initialRequestOverhead;
    }

    function handleResetResponseOnResumeAttempt(id) {
        handler._getFileState(id).attemptingResume = false;
        log("Server has declared that it cannot handle resume for item ID " + id + " - starting from the first chunk", "error");
        handleResetResponse(id);
        handler.upload(id, true);
    }

    function handleNonResetErrorResponse(id, response, xhr) {
        var name = getName(id);

        if (spec.onAutoRetry(id, name, response, xhr)) {
            return;
        }
        else {
            if (xhr.status !== 200) {
                response.success = false;
            }

            handleCompletedItem(id, response, xhr);
        }
    }

    function onComplete(id, xhr) {
        var state = handler._getFileState(id),
            attemptingResume = state && state.attemptingResume,
            paused = state && state.paused,
            response;

        // The logic in this function targets uploads that have not been paused or canceled,
        // so return at once if this is not the case.
        if (!state || paused) {
            return;
        }

        log("xhr - server response received for " + id);
        log("responseText = " + xhr.responseText);
        response = parseResponse(id, xhr);

        if (isErrorResponse(xhr, response)) {
            if (response.reset) {
                handleResetResponse(id);
            }

            if (attemptingResume && response.reset) {
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

    function getReadyStateChangeHandler(id, xhr) {
        return function() {
            if (xhr.readyState === 4) {
                onComplete(id, xhr);
            }
        };
    }

    function persistChunkData(id, chunkData) {
        if (handler.isResumable(id)) {
            var fileUuid = getUuid(id),
                lastByteSent = handler._getFileState(id).loaded,
                initialRequestOverhead = handler._getFileState(id).initialRequestOverhead,
                estTotalRequestsSize = handler._getFileState(id).estTotalRequestsSize,
                cookieName = getChunkDataCookieName(id),
                cookieValue = fileUuid +
                    cookieItemDelimiter + chunkData.part +
                    cookieItemDelimiter + lastByteSent +
                    cookieItemDelimiter + initialRequestOverhead +
                    cookieItemDelimiter + estTotalRequestsSize,
                cookieExpDays = spec.resume.cookiesExpireIn;

            qq.setCookie(cookieName, cookieValue, cookieExpDays);
        }
    }

    function deletePersistedChunkData(id) {
        if (handler.isResumable(id) && handler.getFile(id)) {
            var cookieName = getChunkDataCookieName(id);
            qq.deleteCookie(cookieName);
        }
    }

    function getPersistedChunkData(id) {
        var chunkCookieValue = qq.getCookie(getChunkDataCookieName(id)),
            filename = getName(id),
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
                log("Ignoring previously stored resume/chunk cookie for " + filename + " - old cookie format", "warn");
            }
        }
    }

    function getChunkDataCookieName(id) {
        var filename = getName(id),
            fileSize = getSize(id),
            maxChunkSize = spec.chunking.partSize,
            cookieName;

        cookieName = "qqfilechunk" + cookieItemDelimiter + encodeURIComponent(filename) + cookieItemDelimiter + fileSize + cookieItemDelimiter + maxChunkSize;

        if (resumeId !== undefined) {
            cookieName += cookieItemDelimiter + resumeId;
        }

        return cookieName;
    }

    function calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex) {
        var currentChunkIndex;

        for (currentChunkIndex = handler._getTotalChunks(id)-1; currentChunkIndex >= firstChunkIndex; currentChunkIndex-=1) {
            handler._getFileState(id).remainingChunkIdxs.unshift(currentChunkIndex);
        }

        uploadNextChunk(id);
    }

    function onResumeSuccess(id, name, firstChunkIndex, persistedChunkInfoForResume) {
        firstChunkIndex = persistedChunkInfoForResume.part;
        handler._getFileState(id).loaded = persistedChunkInfoForResume.lastByteSent;
        handler._getFileState(id).estTotalRequestsSize = persistedChunkInfoForResume.estTotalRequestsSize;
        handler._getFileState(id).initialRequestOverhead = persistedChunkInfoForResume.initialRequestOverhead;
        handler._getFileState(id).attemptingResume = true;
        log("Resuming " + name + " at partition index " + firstChunkIndex);

        calculateRemainingChunkIdxsAndUpload(id, firstChunkIndex);
    }

    function startResumeAttempt(id, persistedChunkInfoForResume, firstChunkIndex) {
        var name = getName(id),
            firstChunkDataForResume = handler._getChunkData(id, persistedChunkInfoForResume.part),
            onResumeRetVal;

        onResumeRetVal = spec.onResume(id, name, handler._getChunkDataForCallback(firstChunkDataForResume));
        if (onResumeRetVal instanceof qq.Promise) {
            log("Waiting for onResume promise to be fulfilled for " + id);
            onResumeRetVal.then(
                function() {
                    onResumeSuccess(id, name, firstChunkIndex, persistedChunkInfoForResume);
                },
                function() {
                    log("onResume promise fulfilled - failure indicated.  Will not resume.");
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
        if (!handler._getFileState(id).remainingChunkIdxs ||
            handler._getFileState(id).remainingChunkIdxs.length === 0) {

            handleStartOfChunkedUpload(id, retry);
        }
        else {
            uploadNextChunk(id);
        }
    }

    function handleStartOfChunkedUpload(id, retry) {
        handler._getFileState(id).remainingChunkIdxs = [];

        if (resumeEnabled &&
            !retry &&
            handler.getFile(id) &&
            handler.isResumable(id)) {

            maybeResumeChunkedUpload(id);
        }
        else {
            calculateRemainingChunkIdxsAndUpload(id, 0);
        }
    }

    function maybeResumeChunkedUpload(id) {
        var persistedChunkInfoForResume = getPersistedChunkData(id);

        if (persistedChunkInfoForResume) {
            startResumeAttempt(id, persistedChunkInfoForResume, 0);
        }
        else {
            calculateRemainingChunkIdxsAndUpload(id, 0);
        }
    }

    function handleStandardFileUpload(id) {
        var fileOrBlob = handler.getFile(id),
            name = getName(id),
            xhr, params, toSend;

        handler._getFileState(id).loaded = 0;

        xhr = handler._createXhr(id);

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                handler._getFileState(id).loaded = e.loaded;
                spec.onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

        params = spec.paramsStore.get(id);
        toSend = setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id);
        setHeaders(id, xhr);

        log("Sending upload request for " + id);
        xhr.send(toSend);
    }

    function handleUploadSignal(id, retry) {
        var name = getName(id);

        if (handler.isValid(id)) {
            spec.onUpload(id, name);

            if (chunkFiles) {
                handleFileChunkingUpload(id, retry);
            }
            else {
                handleStandardFileUpload(id);
            }
        }
    }


    qq.extend(this, new qq.AbstractUploadHandlerXhr({
            options: {
                chunking: chunkFiles ? spec.chunking : null
            },

            proxy: {
                onUpload: handleUploadSignal,
                onCancel: spec.onCancel,
                onUuidChanged: onUuidChanged,
                getName: getName,
                getSize: getSize,
                getUuid: getUuid,
                log: log
            }
        }
    ));

    qq.override(this, function(super_) {
        return {
            add: function(id, fileOrBlobData) {
                var persistedChunkData;

                super_.add.apply(this, arguments);

                if (resumeEnabled) {
                    persistedChunkData = getPersistedChunkData(id);

                    if (persistedChunkData) {
                        // If this is a duplicate of another file submitted during this session,
                        // it is not eligible for resume
                        if (getDataByUuid(persistedChunkData.uuid)) {
                            handler._markNotResumable(id);
                        }
                        else {
                            onUuidChanged(id, persistedChunkData.uuid);
                        }
                    }
                }

                return id;
            },

            getResumableFilesData: function() {
                var matchingCookieNames = [],
                    resumableFilesData = [];

                if (chunkFiles && resumeEnabled) {
                    if (resumeId === undefined) {
                        matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
                            cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + spec.chunking.partSize + "="));
                    }
                    else {
                        matchingCookieNames = qq.getCookieNames(new RegExp("^qqfilechunk\\" + cookieItemDelimiter + ".+\\" +
                            cookieItemDelimiter + "\\d+\\" + cookieItemDelimiter + spec.chunking.partSize + "\\" +
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
            },

            expunge: function(id) {
                if (resumeEnabled) {
                    deletePersistedChunkData(id);
                }

                super_.expunge(id);
            }
        };
    });
};
