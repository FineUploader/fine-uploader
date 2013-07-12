/**
 * Upload handler used by the upload to S3 module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to S3 buckets via the associated AWS API.
 *
 * @param options Options passed from the base handler
 * @param uploadCompleteCallback Callback to invoke when the upload has completed, regardless of success.
 * @param onUuidChanged Callback to invoke when the associated items UUID has changed by order of the server.
 * @param logCallback Used to posting log messages.
 */
qq.UploadHandlerS3Xhr = function(options, uploadCompleteCallback, onUuidChanged, log) {
    "use strict";

    var AWS_PARAM_PREFIX = "x-amz-meta-",
        fileState = [],
        pendingSignatures = [],
        expectedStatus = 200,
        getSignatureAjaxRequester = new qq.S3PolicySignatureAjaxRequestor({
            endpoint: options.s3.getSignatureEndpoint,
            cors: options.cors,
            log: log,
            onSignatureReceived: handleSignatureReceived
        }),
        api;

    //TODO eliminate duplication w/ handler.xhr.js
    function createXhr(id) {
        var xhr = new XMLHttpRequest();

        fileState[id].xhr = xhr;

        return xhr;
    }

    //TODO eliminate duplication w/ handler.xhr.js
    function handleUpload(id) {
        var fileOrBlob = fileState[id].file || fileState[id].blobData.blob,
            name = api.getName(id),
            xhr, params, toSend;

        fileState[id].loaded = 0;
        fileState[id].type = fileOrBlob.type;

        xhr = createXhr(id);

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                fileState[id].loaded = e.loaded;
                options.onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = getReadyStateChangeHandler(id);

        prepareForSend(id, params, fileOrBlob).then(function(toSend) {
            log('Sending upload request for ' + id);
            xhr.send(toSend);
        });
    }

    //TODO eliminate duplication w/ handler.xhr.js
    function getReadyStateChangeHandler(id) {
        var xhr = fileState[id].xhr;

        return function() {
            if (xhr.readyState === 4) {
                uploadCompleted(id);
            }
        };
    }

    function prepareForSend(id, params, fileOrBlob) {
        var formData = new FormData(),
            endpoint = options.endpointStore.getEndpoint(id),
            url = endpoint,
            xhr = fileState[id].xhr,
            promise = new qq.Promise();

        generateAwsParams(id).then(function(awsParams) {
            xhr.open("POST", url, true);

            qq.obj2FormData(awsParams, formData);

            // AWS requires the file field be named "file".
            formData.append("file", fileOrBlob);

            promise.success(formData);
        });

        return promise;
    }

    /**
     * Generates all parameters to be passed along with the request.  This includes asking the server for a
     * policy document signature.
     *
     * @param id file ID
     * @returns {qq.Promise} Promise that will be fulfilled once all parameters have been determined.
     */
    function generateAwsParams(id) {
        var params = {},
            promise = new qq.Promise(),
            policyJson = getPolicy(id),
            type = fileState[id].type;

        params.key = fileState[id].key;
        params.AWSAccessKeyId = options.s3.accessKey;
        params["Content-Type"] = type;
        params.acl = options.s3.acl;
        params.success_action_status = expectedStatus;

        qq.each(options.paramsStore.getParams(id), function(name, val) {
            var awsParamName = AWS_PARAM_PREFIX + name;
            params[awsParamName] = getAwsEncodedStr(val);
        });

        // Ask the server to sign the policy doc, which will happen asynchronously.
        signPolicy(id, policyJson).then(
            function(policyAndSignature) {
                params.policy = policyAndSignature.policy;
                params.signature = policyAndSignature.signature;
                promise.success(params);
            },
            function() {
                options.log("Can't continue further with request to S3 as we did not receive " +
                    "a valid signature and policy from the server.", "error");
            }
        );

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
        }
        catch(error) {
            log('Error when attempting to parse xhr response text (' + error + ')', 'error');
        }

        return response;
    }

    function getPolicy(id) {
        var policy = {},
            conditions = [],
            bucket = getBucket(id),
            key = fileState[id].key,
            type = fileState[id].type,
            expirationDate = new Date();

        // Is this going to be a problem if we encounter this moments before 2 AM just before daylight savings time ends?
        expirationDate.setMinutes(expirationDate.getMinutes() + 5);
        policy.expiration = expirationDate.toISOString();

        conditions.push({acl: options.s3.acl});
        conditions.push({bucket: bucket});
        conditions.push({"Content-Type": type});
        conditions.push({success_action_status: new String(expectedStatus)});
        conditions.push({key: key});

        qq.each(options.paramsStore.getParams(id), function(name, val) {
            var awsParamName = AWS_PARAM_PREFIX + name,
                param = {};

            param[awsParamName] = getAwsEncodedStr(val);
            conditions.push(param);
        });

        policy.conditions = conditions;

        return policy;
    }

    function signPolicy(id, policy) {
        var promise = new qq.Promise();
        pendingSignatures[id] = promise;
        getSignatureAjaxRequester.getSignature(id, policy);
        return promise;
    }

    function handleSignatureReceived(id, policyAndSignature, isError) {
        var promise = pendingSignatures[id];

        delete pendingSignatures[id];

        if (isError) {
            promise.failure()
        }
        else {
            promise.success(policyAndSignature);
        }
    }

    /**
     * Escape characters per [AWS guidelines](http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTForms.html#HTTPPOSTEscaping).
     *
     * @param original Non-escaped string
     * @returns {string} Escaped string
     */
    function getAwsEncodedStr(original) {
        var encoded = "";

        qq.each(original, function(idx, char) {
            var encodedChar = char;

            if (char.charCodeAt(0) > 255) {
                encodedChar = escape(char).replace('%', '\\');
            }
            else if (char === '$') {
                encodedChar = "\\$";
            }
            else if (char === '\\') {
                encodedChar = '\\\\';
            }

            encoded += encodedChar;
        });

        return encoded;
    }

    function getBucket(id) {
        var endpoint = options.endpointStore.getEndpoint(id),
            match = /^https?:\/\/([a-z0-9]+)\./i.exec(endpoint);

        if (match) {
            return match[1];
        }
    }

    function uploadCompleted(id) {
        var xhr = fileState[id].xhr,
            name = api.getName(id),
            size = api.getSize(id),
            response = parseResponse(id);

        //TODO better logging here
        qq.log('COMPLETE!');

        options.onProgress(id, name, size, size);
        options.onComplete(id, name, response, xhr);

        if (fileState[id]) {
            delete fileState[id].xhr;
        }

        uploadCompleteCallback(id);
    }

    // TODO eliminate duplication w/ handler.xhr.js
    function expungeItem(id) {
        var xhr = fileState[id].xhr;

        if (xhr) {
            xhr.onreadystatechange = null;
            xhr.abort();
        }

        delete fileState[id];
    }


    api = {
        /**
         * TODO eliminate duplication w/ handler.xhr.js
         *
         * Adds File or Blob to the queue
         * Returns id to use with upload, cancel
         **/
        add: function(fileOrBlobData){
            var id,
                uuid = qq.getUniqueId();

            if (qq.isFile(fileOrBlobData)) {
                id = fileState.push({file: fileOrBlobData}) - 1;
            }
            else if (qq.isBlob(fileOrBlobData.blob)) {
                id = fileState.push({blobData: fileOrBlobData}) - 1;
            }
            else {
                throw new Error('Passed obj in not a File or BlobData (in qq.UploadHandlerXhr)');
            }

            fileState[id].uuid = uuid;

            return id;
        },

        // TODO eliminate duplication w/ handler.xhr.js
        getName: function(id) {
            if (api.isValid(id)) {
                var file = fileState[id].file,
                    blobData = fileState[id].blobData,
                    newName = fileState[id].newName;

                if (newName !== undefined) {
                    return newName;
                }
                else if (file) {
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

        // TODO eliminate duplication w/ handler.xhr.js
        setName: function(id, newName) {
            fileState[id].newName = newName;
        },

        // TODO eliminate duplication w/ handler.xhr.js
        getSize: function(id) {
            /*jshint eqnull: true*/
            var fileOrBlob = fileState[id].file || fileState[id].blobData.blob;

            if (qq.isFileOrInput(fileOrBlob)) {
                return fileOrBlob.fileSize != null ? fileOrBlob.fileSize : fileOrBlob.size;
            }
            else {
                return fileOrBlob.size;
            }
        },

        // TODO eliminate duplication w/ handler.xhr.js
        getFile: function(id) {
            if (fileState[id]) {
                return fileState[id].file || fileState[id].blobData.blob;
            }
        },

        // TODO eliminate duplication w/ handler.xhr.js
        isValid: function(id) {
            return fileState[id] !== undefined;
        },

        // TODO eliminate duplication w/ handler.xhr.js
        reset: function() {
            fileState = [];
        },

        // TODO eliminate duplication w/ handler.xhr.js
        expunge: function(id) {
            return expungeItem(id);
        },

        // TODO eliminate duplication w/ handler.xhr.js
        getUuid: function(id) {
            return fileState[id].uuid;
        },

        /**
         * Sends the file identified by id to the server
         */
        upload: function(id, retry) {
            var name = this.getName(id);

            if (this.isValid(id)) {
                if (fileState[id].key) {
                    options.onUpload(id, name);
                    handleUpload(id);
                }
                else {
                    // The S3 uploader module will either calculate the key or ask the server for it
                    // and will call us back once it is known.
                    options.s3.onGetKeyName(id, name).then(function(key) {
                        fileState[id].key = key;
                        options.onUpload(id, name);
                        handleUpload(id);
                    });
                }
            }
        },

        // TODO eliminate duplication w/ handler.xhr.js
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
        }
    };

    return api;
};
