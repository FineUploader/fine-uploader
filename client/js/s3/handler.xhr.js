/**
 * Upload handler used by the upload to S3 module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to S3 buckets via the associated AWS API.
 *
 * @param options Options passed from the base handler
 * @param uploadCompleteCallback Callback to invoke when the upload has completed, regardless of success.
 * @param onUuidChanged Callback to invoke when the associated items UUID has changed by order of the server.
 * @param logCallback Used to posting log messages.
 */
qq.s3.UploadHandlerXhr = function(options, uploadCompleteCallback, onUuidChanged, log) {
    "use strict";

    var fileState = [],
        expectedStatus = 200,
        onProgress = options.onProgress,
        onComplete = options.onComplete,
        onUpload = options.onUpload,
        onGetKeyName = options.getKeyName,
        filenameParam = options.filenameParam,
        paramsStore = options.paramsStore,
        endpointStore = options.endpointStore,
        accessKey = options.accessKey,
        acl = options.acl,
        validation = options.validation,
        chunkingPossible = options.chunking.enabled && qq.supportedFeatures.chunking,
        policySignatureRequester = new qq.s3.SignatureAjaxRequestor({
            expectingPolicy: true,
            endpoint: options.signatureEndpoint,
            cors: options.cors,
            log: log
        }),
        restSignatureRequester = new qq.s3.SignatureAjaxRequestor({
            endpoint: options.signatureEndpoint,
            cors: options.cors,
            log: log
        }),
        initiateMultipartRequester = new qq.s3.InitiateMultipartAjaxRequester({
            endpointStore: endpointStore,
            paramsStore: paramsStore,
            signatureEndpoint: options.signatureEndpoint,
            accessKey: options.accessKey,
            acl: options.acl,
            cors: options.cors,
            log: log,
            getKey: function(id) {
                return fileState[id].key;
            },
            getContentType: function(id) {
                return api.getFile(id).type;
            }
        }),
        completeMultipartRequester = new qq.s3.CompleteMultipartAjaxRequester({
            endpointStore: endpointStore,
            signatureEndpoint: options.signatureEndpoint,
            accessKey: options.accessKey,
            cors: options.cors,
            log: log,
            getKey: function(id) {
                return fileState[id].key;
            }
        }),
        api;

    //TODO eliminate duplication w/ traditional handler.xhr.js
    function createXhr(id) {
        var xhr = new XMLHttpRequest();

        fileState[id].xhr = xhr;

        return xhr;
    }

    /**
     * Determine if the associated file should be chunked.
     *
     * @param id ID of the associated file
     * @returns {*} true if chunking is enabled, possible, and the file can be split into more than 1 part
     */
    function shouldChunkThisFile(id) {
        var totalChunks;

        if (!fileState[id].chunking) {
            fileState[id].chunking = {};
            totalChunks = getTotalChunks(id);
            if (totalChunks > 1) {
                fileState[id].chunking.enabled = true;
                fileState[id].chunking.parts = totalChunks;
            }
            else {
                fileState[id].chunking.enabled = false;
            }
        }

        return fileState[id].chunking.enabled;
    }

    //TODO eliminate duplication w/ traditional handler.xhr.js
    /**
     * @param id ID of the associated file
     * @returns {number} Number of parts this file can be divided into, or undefined if chunking is not supported in this UA
     */
    function getTotalChunks(id) {
        var fileSize = api.getSize(id),
            chunkSize = options.chunking.partSize;

        if (chunkingPossible) {
            return Math.ceil(fileSize / chunkSize);
        }
    }

    //TODO eliminate duplication w/ traditional handler.xhr.js
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

    //TODO eliminate duplication w/ traditional handler.xhr.js
    function getChunkData(id, chunkIndex) {
        var chunkSize = options.chunking.partSize,
            fileSize = api.getSize(id),
            fileOrBlob = api.getFile(id),
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

    //TODO eliminate duplication w/ traditional handler.xhr.js
    function getChunkDataForCallback(chunkData) {
        return {
            partIndex: chunkData.part,
            startByte: chunkData.start + 1,
            endByte: chunkData.end,
            totalParts: chunkData.count
        };
    }

    /**
     * Initiate the upload process and possibly delegate to a more specific handler if chunking is required.
     *
     * @param id Associated file ID
     */
    function handleUpload(id) {
        var fileOrBlob = api.getFile(id),
            name = api.getName(id),
            xhr;

        fileState[id].loaded = 0;
        fileState[id].type = fileOrBlob.type;

        xhr = createXhr(id);

        if (shouldChunkThisFile(id)) {
            handleChunkedUpload(id);
        }
        else {
            xhr.upload.onprogress = function(e){
                if (e.lengthComputable){
                    fileState[id].loaded = e.loaded;
                    onProgress(id, name, e.loaded, e.total);
                }
            };

            xhr.onreadystatechange = getReadyStateChangeHandler(id);

            prepareForSend(id, fileOrBlob).then(function(toSend) {
                log('Sending upload request for ' + id);
                xhr.send(toSend);
            });
        }
    }

    // TODO comments
    function handleChunkedUpload(id) {
        maybeInitiateMultipart(id).then(function(uploadId) {
            maybeUploadNextChunk(id);
        },
            function(errorMessage) {
                uploadCompleted(id, {error: errorMessage});
        });
    }

    function getNextPartIdxToSend(id) {
        return fileState[id].chunking.lastSent >= 0 ? fileState[id].chunking.lastSent + 1 : 0
    }

    function getNextChunkUrlParams(id) {
        //Amazon part indexing starts at 1
        var idx = getNextPartIdxToSend(id) + 1,
            uploadId = fileState[id].uploadId;

        return qq.format("?partNumber={}&uploadId={}", idx, uploadId);
    }

    function getNextChunkUrl(id) {
        var domain = options.endpointStore.getEndpoint(id),
            urlParams = getNextChunkUrlParams(id),
            key = fileState[id].key;

        return qq.format("{}/{}{}", domain, key, urlParams);
    }

    function maybeUploadNextChunk(id) {
        var totalParts = fileState[id].chunking.parts,
            nextPartIdx = getNextPartIdxToSend(id);

        if (nextPartIdx < totalParts) {
            uploadNextChunk(id);
        }
        else {
            completeMultipart(id);
        }
    }

    function completeMultipart(id) {
        var uploadId = fileState[id].uploadId,
            etagMap = fileState[id].chunking.etags;

        // TODO handle error?
        completeMultipartRequester.send(id, uploadId, etagMap).then(function() {
            uploadCompleted(id);
        });
    }

    function uploadNextChunk(id) {
        var idx = getNextPartIdxToSend(id),
            name = api.getName(id),
            xhr = fileState[id].xhr,
            url = getNextChunkUrl(id),
            totalFileSize = api.getSize(id),
            chunkData = getChunkData(id, idx);

        addChunkedHeaders(id).then(function(headers) {
            options.onUploadChunk(id, name, getChunkDataForCallback(chunkData));

            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    var totalLoaded = e.loaded + fileState[id].loaded;

                    options.onProgress(id, name, totalLoaded, totalFileSize);
                }
            };

            xhr.onreadystatechange = getReadyStateChangeHandler(id);

            xhr.open("PUT", url, true);


            qq.each(headers, function(name, val) {
                xhr.setRequestHeader(name, val);
            });

            qq.log(qq.format("Sending part {} of {} for file ID {} - {} ({} bytes)", chunkData.part+1, chunkData.count, id, name, chunkData.size));
            xhr.send(chunkData.blob);
        });
    }

    function addChunkedHeaders(id) {
        var headers = {},
            endpoint = options.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            key = fileState[id].key,
            date = new Date().toUTCString(),
            queryString = getNextChunkUrlParams(id),
            promise = new qq.Promise(),
            toSign;

        headers["x-amz-date"] = date;

        toSign = {multipartHeaders: "PUT\n\n\n\n" + "x-amz-date:" + date + "\n" + "/" + bucket + "/" + key + queryString};

        // Ask the local server to sign the request.  Use this signature to form the Authorization header.
        restSignatureRequester.getSignature(id, toSign).then(function(response) {
            headers.Authorization = "AWS " + options.accessKey + ":" + response.signature;
            promise.success(headers);
        }, promise.failure);

        return promise;
    }

    /**
     * Sends an "Initiate Multipart Upload" request to S3 via the REST API, but only if the MPU has not already been
     * initiated.
     *
     * @param id Associated file ID
     * @returns {qq.Promise} A promise that is fulfilled when the initiate request has been sent and the response has been parsed.
     */
    function maybeInitiateMultipart(id) {
        if (!fileState[id].uploadId) {
            return initiateMultipartRequester.send(id, fileState[id].key).then(function(uploadId) {
                fileState[id].uploadId = uploadId;
            });
        }
        else {
            return new qq.Promise().success(fileState[id].uploadId);
        }
    }

    //TODO eliminate duplication w/ traditional handler.xhr.js
    function getReadyStateChangeHandler(id) {
        var xhr = fileState[id].xhr;

        return function() {
            if (xhr.readyState === 4) {
                if (fileState[id].chunking.enabled) {
                    uploadChunkCompleted(id);
                }
                else {
                    uploadCompleted(id);
                }
            }
        };
    }

    function generateAwsParams(id) {
        var customParams = paramsStore.getParams(id);
        customParams[filenameParam] = api.getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.getEndpoint(id),
                params: customParams,
                type: fileState[id].type,
                key: fileState[id].key,
                accessKey: accessKey,
                acl: acl,
                expectedStatus: expectedStatus,
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                log: log
            },
            qq.bind(policySignatureRequester.getSignature, this, id));
    }

    function prepareForSend(id, fileOrBlob) {
        var formData = new FormData(),
            endpoint = endpointStore.getEndpoint(id),
            url = endpoint,
            xhr = fileState[id].xhr,
            promise = new qq.Promise();

        generateAwsParams(id).then(function(awsParams) {
            xhr.open("POST", url, true);

            qq.obj2FormData(awsParams, formData);

            // AWS requires the file field be named "file".
            formData.append("file", fileOrBlob);

            promise.success(formData);
        },
        function(errorMessage) {
            promise.failure(errorMessage);
            uploadCompleted(id, {error: errorMessage});
        });

        return promise;
    }

    function parseResponse(id) {
        var xhr = fileState[id].xhr,
            response = {};

        try {
            log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));

            if (xhr.status === expectedStatus) {
                response.success = true;
            }
            else {
                response.error = parseError(xhr.responseText);
            }
        }
        catch(error) {
            log('Error when attempting to parse xhr response text (' + error + ')', 'error');
        }

        return response;
    }

    function parseError(awsResponseXml) {
        var parser = new DOMParser(),
            parsedDoc = parser.parseFromString(awsResponseXml, "application/xml"),
            messageElements = parsedDoc.getElementsByTagName("Message");

        if (messageElements.length > 0) {
            return messageElements[0].textContent;
        }
    }

    function uploadChunkCompleted(id) {
        var idxSent = getNextPartIdxToSend(id),
            xhr = fileState[id].xhr,
            response = parseResponse(id),
            chunkData = getChunkData(id, idxSent),
            etag;

        if (response.success) {
            fileState[id].chunking.lastSent = idxSent;
            etag = xhr.getResponseHeader("ETag");

            if (!fileState[id].chunking.etags) {
                fileState[id].chunking.etags = [];
            }
            fileState[id].chunking.etags.push({part: idxSent+1, etag: etag});

            fileState[id].loaded += chunkData.size;
            qq.log(etag);
            maybeUploadNextChunk(id);
        }
        else if (response.error) {
            qq.log(response.error, "error");
        }
    }

    // TODO should the XHR passed to the handlers be the LAST xhr used (i.e. complete multipart request xhr if applicable)?
    function uploadCompleted(id, errorDetails) {
        var xhr = fileState[id].xhr,
            name = api.getName(id),
            size = api.getSize(id),
            response = errorDetails || parseResponse(id);

        qq.log(qq.format("Upload attempt for file ID {} to S3 is complete", id));

        onProgress(id, name, size, size);
        onComplete(id, name, response, xhr);

        if (fileState[id]) {
            delete fileState[id].xhr;
        }

        uploadCompleteCallback(id);
    }

    function handleStartUploadSignal(id, retry) {
        var name = api.getName(id);

        if (api.isValid(id)) {
            if (fileState[id].key) {
                onUpload(id, name);
                handleUpload(id);
            }
            else {
                // The S3 uploader module will either calculate the key or ask the server for it
                // and will call us back once it is known.
                onGetKeyName(id, name).then(function(key) {
                    fileState[id].key = key;
                    onUpload(id, name);
                    handleUpload(id);
                });
            }
        }
    }


    api = new qq.UploadHandlerXhrApi(fileState, handleStartUploadSignal, options.onCancel, onUuidChanged, log);

    return api;
};
