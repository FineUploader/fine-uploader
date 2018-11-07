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
        clockDrift = spec.clockDrift,
        expectedStatus = 200,
        onGetBucket = spec.getBucket,
        onGetHost = spec.getHost,
        onGetKeyName = spec.getKeyName,
        filenameParam = spec.filenameParam,
        paramsStore = spec.paramsStore,
        endpointStore = spec.endpointStore,
        aclStore = spec.aclStore,
        reducedRedundancy = spec.objectProperties.reducedRedundancy,
        region = spec.objectProperties.region,
        serverSideEncryption = spec.objectProperties.serverSideEncryption,
        validation = spec.validation,
        signature = qq.extend({region: region, drift: clockDrift}, spec.signature),
        handler = this,
        credentialsProvider = spec.signature.credentialsProvider,

        chunked = {
            // Sends a "Complete Multipart Upload" request and then signals completion of the upload
            // when the response to this request has been parsed.
            combine: function(id) {
                var uploadId = handler._getPersistableData(id).uploadId,
                    etagMap = handler._getPersistableData(id).etags;

                return new Promise(function(resolve, reject) {
                    requesters.completeMultipart.send(id, uploadId, etagMap).then(
                        resolve,

                        function failure(err) {
                            var error = new Error(err.message);
                            error.xhr = err.xhr;
                            error.response = upload.done(id, err.xhr).response;
                            reject(error);
                        }
                    );
                });
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
                    handler._getPersistableData(id).etags.push({part: chunkIdx + 1, etag: etag});
                }
            },

            /**
             * Determines headers that must be attached to the chunked (Multipart Upload) request.  One of these headers is an
             * Authorization value, which must be determined by asking the local server to sign the request first.  So, this
             * function returns a promise.  Once all headers are determined, the promise is resolved with
             * the headers object.  If there was some problem determining the headers, we reject the promise.
             *
             * @param id File ID
             * @param chunkIdx Index of the chunk to PUT
             * @returns {Promise}
             */
            initHeaders: function(id, chunkIdx, blob) {
                return upload.key.urlSafe(id).then(function(key) {
                    var headers = {},
                        bucket = upload.bucket.getName(id),
                        host = upload.host.getName(id),
                        signatureConstructor = requesters.restSignature.constructStringToSign
                            (requesters.restSignature.REQUEST_TYPE.MULTIPART_UPLOAD, bucket, host, key)
                            .withPartNum(chunkIdx + 1)
                            .withContent(blob)
                            .withUploadId(handler._getPersistableData(id).uploadId);

                    // Ask the local server to sign the request.  Use this signature to form the Authorization header.
                    return requesters.restSignature.getSignature(id + "." + chunkIdx, {signatureConstructor: signatureConstructor});
                });
            },

            put: function(id, chunkIdx) {
                var xhr = handler._createXhr(id, chunkIdx),
                    chunkData = handler._getChunkData(id, chunkIdx),
                    domain = spec.endpointStore.get(id);

                return new Promise(function(resolve, reject) {
                    // Add appropriate headers to the multipart upload request.
                    // Once these have been determined (asynchronously) attach the headers and send the chunk.
                    chunked.initHeaders(id, chunkIdx, chunkData.blob).then(function(info) {
                        var headers = info.headers,
                            endOfUrl = info.endOfUrl,
                            error;
                        if (xhr._cancelled) {
                            error = new Error(qq.format("Upload of item {}.{} cancelled. Upload will not start after successful signature request.", id, chunkIdx));
                            log(error.message);
                            reject(error);
                        }
                        else {
                            var url = domain + "/" + endOfUrl;
                            handler._registerProgressHandler(id, chunkIdx, chunkData.size);
                            upload.track(id, xhr, chunkIdx).then(resolve, reject);
                            xhr.open("PUT", url, true);

                            var hasContentType = false;
                            qq.each(headers, function(name, val) {
                                if (name === "Content-Type") {
                                    hasContentType = true;
                                }

                                xhr.setRequestHeader(name, val);
                            });

                            // Workaround for IE Edge
                            if (!hasContentType) {
                                xhr.setRequestHeader("Content-Type", "");
                            }

                            xhr.send(chunkData.blob);
                        }
                    }, function() {
                        var error = new Error("Problem signing the chunk!");
                        error.xhr = xhr;
                        reject(xhr);
                    });
                });
            },

            send: function(id, chunkIdx) {
                return new Promise(function(resolve, reject) {
                    chunked.setup(id).then(
                        // The "Initiate" request succeeded.  We are ready to send the first chunk.
                        function() {
                            chunked.put(id, chunkIdx).then(resolve, reject);
                        },
                        reject
                    );
                });
            },

            /**
             * Sends an "Initiate Multipart Upload" request to S3 via the REST API, but only if the MPU has not already been
             * initiated.
             *
             * @param id Associated file ID
             * @returns {Promise} A promise that is resolved when the initiate request has been sent and the response has been parsed.
             */
            setup: function(id) {
                return new Promise(function(setupResolve, setupReject) {
                    var uploadId = handler._getPersistableData(id).uploadId;

                    if (!uploadId) {
                        handler._getPersistableData(id).uploadId = new Promise(function(resolve, reject) {
                            requesters.initiateMultipart.send(id).then(
                                function(info) {
                                    handler._getPersistableData(id).uploadId = info.uploadId;
                                    resolve(info.uploadId);
                                    setupResolve(info.uploadId);
                                },
                                function(error) {
                                    handler._getPersistableData(id).uploadId = null;
                                    setupReject(error);
                                    reject(error);
                                }
                            );
                        });
                    }
                    else if (uploadId instanceof Promise) {
                        uploadId.then(function(info) {
                            setupResolve(info.uploadId);
                        });
                    }
                    else {
                        setupResolve(uploadId);
                    }
                });
            }
        },

        requesters = {
            abortMultipart: new qq.s3.AbortMultipartAjaxRequester({
                endpointStore: endpointStore,
                signatureSpec: signature,
                cors: spec.cors,
                log: log,
                getBucket: function(id) {
                    return upload.bucket.getName(id);
                },
                getHost: function(id) {
                    return upload.host.getName(id);
                },
                getKey: function(id) {
                    return upload.key.urlSafe(id);
                }
            }),

            completeMultipart: new qq.s3.CompleteMultipartAjaxRequester({
                endpointStore: endpointStore,
                signatureSpec: signature,
                cors: spec.cors,
                log: log,
                getBucket: function(id) {
                    return upload.bucket.getName(id);
                },
                getHost: function(id) {
                    return upload.host.getName(id);
                },
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
                getBucket: function(id) {
                    return upload.bucket.getName(id);
                },
                getHost: function(id) {
                    return upload.host.getName(id);
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
                endpointStore: endpointStore,
                signatureSpec: signature,
                cors: spec.cors,
                log: log
            })
        },

        simple = {
            /**
             * Used for simple (non-chunked) uploads to determine the parameters to send along with the request.  Part of this
             * process involves asking the local server to sign the request, so this function returns a promise.  The promise
             * is fulfilled when all parameters are determined, or when we determine that all parameters cannot be calculated
             * due to some error.
             *
             * @param id File ID
             * @returns {Promise}
             */
            initParams: function(id) {
                /*jshint -W040 */
                var customParams = paramsStore.get(id);
                customParams[filenameParam] = getName(id);

                return (handler.getThirdPartyFileId(id) || Promise.resolve(undefined)).then(function(thirdPartyFileId) {
                    return qq.s3.util.generateAwsParams({
                        endpoint: endpointStore.get(id),
                        clockDrift: clockDrift,
                        params: customParams,
                        type: handler._getMimeType(id),
                        bucket: upload.bucket.getName(id),
                        key: thirdPartyFileId,
                        accessKey: credentialsProvider.get().accessKey,
                        sessionToken: credentialsProvider.get().sessionToken,
                        acl: aclStore.get(id),
                        expectedStatus: expectedStatus,
                        minFileSize: validation.minSizeLimit,
                        maxFileSize: validation.maxSizeLimit,
                        reducedRedundancy: reducedRedundancy,
                        region: region,
                        serverSideEncryption: serverSideEncryption,
                        signatureVersion: signature.version,
                        log: log
                    },
                    qq.bind(requesters.policySignature.getSignature, this, id));
                });
            },

            send: function(id) {
                var xhr = handler._createXhr(id),
                    fileOrBlob = handler.getFile(id);

                handler._registerProgressHandler(id);

                return new Promise(function(resolve, reject) {
                    upload.track(id, xhr).then(resolve, reject);

                    // Delegate to a function the sets up the XHR request and notifies us when it is ready to be sent, along w/ the payload.
                    simple.setup(id, xhr, fileOrBlob).then(function(toSend) {
                        log("Sending upload request for " + id);
                        xhr.send(toSend);
                    }, reject);
                });
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
             * @returns {Promise}
             */
            setup: function(id, xhr, fileOrBlob) {
                var formData = new FormData(),
                    endpoint = endpointStore.get(id),
                    url = endpoint;

                return simple.initParams(id).then(
                    // Success - all params determined
                    function(awsParams) {
                        xhr.open("POST", url, true);

                        qq.obj2FormData(awsParams, formData);

                        // AWS requires the file field be named "file".
                        formData.append("file", fileOrBlob);

                        return formData;
                    });
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
            bucket: {
                promise: function(id) {
                    var cachedBucket = handler._getFileState(id).bucket;

                    return new Promise(function(resolve, reject) {
                        if (cachedBucket) {
                            resolve(cachedBucket);
                        }
                        else {
                            onGetBucket(id).then(function(bucket) {
                                handler._getFileState(id).bucket = bucket;
                                resolve(bucket);
                            }, function(errorReason) {
                                var error = new Error("Failed to get bucket");
                                error.error = errorReason;
                                reject(error);
                            });
                        }
                    });
                },

                getName: function(id) {
                    return handler._getFileState(id).bucket;
                }
            },

            host: {
                promise: function(id) {
                    var cachedHost = handler._getFileState(id).host;

                    return new Promise(function(resolve, reject) {
                        if (cachedHost) {
                            resolve(cachedHost);
                        }
                        else {
                            onGetHost(id).then(function(host) {
                                handler._getFileState(id).host = host;
                                resolve(host);
                            }, function(errorReason) {
                                var error = new Error("Failed to get host");
                                error.error = errorReason;
                                reject(error);
                            });
                        }
                    });
                },

                getName: function(id) {
                    return handler._getFileState(id).host;
                }
            },

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
                    var key = handler.getThirdPartyFileId(id);

                    /* jshint eqnull:true */
                    if (key == null) {
                        key = new Promise(function(resolve, reject) {
                            onGetKeyName(id, getName(id)).then(
                                resolve,
                                function(err) {
                                    handler._setThirdPartyFileId(id, null);
                                    var error = new Error(err.message);
                                    error.error = err.message;
                                    reject(error);
                                }
                            );
                        });
                        handler._setThirdPartyFileId(id, key);
                    }

                    return key;
                },

                urlSafe: function(id) {
                    return handler.getThirdPartyFileId(id).then(function(encodedKey) {
                        return qq.s3.util.uriEscapePath(encodedKey);
                    });
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
                    catch (error) {
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

            start: function(params) {
                var id = params.id;
                var optChunkIdx = params.chunkIdx;

                return new Promise(function(resolve, reject) {
                    upload.key.promise(id).then(function() {
                        upload.bucket.promise(id).then(function() {
                            upload.host.promise(id).then(function() {
                                /* jshint eqnull:true */
                                if (optChunkIdx == null) {
                                    simple.send(id).then(resolve, reject);
                                }
                                else {
                                    chunked.send(id, optChunkIdx).then(resolve, reject);
                                }
                            });
                        }, reject);
                    }, reject);
                });
            },

            track: function(id, xhr, optChunkIdx) {
                return new Promise(function(resolve, reject) {
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            var result,
                                error;

                            /* jshint eqnull:true */
                            if (optChunkIdx == null) {
                                result = upload.done(id, xhr);
                                if (result.success) {
                                    resolve({response: result.response, xhr: xhr});
                                } else {
                                    error = new Error();
                                    error.response = result.response;
                                    error.xhr = xhr;
                                    reject(error);
                                }
                            }
                            else {
                                chunked.done(id, xhr, optChunkIdx);
                                result = upload.done(id, xhr);
                                if (result.success) {
                                    resolve({response: result.response, xhr: xhr});
                                } else {
                                    error = new Error();
                                    error.response = result.response;
                                    error.xhr = xhr;
                                    reject(error);
                                }
                            }
                        }
                    };
                });
            }
        };

    qq.extend(this, {
        uploadChunk: upload.start,
        uploadFile: function(id) {
            return upload.start({ id: id });
        }
    });

    qq.extend(this, new qq.XhrUploadHandler({
        options: qq.extend({namespace: "s3"}, spec),
        proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
    }));

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
                    bucketName = upload.bucket.getName(id);

                return baseStorageId + "-" + bucketName;
            }
        };
    });
};
