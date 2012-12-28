/*globals qq, File, XMLHttpRequest, FormData*/
qq.UploadHandlerXhr = function(o, uploadCompleteCallback, logCallback) {
    "use strict";
    
    var options = o,
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        files = [],
        uuids = [],
        xhrs = [],
        remainingChunkIdxs = [],
        loaded = [],
        api,
        chunkFiles = options.chunking.enabled && qq.isFileChunkingSupported();


     function addChunkingSpecificParams(id, params, chunkData) {
        var size = api.getSize(id),
            name = api.getName(id);

        params[options.chunking.paramNames.partIndex] = chunkData.part;
        params[options.chunking.paramNames.partByteOffset] = chunkData.start;
        params[options.chunking.paramNames.chunkSize] = chunkData.end - chunkData.start;
        params[options.chunking.paramNames.totalParts] = chunkData.count;
        params[options.chunking.paramNames.totalFileSize] = size;

        /**
         * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
         * or an empty string.  So, we will need to include the actual file name as a param in this case.
         */
        if (options.forceMultipart || options.paramsInBody) {
            params[options.chunking.paramNames.filename] = name;
        }
    }

     function getChunk(file, startByte, endByte) {
        if (file.slice) {
            return file.slice(startByte, endByte);
        }
        else if (file.mozSlice) {
            return file.mozSlice(startByte, endByte);
        }
        else if (file.webkitSlice) {
            return file.webkitSlice(startByte, endByte);
        }
    }

    function getChunkData(id, chunkIndex) {
        var chunkSize = options.chunking.partSize,
            fileSize = api.getSize(id),
            file = files[id],
            startBytes = chunkSize * chunkIndex,
            endBytes = startBytes+chunkSize >= fileSize ? fileSize : startBytes+chunkSize,
            totalChunks = getTotalChunks(id);

        return {
            part: chunkIndex,
            start: startBytes,
            end: endBytes,
            count: totalChunks,
            blob: getChunk(file, startBytes, endBytes)
        };
    }

    function getTotalChunks(id) {
        var fileSize = api.getSize(id),
            chunkSize = options.chunking.partSize;

        return Math.ceil(fileSize / chunkSize);
    }

    function getXhr(id) {
        xhrs[id] = new XMLHttpRequest();
        return xhrs[id];
    }

    function setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id) {
        var formData = new FormData(),
            protocol = options.demoMode ? "GET" : "POST",
            url = options.endpoint,
            name = api.getName(id);

        params[options.uuidParamName] = uuids[id];

        //build query string
        if (!options.paramsInBody) {
            params[options.inputName] = name;
            url = qq.obj2url(params, options.endpoint);
        }

        xhr.open(protocol, url, true);
        if (options.forceMultipart || options.paramsInBody) {
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
            name = api.getName(id),
            forceMultipart = options.forceMultipart,
            paramsInBody = options.paramsInBody,
            file = files[id];

        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("Cache-Control", "no-cache");

        if (!forceMultipart && !paramsInBody) {
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            //NOTE: return mime type in xhr works on chrome 16.0.9 firefox 11.0a2
            xhr.setRequestHeader("X-Mime-Type", file.type);
        }

        qq.each(extraHeaders, function(name, val) {
            xhr.setRequestHeader(name, val);
        });
    }

    function completed(id, response, xhr) {
        var name = api.getName(id),
            size = api.getSize(id);

        options.onProgress(id, name, size, size);

        options.onComplete(id, name, response, xhr);
        delete xhrs[id];
        uploadComplete(id);
    }

    function uploadNextChunk(id) {
        var chunkData = getChunkData(id, remainingChunkIdxs[id][0]),
            xhr = getXhr(id),
            size = api.getSize(id),
            name = api.getName(id),
            toSend, params;

        if (loaded[id] === undefined) {
            loaded[id] = 0;
        }

        xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                if (loaded[id] < size) {
                    var totalLoaded = e.loaded + loaded[id];
                    options.onProgress(id, name, totalLoaded, size);
                }
            }
        };

        options.onUploadChunk(id, name, {
            partIndex: chunkData.part,
            startByte: chunkData.start + 1,
            endByte: chunkData.end,
            totalParts: chunkData.count
        });

        params = options.paramsStore.getParams(id);
        addChunkingSpecificParams(id, params, chunkData);

        toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
        setHeaders(id, xhr);

        log('Sending chunked upload request for ' + id + ": bytes " + (chunkData.start+1) + "-" + chunkData.end + " of " + size);
        xhr.send(toSend);
    }


     function onSuccessfullyCompletedChunk(id, response, xhr) {
        var chunkIdx = remainingChunkIdxs[id].shift(),
            chunk = getChunkData(id, chunkIdx);

        loaded[id] += chunk.end - chunk.start;

        if (remainingChunkIdxs[id].length > 0) {
            uploadNextChunk(id);
        }
        else {
            completed(id, response, xhr);
        }
    }

    function onComplete(id, xhr) {
        /*jslint evil: true*/

        var name = api.getName(id),
            response;

        // the request was aborted/cancelled
        if (!files[id]) {
            return;
        }

        log("xhr - server response received for " + id);
        log("responseText = " + xhr.responseText);

        try {
            if (typeof JSON.parse === "function") {
                response = JSON.parse(xhr.responseText);
            } else {
                response = eval("(" + xhr.responseText + ")");
            }
        } catch(error){
            log('Error when attempting to parse xhr response text (' + error + ')', 'error');
            response = {};
        }

        if (xhr.status !== 200 || !response.success || response.reset) {
            if (response.reset) {
                log('Server has ordered chunking effort to be restarted on next attempt for file ID ' + id, 'error');
                remainingChunkIdxs[id] = [];
                delete loaded[id];
            }

            if (options.onAutoRetry(id, name, response, xhr)) {
                return;
            }
            else {
                completed(id, response, xhr);
            }
        }
        else if (chunkFiles) {
            onSuccessfullyCompletedChunk(id, response, xhr);
        }
        else {
            completed(id, response, xhr);
        }
    }

     function getReadyStateChangeHandler(id, xhr) {
        return function() {
            if (xhr.readyState === 4) {
                onComplete(id, xhr);
            }
        };
    }


    api = {
        /**
         * Adds file to the queue
         * Returns id to use with upload, cancel
         **/
        add: function(file){
            if (!(file instanceof File)){
                throw new Error('Passed obj in not a File (in qq.UploadHandlerXhr)');
            }


            var id = files.push(file) - 1;
            uuids[id] = qq.getUniqueId();

            return id;
        },
        getName: function(id){
            var file = files[id];
            // fix missing name in Safari 4
            //NOTE: fixed missing name firefox 11.0a2 file.fileName is actually undefined
            return (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
        },
        getSize: function(id){
            /*jshint eqnull: true*/
            var file = files[id];
            return file.fileSize != null ? file.fileSize : file.size;
        },
        /**
         * Returns uploaded bytes for file identified by id
         */
        getLoaded: function(id){
            return loaded[id] || 0;
        },
        isValid: function(id) {
            return files[id] !== undefined;
        },
        reset: function() {
            files = [];
            uuids = [];
            xhrs = [];
            loaded = [];
            remainingChunkIdxs = [];
        },
        getUuid: function(id) {
            return uuids[id];
        },
        /**
         * Sends the file identified by id to the server
         */
        upload: function(id){
            var file = files[id],
                name = this.getName(id),
                xhr,
                params,
                toSend,
                chunkIndex;

            options.onUpload(id, this.getName(id));

            if (chunkFiles) {
                if (!remainingChunkIdxs[id] || remainingChunkIdxs[id].length === 0) {
                    remainingChunkIdxs[id] = [];
                    for (chunkIndex = getTotalChunks(id) - 1; chunkIndex >= 0; chunkIndex-=1) {
                        remainingChunkIdxs[id].unshift(chunkIndex);
                    }
                }

                uploadNextChunk(id);
            }
            else {
                loaded[id] = 0;

                xhr = getXhr(id);

                xhr.upload.onprogress = function(e){
                    if (e.lengthComputable){
                        loaded[id] = e.loaded;
                        options.onProgress(id, name, e.loaded, e.total);
                    }
                };

                xhr.onreadystatechange = getReadyStateChangeHandler(id, xhr);

                params = options.paramsStore.getParams(id);
                toSend = setParamsAndGetEntityToSend(params, xhr, file, id);
                setHeaders(id, xhr);

                log('Sending upload request for ' + id);
                xhr.send(toSend);
            }
        },
        cancel: function(id){
            options.onCancel(id, this.getName(id));

            delete files[id];
            delete uuids[id];

            if (xhrs[id]){
                xhrs[id].abort();
                delete xhrs[id];
            }

            delete remainingChunkIdxs[id];
        }
    };

    return api;
};
