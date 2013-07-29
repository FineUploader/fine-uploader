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
        getSignatureAjaxRequester = new qq.s3.PolicySignatureAjaxRequestor({
            expectingPolicy: true,
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
            getKey: function(id) {
                return fileState[id].key;
            },
            getContentType: function(id) {
                return api.getFile(id).type;
            },
            log: log
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
        if (fileState[id].chunked === undefined) {
            if (chunkingPossible && getTotalChunks(id) > 1) {
                fileState[id].chunked = true;
            }
            else {
                fileState[id].chunked = false;
            }
        }

        return fileState[id].chunked;
    }

    //TODO eliminate duplication w/ traditional handler.xhr.js
    /**
     * @param id ID of the associated file
     * @returns {number} Number of parts this file can be divided into
     */
    function getTotalChunks(id) {
        var fileSize = api.getSize(id),
            chunkSize = options.chunking.partSize;

        return Math.ceil(fileSize / chunkSize);
    }

    /**
     * Initiate the upload process and possibly delegate to a more specific handler if chunking is required.
     *
     * @param id Associated file ID
     */
    function handleUpload(id) {
        var fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
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
            // TODO start sending chunks
        }, function(errorMessage) {
            uploadCompleted(id, {error: errorMessage});
        });
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
                uploadCompleted(id);
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
            qq.bind(getSignatureAjaxRequester.getSignature, this, id));
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
