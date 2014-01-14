/*globals qq */
/**
 * Upload handler used by the upload to S3 module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to S3 buckets via the associated AWS API.
 *
 * If chunking is supported and enabled, the S3 Multipart Upload REST API is utilized.
 *
 * @param spec Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
qq.s3.UploadHandlerXhr = function(spec, proxy) {
    "use strict";

    var fileState = [],
        uploadCompleteCallback = proxy.onUploadComplete,
        onUuidChanged = proxy.onUuidChanged,
        getName = proxy.getName,
        getUuid = proxy.getUuid,
        getSize = proxy.getSize,
        log = proxy.log,
        expectedStatus = 200,
        onProgress = spec.onProgress,
        onComplete = spec.onComplete,
        onUpload = spec.onUpload,
        onGetKeyName = spec.getKeyName,
        filenameParam = spec.filenameParam,
        paramsStore = spec.paramsStore,
        endpointStore = spec.endpointStore,
        acl = spec.objectProperties.acl,
        reducedRedundancy = spec.objectProperties.reducedRedundancy,
        validation = spec.validation,
        signature = spec.signature,
        chunkingPossible = spec.chunking.enabled && qq.supportedFeatures.chunking,
        resumeEnabled = spec.resume.enabled && chunkingPossible && qq.supportedFeatures.resume && window.localStorage !== undefined,
        internalApi = {},
        publicApi = this,
        credentialsProvider = spec.signature.credentialsProvider,
        policySignatureRequester = new qq.s3.RequestSigner({
            expectingPolicy: true,
            signatureSpec: signature,
            cors: spec.cors,
            log: log
        }),
        restSignatureRequester = new qq.s3.RequestSigner({
            signatureSpec: signature,
            cors: spec.cors,
            log: log
        }),
        initiateMultipartRequester = new qq.s3.InitiateMultipartAjaxRequester({
            filenameParam: filenameParam,
            endpointStore: endpointStore,
            paramsStore: paramsStore,
            signatureSpec: signature,
            acl: acl,
            reducedRedundancy: reducedRedundancy,
            cors: spec.cors,
            log: log,
            getContentType: function(id) {
                return publicApi.getFile(id).type;
            },
            getKey: function(id) {
                return getUrlSafeKey(id);
            },
            getName: function(id) {
                return getName(id);
            }
        }),
        completeMultipartRequester = new qq.s3.CompleteMultipartAjaxRequester({
            endpointStore: endpointStore,
            signatureSpec: signature,
            cors: spec.cors,
            log: log,
            getKey: function(id) {
                return getUrlSafeKey(id);
            }
        }),
        abortMultipartRequester = new qq.s3.AbortMultipartAjaxRequester({
            endpointStore: endpointStore,
            signatureSpec: signature,
            cors: spec.cors,
            log: log,
            getKey: function(id) {
                return getUrlSafeKey(id);
            }
        });


// ************************** Shared ******************************

    function getUrlSafeKey(id) {
        return encodeURIComponent(getActualKey(id));
    }

    function getActualKey(id) {
        return fileState[id].key;
    }

    function setKey(id, key) {
        fileState[id].key = key;
    }

    /**
     * Initiate the upload process and possibly delegate to a more specific handler if chunking is required.
     *
     * @param id Associated file ID
     */
    function handleUpload(id) {
        var fileOrBlob = publicApi.getFile(id);

        fileState[id].type = fileOrBlob.type;

        internalApi.createXhr(id);

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

    // Determine if the upload should be restarted on the next retry attempt
    // based on the error code returned in the response from AWS.
    function shouldResetOnRetry(errorCode) {
        /*jshint -W014 */
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
            name = getName(id),
            size = getSize(id),
            // This is the response we will use internally to determine if we need to do something special in case of a failure
            responseToExamine = parseResponse(id, requestXhr),
            // This is the response we plan on passing to external callbacks
            responseToBubble = errorDetails || parseResponse(id),
            paused = fileState[id].paused,
            /*jshint -W116*/
            isError = !paused && (errorDetails != null || responseToExamine.success !== true);

        // If this upload failed, we might want to completely start the upload over on retry in some cases.
        if (isError) {
            if (shouldResetOnRetry(responseToExamine.code)) {
                log("This is an unrecoverable error, we must restart the upload entirely on the next retry attempt.", "error");
                maybeDeletePersistedChunkData(id);
                delete fileState[id].loaded;
                delete fileState[id].chunking;
            }
        }

        // If this upload failed AND we are expecting an auto-retry, we are not done yet.  Otherwise, we are done.
        if (!isError || !spec.onAutoRetry(id, name, responseToBubble, xhr)) {
            log(qq.format("Upload attempt for file ID {} to S3 is complete", id));

            // If the upload has not failed and has not been paused, clean up state date
            if (!isError && !paused) {
                responseToBubble.success = true;
                onProgress(id, name, size, size);
                maybeDeletePersistedChunkData(id);
                delete fileState[id].loaded;
                delete fileState[id].chunking;
            }

            // Only declare the upload complete (to listeners) if it has not been paused.
            if (paused) {
                qq.log(qq.format("Detected pause on {} ({}).", id, name));
            }
            else {
                onComplete(id, name, responseToBubble, xhr);
                fileState[id] && delete fileState[id].xhr;
                uploadCompleteCallback(id);
            }
        }
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
            log("Error when attempting to parse xhr response text (" + error.message + ")", "error");
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

    function handleStartUploadSignal(id, retry) {
        var name = getName(id);

        if (publicApi.isValid(id)) {
            maybePrepareForResume(id);

            if (getActualKey(id) !== undefined) {
                onUpload(id, name);
                handleUpload(id);
            }
            else {
                // The S3 uploader module will either calculate the key or ask the server for it
                // and will call us back once it is known.
                onGetKeyName(id, name).then(function(key) {
                    setKey(id, key);
                    onUpload(id, name);
                    handleUpload(id);
                }, function(errorReason) {
                    uploadCompleted(id, {error: errorReason});
                });
            }
        }
    }


// ************************** Simple Uploads ******************************

    // Starting point for incoming requests for simple (non-chunked) uploads.
    function handleSimpleUpload(id) {
        var xhr = fileState[id].xhr,
            name = getName(id),
            fileOrBlob = publicApi.getFile(id);

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                fileState[id].loaded = e.loaded;
                onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = getReadyStateChangeHandler(id);

        // Delegate to a function the sets up the XHR request and notifies us when it is ready to be sent, along w/ the payload.
        prepareForSend(id, fileOrBlob).then(function(toSend) {
            log("Sending upload request for " + id);
            xhr.send(toSend);
        });
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
        /*jshint -W040 */
        var customParams = paramsStore.getParams(id);
        customParams[filenameParam] = getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.getEndpoint(id),
                params: customParams,
                type: fileState[id].type,
                key: getActualKey(id),
                accessKey: credentialsProvider.get().accessKey,
                sessionToken: credentialsProvider.get().sessionToken,
                acl: acl,
                expectedStatus: expectedStatus,
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                reducedRedundancy: reducedRedundancy,
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


// ************************** Chunked Uploads ******************************


    // If this is a resumable upload, grab the relevant data from storage and items in memory that track this upload
    // so we can pick up from where we left off.
    function maybePrepareForResume(id) {
        var localStorageId, persistedData;

        // Resume is enabled and possible and this is the first time we've tried to upload this file in this session,
        // so prepare for a resume attempt.
        if (resumeEnabled && getActualKey(id) === undefined) {
            localStorageId = getLocalStorageId(id);
            persistedData = localStorage.getItem(localStorageId);

            // If we haven't found this item in local storage, give up
            if (persistedData) {
                log(qq.format("Identified file with ID {} and name of {} as resumable.", id, getName(id)));

                persistedData = JSON.parse(persistedData);

                onUuidChanged(id, persistedData.uuid);
                setKey(id, persistedData.key);
                fileState[id].loaded = persistedData.loaded;
                fileState[id].chunking = persistedData.chunking;
            }
        }
    }

    // Persist any data needed to resume this upload in a new session.
    function maybePersistChunkedState(id) {
        var localStorageId, persistedData;

        // If local storage isn't supported by the browser, or if resume isn't enabled or possible, give up
        if (resumeEnabled) {
            localStorageId = getLocalStorageId(id);

            persistedData = {
                name: getName(id),
                size: getSize(id),
                uuid: getUuid(id),
                key: getActualKey(id),
                loaded: fileState[id].loaded,
                chunking: fileState[id].chunking,
                lastUpdated: Date.now()
            };

            localStorage.setItem(localStorageId, JSON.stringify(persistedData));
        }
    }

    // Removes a chunked upload record from local storage, if possible.
    // Returns true if the item was removed, false otherwise.
    function maybeDeletePersistedChunkData(id) {
        var localStorageId;

        if (resumeEnabled) {
            localStorageId = getLocalStorageId(id);

            if (localStorageId && localStorage.getItem(localStorageId)) {
                localStorage.removeItem(localStorageId);
                return true;
            }
        }

        return false;
    }

    // Iterates through all S3 XHR handler-created resume records (in local storage),
    // invoking the passed callback and passing in the key and value of each local storage record.
    function iterateResumeRecords(callback) {
        if (resumeEnabled) {
            qq.each(localStorage, function(key, item) {
                if (key.indexOf("qqs3resume-") === 0) {
                    var uploadData = JSON.parse(item);
                    callback(key, uploadData);
                }
            });
        }
    }

    /**
     * @returns {Array} Array of objects containing properties useful to integrators
     * when it is important to determine which files are potentially resumable.
     */
    function getResumableFilesData() {
        var resumableFilesData = [];

        iterateResumeRecords(function(key, uploadData) {
            resumableFilesData.push({
                name: uploadData.name,
                size: uploadData.size,
                uuid: uploadData.uuid,
                partIdx: uploadData.chunking.lastSent + 1,
                key: uploadData.key
            });
        });

        return resumableFilesData;
    }

    // Deletes any local storage records that are "expired".
    function removeExpiredChunkingRecords() {
        var expirationDays = spec.resume.recordsExpireIn;

        iterateResumeRecords(function(key, uploadData) {
            var expirationDate = new Date(uploadData.lastUpdated);

            // transform updated date into expiration date
            expirationDate.setDate(expirationDate.getDate() + expirationDays);

            if (expirationDate.getTime() <= Date.now()) {
                log("Removing expired resume record with key " + key);
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * @param id File ID
     * @returns {string} Identifier for this item that may appear in the browser's local storage
     */
    function getLocalStorageId(id) {
        var name = getName(id),
            size = getSize(id),
            chunkSize = spec.chunking.partSize,
            endpoint = spec.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint);

        return qq.format("qqs3resume-{}-{}-{}-{}", name, size, chunkSize, bucket);
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
            totalChunks = internalApi.getTotalChunks(id);
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

    /**
     * Retrieves the 0-based index of the next chunk to send.  Note that AWS uses 1-based indexing.
     *
     * @param id File ID
     * @returns {number} The 0-based index of the next file chunk to be sent to S3
     */
    function getNextPartIdxToSend(id) {
        return fileState[id].chunking.lastSent >= 0 ? fileState[id].chunking.lastSent + 1 : 0;
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
            name = getName(id),
            xhr = fileState[id].xhr,
            totalFileSize = getSize(id),
            chunkData = internalApi.getChunkData(id, idx),
            domain = spec.endpointStore.getEndpoint(id);

        // Add appropriate headers to the multipart upload request.
        // Once these have been determined (asynchronously) attach the headers and send the chunk.
        addChunkedHeaders(id).then(function(headers, endOfUrl) {
            var url = domain + "/" + endOfUrl;

            spec.onUploadChunk(id, name, internalApi.getChunkDataForCallback(chunkData));

            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    var totalLoaded = e.loaded + fileState[id].loaded;

                    spec.onProgress(id, name, totalLoaded, totalFileSize);
                }
            };

            xhr.onreadystatechange = getReadyStateChangeHandler(id);

            xhr.open("PUT", url, true);

            qq.each(headers, function(name, val) {
                xhr.setRequestHeader(name, val);
            });

            log(qq.format("Sending part {} of {} for file ID {} - {} ({} bytes)", chunkData.part+1, chunkData.count, id, name, chunkData.size));
            xhr.send(chunkData.blob);
        }, function() {
            uploadCompleted(id, {error: "Problem signing the chunk!"}, xhr);
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
            endpoint = spec.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            key = getUrlSafeKey(id),
            promise = new qq.Promise(),
            signatureConstructor = restSignatureRequester.constructStringToSign
                (restSignatureRequester.REQUEST_TYPE.MULTIPART_UPLOAD, bucket, key)
                .withPartNum(getNextPartIdxToSend(id) + 1)
                .withUploadId(fileState[id].chunking.uploadId);

        // Ask the local server to sign the request.  Use this signature to form the Authorization header.
        restSignatureRequester.getSignature(id, {signatureConstructor: signatureConstructor}).then(function(response) {
            headers = signatureConstructor.getHeaders();
            headers.Authorization = "AWS " + credentialsProvider.get().accessKey + ":" + response.signature;
            promise.success(headers, signatureConstructor.getEndOfUrl());
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
            return initiateMultipartRequester.send(id).then(
                function(uploadId) {
                    fileState[id].chunking.uploadId = uploadId;
                }
            );
        }
        else {
            return new qq.Promise().success(fileState[id].chunking.uploadId);
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
            chunkData = internalApi.getChunkData(id, idxSent),
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

            maybePersistChunkedState(id);

            spec.onUploadChunkSuccess(id, internalApi.getChunkDataForCallback(chunkData), response, xhr);

            // We might not be done with this file...
            maybeUploadNextChunk(id);
        }
        else {
            if (response.error) {
                log(response.error, "error");
            }

            uploadCompleted(id);
        }
    }


    qq.extend(this, new qq.UploadHandlerXhrApi(
        internalApi,
        {fileState: fileState, chunking: chunkingPossible ? spec.chunking : null},
        {onUpload: handleStartUploadSignal, onCancel: spec.onCancel, onUuidChanged: onUuidChanged, getName: getName,
            getSize: getSize, getUuid: getUuid, log: log}
    ));


    removeExpiredChunkingRecords();


    // Base XHR API overrides
    qq.override(this, function(super_) {
        return {
            add: function(id, fileOrBlobData) {
                super_.add.apply(this, arguments);

                if (resumeEnabled) {
                    maybePrepareForResume(id);
                }
            },

            getResumableFilesData: function() {
                return getResumableFilesData();
            },

            expunge: function(id) {
                var uploadId = fileState[id].chunking && fileState[id].chunking.uploadId,
                    existedInLocalStorage = maybeDeletePersistedChunkData(id);

                if (uploadId !== undefined && existedInLocalStorage) {
                    abortMultipartRequester.send(id, uploadId);
                }

                super_.expunge(id);
            },

            getThirdPartyFileId: function(id) {
                return getActualKey(id);
            }
        };
    });
};
