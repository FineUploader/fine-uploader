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
        getSignatureAjaxRequester = new qq.s3.PolicySignatureAjaxRequestor({
            endpoint: options.signatureEndpoint,
            cors: options.cors,
            log: log
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

        prepareForSend(id, fileOrBlob).then(function(toSend) {
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

    function generateAwsParams(id) {
        var customParams = options.paramsStore.getParams(id);
        customParams[options.filenameParam] = api.getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: options.endpointStore.getEndpoint(id),
                params: customParams,
                type: fileState[id].type,
                key: fileState[id].key,
                accessKey: options.accessKey,
                acl: options.acl,
                expectedStatus: expectedStatus,
                log: log
            },
            qq.bind(getSignatureAjaxRequester.getSignature, this, id));
    }

    function prepareForSend(id, fileOrBlob) {
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
                    options.getKeyName(id, name).then(function(key) {
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
