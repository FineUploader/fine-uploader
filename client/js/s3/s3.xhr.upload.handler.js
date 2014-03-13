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
qq.s3.XhrUploadHandler = function(spec, proxy) {
    "use strict";

    var getName = proxy.getName,
        log = proxy.log,
        expectedStatus = 200,
        onGetKeyName = spec.getKeyName,
        filenameParam = spec.filenameParam,
        paramsStore = spec.paramsStore,
        endpointStore = spec.endpointStore,
        aclStore = spec.aclStore,
        reducedRedundancy = spec.objectProperties.reducedRedundancy,
        serverSideEncryption = spec.objectProperties.serverSideEncryption,
        validation = spec.validation,
        signature = spec.signature,
        handler = this,
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
            aclStore: aclStore,
            reducedRedundancy: reducedRedundancy,
            serverSideEncryption: serverSideEncryption,
            cors: spec.cors,
            log: log,
            getContentType: function(id) {
                return handler._getMimeType(id);
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
        return encodeURIComponent(handler.getThirdPartyFileId(id));
    }

    /**
     * Initiate the upload process and possibly delegate to a more specific handler if chunking is required.
     *
     * @param id Associated file ID
     */
    function handleUpload(id, chunkIdx) {
        handler._createXhr(id);

        /* jshint eqnull:true */
        if (chunkIdx == null) {
            return handleSimpleUpload(id);
        }
        return handleChunkedUpload(id, chunkIdx);
    }


    function createReadyStateChangeHandler(id, xhr, chunkIdx) {
        var promise = new qq.Promise();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var result;

                /* jshint eqnull:true */
                if (chunkIdx == null) {
                    result = uploadCompleted(id);
                    promise[result.success ? "success" : "failure"](result.response, xhr);
                }
                else {
                    uploadChunkCompleted(id, chunkIdx).then(function() {
                        result = uploadCompleted(id);
                        promise[result.success ? "success" : "failure"](result.response, xhr);

                    }, function(errorMsg, xhr) {
                        promise.failure({error: errorMsg}, xhr);
                    });
                }
            }
        };

        return promise;
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
     */
    function uploadCompleted(id) {
        var response = parseResponse(id),
            isError = response.success !== true;

        if (isError && shouldResetOnRetry(response.code)) {
            log("This is an unrecoverable error, we must restart the upload entirely on the next retry attempt.", "error");
            response.reset = true;
        }

        return {
            success: !isError,
            response: response
        };

    }

    /**
     * @param id File ID
     * @returns {object} Object containing the parsed response, or perhaps some error data injected in `error` and `code` properties
     */
    function parseResponse(id) {
        var xhr = handler._getFileState(id).xhr,
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

    function getKeyAsync(id) {
        var promise = new qq.Promise(),
            key = handler.getThirdPartyFileId(id);

        /* jshint eqnull:true */
        if (key == null) {
            key = new qq.Promise();
            handler._setThirdPartyFileId(id, key);
            onGetKeyName(id, getName(id)).then(
                function(key) {
                    handler._setThirdPartyFileId(id, key);
                    promise.success(key);
                },
                function(errorReason) {
                    handler._setThirdPartyFileId(id, null);
                    promise.failure(errorReason);
                }
            );
        }
        else if (key instanceof qq.Promise) {
            promise.then(key.success, key.failure);
        }
        else {
            promise.success(key);
        }

        return promise;
    }

    function handleStartUploadSignal(id, chunkIdx) {
        var promise = new qq.Promise();

        getKeyAsync(id).then(function() {
            handleUpload(id, chunkIdx).then(promise.success, promise.failure);
        },
        function(errorReason) {
            promise.failure({error: errorReason});
        });

        return promise;
    }


// ************************** Simple Uploads ******************************

    // Starting point for incoming requests for simple (non-chunked) uploads.
    function handleSimpleUpload(id) {
        var promise = new qq.Promise(),
            xhr = handler._getFileState(id).xhr,
            fileOrBlob = handler.getFile(id);

        handler._registerProgressHandler(id);
        createReadyStateChangeHandler(id, xhr).then(promise.success, promise.failure);

        // Delegate to a function the sets up the XHR request and notifies us when it is ready to be sent, along w/ the payload.
        prepareForSend(id, fileOrBlob).then(function(toSend) {
            log("Sending upload request for " + id);
            xhr.send(toSend);
        }, promise.failure);

        return promise;
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
        var customParams = paramsStore.get(id);
        customParams[filenameParam] = getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.get(id),
                params: customParams,
                type: handler._getMimeType(id),
                key: handler.getThirdPartyFileId(id),
                accessKey: credentialsProvider.get().accessKey,
                sessionToken: credentialsProvider.get().sessionToken,
                acl: aclStore.get(id),
                expectedStatus: expectedStatus,
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                reducedRedundancy: reducedRedundancy,
                serverSideEncryption: serverSideEncryption,
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
            endpoint = endpointStore.get(id),
            url = endpoint,
            xhr = handler._getFileState(id).xhr,
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
                promise.failure({error: errorMessage});
            }
        );

        return promise;
    }


