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

        chunked = {
            // Sends a "Complete Multipart Upload" request and then signals completion of the upload
            // when the response to this request has been parsed.
            combine: function(id) {
                var uploadId = handler._getPersistableData(id).uploadId,
                    etagMap = handler._getPersistableData(id).etags,
                    result = new qq.Promise();

                requesters.completeMultipart.send(id, uploadId, etagMap).then(
                    result.success,

                    function failure(reason, xhr) {
                        result.failure(upload.done(id, xhr).response, xhr);
                    }
                );

                return result;
            },

            // The last step in handling a chunked upload.  This is called after each chunk has been sent.
            // The request may be successful, or not.  If it was successful, we must extract the "ETag" element
            // in the XML response and store that along with the associated part number.
            // We need these items to "Complete" the multipart upload after all chunks have been successfully sent.
            done: function(id, xhr, chunkIdx) {
                var response = upload.response.parse(id, xhr),
                    etag;

                if (response.success) {
                    etag = xhr.getResponseHeader("ETag");

                    if (!handler._getPersistableData(id).etags) {
                        handler._getPersistableData(id).etags = [];
                    }
                    handler._getPersistableData(id).etags.push({part: chunkIdx+1, etag: etag});
                }
            },

            /**
             * Determines headers that must be attached to the chunked (Multipart Upload) request.  One of these headers is an
             * Authorization value, which must be determined by asking the local server to sign the request first.  So, this
             * function returns a promise.  Once all headers are determined, the `success` method of the promise is called with
             * the headers object.  If there was some problem determining the headers, we delegate to the caller's `failure`
             * callback.
             *
             * @param id File ID
             * @param chunkIdx Index of the chunk to PUT
             * @returns {qq.Promise}
             */
            initHeaders: function(id, chunkIdx) {
                var headers = {},
                    endpoint = spec.endpointStore.get(id),
                    bucket = qq.s3.util.getBucket(endpoint),
                    key = upload.key.urlSafe(id),
                    promise = new qq.Promise(),
                    signatureConstructor = requesters.restSignature.constructStringToSign
                        (requesters.restSignature.REQUEST_TYPE.MULTIPART_UPLOAD, bucket, key)
                        .withPartNum(chunkIdx + 1)
                        .withUploadId(handler._getPersistableData(id).uploadId);

                // Ask the local server to sign the request.  Use this signature to form the Authorization header.
                requesters.restSignature.getSignature(id + "." + chunkIdx, {signatureConstructor: signatureConstructor}).then(function(response) {
                    headers = signatureConstructor.getHeaders();
                    headers.Authorization = "AWS " + credentialsProvider.get().accessKey + ":" + response.signature;
                    promise.success(headers, signatureConstructor.getEndOfUrl());
                }, promise.failure);

                return promise;
            },

            put: function(id, chunkIdx) {
                var xhr = handler._createXhr(id, chunkIdx),
                    chunkData = handler._getChunkData(id, chunkIdx),
                    domain = spec.endpointStore.get(id),
                    promise = new qq.Promise();

                // Add appropriate headers to the multipart upload request.
                // Once these have been determined (asynchronously) attach the headers and send the chunk.
                chunked.initHeaders(id, chunkIdx).then(function(headers, endOfUrl) {
                    var url = domain + "/" + endOfUrl;
                    handler._registerProgressHandler(id, chunkIdx, chunkData.size);
                    upload.track(id, xhr, chunkIdx).then(promise.success, promise.failure);
                    xhr.open("PUT", url, true);

                    qq.each(headers, function(name, val) {
                        xhr.setRequestHeader(name, val);
                    });

                    xhr.send(chunkData.blob);
                }, function() {
                    promise.failure({error: "Problem signing the chunk!"}, xhr);
                });

                return promise;
            },

            send: function(id, chunkIdx) {
                var promise = new qq.Promise();

                chunked.setup(id).then(
                    // The "Initiate" request succeeded.  We are ready to send the first chunk.
                    function() {
                        chunked.put(id, chunkIdx).then(promise.success, promise.failure);
                    },

                    // We were unable to initiate the chunked upload process.
                    function(errorMessage, xhr) {
                        promise.failure({error: errorMessage}, xhr);
                    }
                );

                return promise;
            },

            /**
             * Sends an "Initiate Multipart Upload" request to S3 via the REST API, but only if the MPU has not already been
             * initiated.
             *
             * @param id Associated file ID
             * @returns {qq.Promise} A promise that is fulfilled when the initiate request has been sent and the response has been parsed.
             */
            setup: function(id) {
                var promise = new qq.Promise(),
                    uploadId = handler._getPersistableData(id).uploadId,
                    uploadIdPromise = new qq.Promise();

                if (!uploadId) {
                    handler._getPersistableData(id).uploadId = uploadIdPromise;
                    requesters.initiateMultipart.send(id).then(
                        function(uploadId) {
                            handler._getPersistableData(id).uploadId = uploadId;
                            uploadIdPromise.success(uploadId);
                            promise.success(uploadId);
                        },
                        function(errorMsg) {
                            handler._getPersistableData(id).uploadId = null;
                            promise.failure(errorMsg);
                            uploadIdPromise.failure(errorMsg);
                        }
                    );
                }
                else if (uploadId instanceof qq.Promise) {
                    uploadId.then(function(uploadId) {
                        promise.success(uploadId);
                    });
                }
                else {
                    promise.success(uploadId);
                }

                return promise;
            }
        },

        requesters = {
            abortMultipart: new qq.s3.AbortMultipartAjaxRequester({
                endpointStore: endpointStore,
                signatureSpec: signature,
                cors: spec.cors,
                log: log,
                getKey: function(id) {
                    return upload.key.urlSafe(id);
                }
            }),

            completeMultipart: new qq.s3.CompleteMultipartAjaxRequester({
                endpointStore: endpointStore,
                signatureSpec: signature,
                cors: spec.cors,
                log: log,
                getKey: function(id) {
                    return upload.key.urlSafe(id);
                }
            }),

            initiateMultipart: new qq.s3.InitiateMultipartAjaxRequester({
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
                    return upload.key.urlSafe(id);
                },
                getName: function(id) {
                    return getName(id);
                }
            }),

            policySignature: new qq.s3.RequestSigner({
                expectingPolicy: true,
                signatureSpec: signature,
                cors: spec.cors,
                log: log
            }),

            restSignature: new qq.s3.RequestSigner({
                signatureSpec: signature,
                cors: spec.cors,
                log: log
            })
        },

        simple = {
            /**
             * Used for simple (non-chunked) uploads to determine the parameters to send along with the request.  Part of this
             * process involves asking the local server to sign the request, so this function returns a promise.  The promise
             * is fulfilled when all parameters are determined, or when we determine that all parameters cannnot be calculated
             * due to some error.
             *
             * @param id File ID
             * @returns {qq.Promise}
             */
            initParams: function(id) {
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
                    qq.bind(requesters.policySignature.getSignature, this, id));
            },

            send: function(id) {
                var promise = new qq.Promise(),
                    xhr = handler._createXhr(id),
                    fileOrBlob = handler.getFile(id);

                handler._registerProgressHandler(id);
                upload.track(id, xhr).then(promise.success, promise.failure);

                // Delegate to a function the sets up the XHR request and notifies us when it is ready to be sent, along w/ the payload.
                simple.setup(id, xhr, fileOrBlob).then(function(toSend) {
                    log("Sending upload request for " + id);
                    xhr.send(toSend);
                }, promise.failure);

                return promise;
            },

            /**
             * Starts the upload process by delegating to an async function that determine parameters to be attached to the
             * request.  If all params can be determined, we are called back with the params and the caller of this function is
             * informed by invoking the `success` method on the promise returned by this function, passing the payload of the
             * request.  If some error occurs here, we delegate to a function that signals a failure for this upload attempt.
             *
             * Note that this is only used by the simple (non-chunked) upload process.
             *
             * @param id File ID
             * @param xhr XMLHttpRequest to use for the upload
             * @param fileOrBlob `File` or `Blob` to send
             * @returns {qq.Promise}
             */
            setup: function(id, xhr, fileOrBlob) {
                var formData = new FormData(),
                    endpoint = endpointStore.get(id),
                    url = endpoint,
                    promise = new qq.Promise();

                simple.initParams(id).then(
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
        },

        upload = {
            /**
             * Note that this is called when an upload has reached a termination point,
             * regardless of success/failure.  For example, it is called when we have
             * encountered an error during the upload or when the file may have uploaded successfully.
             *
             * @param id file ID
             */
            done: function(id, xhr) {
                var response = upload.response.parse(id, xhr),
                    isError = response.success !== true;

                if (isError && upload.response.shouldReset(response.code)) {
                    log("This is an unrecoverable error, we must restart the upload entirely on the next retry attempt.", "error");
                    response.reset = true;
                }

                return {
                    success: !isError,
                    response: response
                };
            },

            key: {
                promise: function(id) {
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
                    else if (qq.isGenericPromise(key)) {
                        promise.then(key.success, key.failure);
                    }
                    else {
                        promise.success(key);
                    }

                    return promise;
                },

                urlSafe: function(id) {
                    return encodeURIComponent(handler.getThirdPartyFileId(id));
                }
            },

            response: {
                parse: function(id, xhr) {
                    var response = {},
                        parsedErrorProps;

                    try {
                        log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));

                        if (xhr.status === expectedStatus) {
                            response.success = true;
                        }
                        else {
                            parsedErrorProps = upload.response.parseError(xhr.responseText);

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
                },

                /**
                 * This parses an XML response by extracting the "Message" and "Code" elements that accompany AWS error responses.
                 *
                 * @param awsResponseXml XML response from AWS
                 * @returns {object} Object w/ `code` and `message` properties, or undefined if we couldn't find error info in the XML document.
                 */
                parseError: function(awsResponseXml) {
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
                },

                // Determine if the upload should be restarted on the next retry attempt
                // based on the error code returned in the response from AWS.
                shouldReset: function(errorCode) {
                    /*jshint -W014 */
                    return errorCode === "EntityTooSmall"
                        || errorCode === "InvalidPart"
                        || errorCode === "InvalidPartOrder"
                        || errorCode === "NoSuchUpload";
                }
            },

            start: function(id, opt_chunkIdx) {
                var promise = new qq.Promise();

                upload.key.promise(id).then(function() {
                    /* jshint eqnull:true */
                    if (opt_chunkIdx == null) {
                        simple.send(id).then(promise.success, promise.failure);
                    }
                    else {
                        chunked.send(id, opt_chunkIdx).then(promise.success, promise.failure);
                    }
                },
                function(errorReason) {
                    promise.failure({error: errorReason});
                });

                return promise;
            },

            track: function(id, xhr, opt_chunkIdx) {
                var promise = new qq.Promise();

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        var result;

                        /* jshint eqnull:true */
                        if (opt_chunkIdx == null) {
                            result = upload.done(id, xhr);
                            promise[result.success ? "success" : "failure"](result.response, xhr);
                        }
                        else {
                            chunked.done(id, xhr, opt_chunkIdx);
                            result = upload.done(id, xhr);
                            promise[result.success ? "success" : "failure"](result.response, xhr);
                        }
                    }
                };

                return promise;
            }
        };


    qq.extend(this, {
        uploadChunk: upload.start,
        uploadFile: upload.start
    });

    qq.extend(this, new qq.XhrUploadHandler({
            options: qq.extend({namespace: "s3"}, spec),
            proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
        }
    ));

    qq.override(this, function(super_) {
        return {
            expunge: function(id) {
                var uploadId = handler._getPersistableData(id) && handler._getPersistableData(id).uploadId,
                    existedInLocalStorage = handler._maybeDeletePersistedChunkData(id);

                if (uploadId !== undefined && existedInLocalStorage) {
                    requesters.abortMultipart.send(id, uploadId);
                }

                super_.expunge(id);
            },

            finalizeChunks: function(id) {
                return chunked.combine(id);
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
