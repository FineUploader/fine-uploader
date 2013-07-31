/**
 * Upload handler used by the upload to S3 module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to S3 buckets via the associated AWS API.
 *
 * If chunking is supported and enabled, the S3 Multipart Upload REST API is utilized.
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
        api,
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
        });


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
        var fileOrBlob = api.getFile(id);

        fileState[id].type = fileOrBlob.type;

        createXhr(id);

        if (shouldChunkThisFile(id)) {
            // We might be retrying a failed in-progress upload, so it's important that we
            // don't reset this value so we don't wipe out the record of all successfully
            // uploaded chunks for this file.
            if (fileState[id].loaded === undefined) {
                fileState[id].loaded = 0;
            }

            handleChunkedUpload(id);
        }
        else {
            fileState[id].loaded = 0;
            handleSimpleUpload(id);
        }
    }

    // Starting point for incoming requests for chunked uploads.
    function handleChunkedUpload(id) {
        maybeInitiateMultipart(id).then(
            // The "Initiate" request succeeded.  We are ready to send the first chunk.
            function(uploadId, xhr) {
                maybeUploadNextChunk(id);
            },

            // We were unable to initiate the chunked upload process.
            function(errorMessage, xhr) {
                uploadCompleted(id, {error: errorMessage}, xhr);
            }
        );
    }

    // Starting point for incoming requests for simple (non-chunked) uploads.
    function handleSimpleUpload(id) {
        var xhr = fileState[id].xhr,
            name = api.getName(id),
            fileOrBlob = api.getFile(id);

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                fileState[id].loaded = e.loaded;
                onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = getReadyStateChangeHandler(id);

        // Delegate to a function the sets up the XHR request and notifies us when it is ready to be sent, along w/ the payload.
        prepareForSend(id, fileOrBlob).then(function(toSend) {
            log('Sending upload request for ' + id);
            xhr.send(toSend);
        });
    }

    /**
     * Retrieves the 0-based index of the next chunk to send.  Note that AWS uses 1-based indexing.
     *
     * @param id File ID
     * @returns {number} The 0-based index of the next file chunk to be sent to S3
     */
    function getNextPartIdxToSend(id) {
        return fileState[id].chunking.lastSent >= 0 ? fileState[id].chunking.lastSent + 1 : 0
    }

    /**
     * @param id File ID
     * @returns {string} The query string portion of the URL used to direct multipart upload requests
     */
    function getNextChunkUrlParams(id) {
        // Amazon part indexing starts at 1
        var idx = getNextPartIdxToSend(id) + 1,
            uploadId = fileState[id].chunking.uploadId;

        return qq.format("?partNumber={}&uploadId={}", idx, uploadId);
    }

    /**
     * @param id File ID
     * @returns {string} The entire URL to use when sending a multipart upload PUT request for the next chunk to be sent
     */
    function getNextChunkUrl(id) {
        var domain = options.endpointStore.getEndpoint(id),
            urlParams = getNextChunkUrlParams(id),
            key = fileState[id].key;

        return qq.format("{}/{}{}", domain, key, urlParams);
    }

    // Either initiate an upload for the next chunk for an associated file, or initiate a
    // "Complete Multipart Upload" request if there are no more parts to be sent.
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

    // Sends a "Complete Multipart Upload" request and then signals completion of the upload
    // when the response to this request has been parsed.
    function completeMultipart(id) {
        var uploadId = fileState[id].chunking.uploadId,
            etagMap = fileState[id].chunking.etags;

        completeMultipartRequester.send(id, uploadId, etagMap).then(
            // Successfully completed
            function(xhr) {
                uploadCompleted(id, null, xhr);
            },

            // Complete request failed
            function(errorMsg, xhr) {
                uploadCompleted(id, {error: errorMsg}, xhr);
            }
        );
    }

    // Initiate the process to send the next chunk for a file.  This assumes there IS a "next" chunk.
    function uploadNextChunk(id) {
        var idx = getNextPartIdxToSend(id),
            name = api.getName(id),
            xhr = fileState[id].xhr,
            url = getNextChunkUrl(id),
            totalFileSize = api.getSize(id),
            chunkData = getChunkData(id, idx);

        // Add appropriate headers to the multipart upload request.
        // Once these have been determined (asynchronously) attach the headers and send the chunk.
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

    /**
     * Determines headers that must be attached to the chunked (Multipart Upload) request.  One of these headers is an
     * Authorization value, which must be determined by asking the local server to sign the request first.  So, this
     * function returns a promise.  Once all headers are determined, the `success` method of the promise is called with
     * the headers object.  If there was some problem determining the headers, we delegate to the caller's `failure`
     * callback.
     *
     * @param id File ID
     * @returns {qq.Promise}
     */
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
        if (!fileState[id].chunking.uploadId) {
            return initiateMultipartRequester.send(id, fileState[id].key).then(
                function(uploadId) {
                    fileState[id].chunking.uploadId = uploadId;
                }
            );
        }
        else {
            return new qq.Promise().success(fileState[id].chunking.uploadId);
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

    /**
     * Used for simple (non-chunked) uploads to determine the parameters to send along with the request.  Part of this
     * process involves asking the local server to sign the request, so this function returns a promise.  The promise
     * is fulfilled when all parameters are determined, or when we determine that all parameters cannnot be calculated
     * due to some error.
     *
     * @param id File ID
     * @returns {qq.Promise}
     */
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

    /**
     * Starts the upload process by delegating to an async function that determine parameters to be attached to the
     * request.  If all params can be determined, we are called back with the params and the caller of this function is
     * informed by invoking the `success` method on the promise returned by this function, passing the payload of the
     * request.  If some error occurs here, we delegate to a function that signals a failure for this upload attempt.
     *
     * Note that this is only used by the simple (non-chunked) upload process.
     *
     * @param id File ID
     * @param fileOrBlob `File` or `Blob` to send
     * @returns {qq.Promise}
     */
    function prepareForSend(id, fileOrBlob) {
        var formData = new FormData(),
            endpoint = endpointStore.getEndpoint(id),
            url = endpoint,
            xhr = fileState[id].xhr,
            promise = new qq.Promise();

        generateAwsParams(id).then(
            // Success - all params determined
            function(awsParams) {
                xhr.open("POST", url, true);

                qq.obj2FormData(awsParams, formData);

                // AWS requires the file field be named "file".
                formData.append("file", fileOrBlob);

                promise.success(formData);
            },

            // Failure - we couldn't determine some params (likely the signature)
            function(errorMessage) {
                promise.failure(errorMessage);
                uploadCompleted(id, {error: errorMessage});
            }
        );

        return promise;
    }

    /**
     * @param id File ID
     * @param requestXhr The XHR object associated with the call, if the upload XHR is not appropriate.
     * @returns {object} Object containing the parsed response, or perhaps some error data injected in `error` and `code` properties
     */
    function parseResponse(id, requestXhr) {
        var xhr = requestXhr || fileState[id].xhr,
            response = {},
            parsedErrorProps;

        try {
            log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));

            if (xhr.status === expectedStatus) {
                response.success = true;
            }
            else {
                parsedErrorProps = parseError(xhr.responseText);

                if (parsedErrorProps) {
                    response.error = parsedErrorProps.message;
                    response.code = parsedErrorProps.code;
                }
            }
        }
        catch(error) {
            log('Error when attempting to parse xhr response text (' + error + ')', 'error');
        }

        return response;
    }

    /**
     * This parses an XML response by extracting the "Message" and "Code" elements that accompany AWS error responses.
     *
     * @param awsResponseXml XML response from AWS
     * @returns {object} Object w/ `code` and `message` properties, or undefined if we couldn't find error info in the XML document.
     */
    function parseError(awsResponseXml) {
        var parser = new DOMParser(),
            parsedDoc = parser.parseFromString(awsResponseXml, "application/xml"),
            errorEls = parsedDoc.getElementsByTagName("Error"),
            errorDetails = {},
            codeEls, messageEls;

        if (errorEls.length) {
            codeEls = parsedDoc.getElementsByTagName("Code");
            messageEls = parsedDoc.getElementsByTagName("Message");

            if (messageEls.length) {
                errorDetails.message = messageEls[0].textContent;
            }

            if (codeEls.length) {
                errorDetails.code = codeEls[0].textContent;
            }

            return errorDetails;
        }
    }

    // The (usually) last step in handling a chunked upload.  This is called after each chunk has been sent.
    // The request may be successful, or not.  If it was successful, we must extract the "ETag" element
    // in the XML response and store that along with the associated part number.
    // We need these items to "Complete" the multipart upload after all chunks have been successfully sent.
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

            // Update the bytes loaded counter to reflect all bytes successfully transferred in the associated chunked request
            fileState[id].loaded += chunkData.size;

            // We might not be done with this file...
            maybeUploadNextChunk(id);
        }
        else {
            if (response.error) {
                qq.log(response.error, "error");
            }

            uploadCompleted(id);
        }
    }

    // Determine if the upload should be restarted on the next retry attempt
    // based on the error code returned in the response from AWS.
    function shouldResetOnRetry(errorCode) {
        return errorCode === "EntityTooSmall"
            || errorCode === "InvalidPart"
            || errorCode === "InvalidPartOrder"
            || errorCode === "NoSuchUpload";
    }

    /**
     * Note that this is called when an upload has reached a termination point,
     * regardless of success/failure.  For example, it is called when we have
     * encountered an error during the upload or when the file may have uploaded successfully.
     *
     * @param id file ID
     * @param errorDetails Any error details associated with the upload.  Format: {error: message}.
     * @param requestXhr The XHR object associated with the call, if the upload XHR is not appropriate.
     */
    function uploadCompleted(id, errorDetails, requestXhr) {
        var xhr = requestXhr || fileState[id].xhr,
            name = api.getName(id),
            size = api.getSize(id),
            // This is the response we will use internally to determine if we need to do something special in case of a failure
            responseToExamine = parseResponse(id, requestXhr),
            // This is the response we plan on passing to external callbacks
            responseToBubble = errorDetails || parseResponse(id);

        // If this upload failed, we might want to completely start the upload over on retry in some cases.
        if (!responseToExamine.success) {
            if (shouldResetOnRetry(responseToExamine.code)) {
                qq.log('This is an unrecoverable error, we must restart the upload entirely on the next retry attempt.', 'error');
                delete fileState[id].loaded;
                delete fileState[id].chunking;
            }
        }

        // If this upload failed AND we are expecting an auto-retry, we are not done yet.
        if (responseToExamine.success || !options.onAutoRetry(id, name, responseToBubble, xhr)) {
            qq.log(qq.format("Upload attempt for file ID {} to S3 is complete", id));

            onProgress(id, name, size, size);
            onComplete(id, name, responseToBubble, xhr);

            if (fileState[id]) {
                delete fileState[id].xhr;
            }

            uploadCompleteCallback(id);
        }
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