// ************************** Chunked Uploads ******************************

    // Starting point for incoming requests for chunked uploads.
    function handleChunkedUpload(id, chunkIdx) {
        var promise = new qq.Promise(),
            chunkAlreadyUploaded = handler._getFileState(id).chunking.s3LastPartSuccess === chunkIdx,
            totalParts = handler._getFileState(id).chunking.parts;

        // If we have already succesfully sent this chunk, the complete multipart likely failed,
        // and we should just retry that.
        if (chunkIdx + 1 === totalParts && chunkAlreadyUploaded) {
            completeMultipart(id).then(promise.success, promise.failure);
        }
        else {
            maybeInitiateMultipart(id).then(
                // The "Initiate" request succeeded.  We are ready to send the first chunk.
                function() {
                    uploadChunk(id, chunkIdx).then(promise.success, promise.failure);
                },

                // We were unable to initiate the chunked upload process.
                function(errorMessage, xhr) {
                    promise.failure({error: errorMessage}, xhr);
                }
            );
        }

        return promise;
    }

    /**
     * Retrieves the 0-based index of the next chunk to send.  Note that AWS uses 1-based indexing.
     *
     * @param id File ID
     * @returns {number} The 0-based index of the next file chunk to be sent to S3
     */
    function getNextPartIdxToSend(id) {
        return handler._getFileState(id).chunking.lastSent >= 0 ? handler._getFileState(id).chunking.lastSent + 1 : 0;
    }

    // Sends a "Complete Multipart Upload" request and then signals completion of the upload
    // when the response to this request has been parsed.
    function completeMultipart(id) {
        var uploadId = handler._getFileState(id).chunking.uploadId,
            etagMap = handler._getFileState(id).chunking.etags;

        return completeMultipartRequester.send(id, uploadId, etagMap);
    }

    // Initiate the process to send the next chunk for a file.  This assumes there IS a "next" chunk.
    function uploadChunk(id, chunkIdx) {
        var xhr = handler._getFileState(id).xhr,
            chunkData = handler._getChunkData(id, chunkIdx),
            domain = spec.endpointStore.get(id),
            promise = new qq.Promise();

        // Add appropriate headers to the multipart upload request.
        // Once these have been determined (asynchronously) attach the headers and send the chunk.
        addChunkedHeaders(id).then(function(headers, endOfUrl) {
            var url = domain + "/" + endOfUrl;

            handler._registerProgressHandler(id, chunkData.size);
            createReadyStateChangeHandler(id, xhr, chunkData.part).then(promise.success, promise.failure);
            xhr.open("PUT", url, true);

            qq.each(headers, function(name, val) {
                xhr.setRequestHeader(name, val);
            });

            xhr.send(chunkData.blob);
        }, function() {
            promise.failure({error: "Problem signing the chunk!"}, xhr);
        });

        return promise;
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
            endpoint = spec.endpointStore.get(id),
            bucket = qq.s3.util.getBucket(endpoint),
            key = getUrlSafeKey(id),
            promise = new qq.Promise(),
            signatureConstructor = restSignatureRequester.constructStringToSign
                (restSignatureRequester.REQUEST_TYPE.MULTIPART_UPLOAD, bucket, key)
                .withPartNum(getNextPartIdxToSend(id) + 1)
                .withUploadId(handler._getFileState(id).chunking.uploadId);

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
        if (!handler._getFileState(id).chunking.uploadId) {
            return initiateMultipartRequester.send(id).then(
                function(uploadId) {
                    handler._getFileState(id).chunking.uploadId = uploadId;
                }
            );
        }
        else {
            return new qq.Promise().success(handler._getFileState(id).chunking.uploadId);
        }
    }

    // The (usually) last step in handling a chunked upload.  This is called after each chunk has been sent.
    // The request may be successful, or not.  If it was successful, we must extract the "ETag" element
    // in the XML response and store that along with the associated part number.
    // We need these items to "Complete" the multipart upload after all chunks have been successfully sent.
    function uploadChunkCompleted(id, chunkIdx) {
        var xhr = handler._getFileState(id).xhr,
            response = parseResponse(id),
            totalParts = handler._getFileState(id).chunking.parts,
            promise = new qq.Promise(),
            etag;

        if (response.success) {
            etag = xhr.getResponseHeader("ETag");

            if (!handler._getFileState(id).chunking.etags) {
                handler._getFileState(id).chunking.etags = [];
            }
            handler._getFileState(id).chunking.etags.push({part: chunkIdx+1, etag: etag});

            handler._getFileState(id).chunking.s3LastPartSuccess = chunkIdx;

            if (chunkIdx + 1 === totalParts) {
                completeMultipart(id).then(promise.success, promise.failure);
            }
            else {
                promise.success();
            }
        }
        else {
            promise.success();
        }

        return promise;
    }

    qq.extend(this, {
        uploadFile: handleStartUploadSignal,
        uploadChunk: handleStartUploadSignal
    });

    qq.extend(this, new qq.XhrUploadHandler({
            options: qq.extend({namespace: "s3"}, spec),
            proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
        }
    ));

    qq.override(this, function(super_) {
        return {
            expunge: function(id) {
                var uploadId = handler._getFileState(id).chunking && handler._getFileState(id).chunking.uploadId,
                    existedInLocalStorage = handler._maybeDeletePersistedChunkData(id);

                if (uploadId !== undefined && existedInLocalStorage) {
                    abortMultipartRequester.send(id, uploadId);
                }

                super_.expunge(id);
            },

            _getLocalStorageId: function(id) {
                var baseStorageId = super_._getLocalStorageId(id),
                    endpoint = endpointStore.get(id),
                    bucketName = qq.s3.util.getBucket(endpoint);

                return baseStorageId + "-" + bucketName;
            }
        };
    });
};
