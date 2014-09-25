/*globals qq*/
/**
 * Upload handler used to upload to traditional endpoints.  It depends on File API support, and, therefore,
 * makes use of `XMLHttpRequest` level 2 to upload `File`s and `Blob`s to a generic server.
 *
 * @param spec Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
qq.traditional = qq.traditional || {};
qq.traditional.XhrUploadHandler = function(spec, proxy) {
    "use strict";

    var handler = this,
        getName = proxy.getName,
        getSize = proxy.getSize,
        getUuid = proxy.getUuid,
        log = proxy.log,
        multipart = spec.forceMultipart || spec.paramsInBody,

        addChunkingSpecificParams = function(id, params, chunkData) {
            var size = getSize(id),
                name = getName(id);

            params[spec.chunking.paramNames.partIndex] = chunkData.part;
            params[spec.chunking.paramNames.partByteOffset] = chunkData.start;
            params[spec.chunking.paramNames.chunkSize] = chunkData.size;
            params[spec.chunking.paramNames.totalParts] = chunkData.count;
            params[spec.totalFileSizeName] = size;

            /**
             * When a Blob is sent in a multipart request, the filename value in the content-disposition header is either "blob"
             * or an empty string.  So, we will need to include the actual file name as a param in this case.
             */
            if (multipart) {
                params[spec.filenameParam] = name;
            }
        },

        allChunksDoneRequester = new qq.traditional.AllChunksDoneAjaxRequester({
            cors: spec.cors,
            endpoint: spec.chunking.success.endpoint,
            log: log
        }),

        createReadyStateChangedHandler = function(id, xhr) {
            var promise = new qq.Promise();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    var result = onUploadOrChunkComplete(id, xhr);

                    if (result.success) {
                        promise.success(result.response, xhr);
                    }
                    else {
                        promise.failure(result.response, xhr);
                    }
                }
            };

            return promise;
        },

        getChunksCompleteParams = function(id) {
            var params = spec.paramsStore.get(id),
                name = getName(id),
                size = getSize(id);

            params[spec.uuidName] = getUuid(id);
            params[spec.filenameParam] = name;
            params[spec.totalFileSizeName] = size;
            params[spec.chunking.paramNames.totalParts] = handler._getTotalChunks(id);

            return params;
        },

        isErrorUploadResponse = function(xhr, response) {
            return xhr.status !== 200 || !response.success || response.reset;
        },

        onUploadOrChunkComplete = function(id, xhr) {
            var response;

            log("xhr - server response received for " + id);
            log("responseText = " + xhr.responseText);

            response = parseResponse(true, xhr);

            return {
                success: !isErrorUploadResponse(xhr, response),
                response: response
            };
        },

        // If this is an upload response, we require a JSON payload, otherwise, it is optional.
        parseResponse = function(upload, xhr) {
            var response = {};

            try {
                log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));
                response = qq.parseJson(xhr.responseText);
            }
            catch (error) {
                upload && log("Error when attempting to parse xhr response text (" + error.message + ")", "error");
            }

            return response;
        },

        sendChunksCompleteRequest = function(id) {
            var promise = new qq.Promise();

            allChunksDoneRequester.complete(
                    id,
                    handler._createXhr(id),
                    getChunksCompleteParams(id),
                    spec.customHeaders.get(id)
                )
                .then(function(xhr) {
                    promise.success(parseResponse(false, xhr), xhr);
                }, function(xhr) {
                    promise.failure(parseResponse(false, xhr), xhr);
                });

            return promise;
        },

        setParamsAndGetEntityToSend = function(params, xhr, fileOrBlob, id) {
            var formData = new FormData(),
                method = spec.demoMode ? "GET" : "POST",
                endpoint = spec.endpointStore.get(id),
                name = getName(id),
                size = getSize(id);

            params[spec.uuidName] = getUuid(id);
            params[spec.filenameParam] = name;

            if (multipart) {
                params[spec.totalFileSizeName] = size;
            }

            //build query string
            if (!spec.paramsInBody) {
                if (!multipart) {
                    params[spec.inputName] = name;
                }
                endpoint = qq.obj2url(params, endpoint);
            }

            xhr.open(method, endpoint, true);

            if (spec.cors.expected && spec.cors.sendCredentials) {
                xhr.withCredentials = true;
            }

            if (multipart) {
                if (spec.paramsInBody) {
                    qq.obj2FormData(params, formData);
                }

                formData.append(spec.inputName, fileOrBlob);
                return formData;
            }

            return fileOrBlob;
        },

        setUploadHeaders = function(id, xhr) {
            var extraHeaders = spec.customHeaders.get(id),
                fileOrBlob = handler.getFile(id);

            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("Cache-Control", "no-cache");

            if (!multipart) {
                xhr.setRequestHeader("Content-Type", "application/octet-stream");
                //NOTE: return mime type in xhr works on chrome 16.0.9 firefox 11.0a2
                xhr.setRequestHeader("X-Mime-Type", fileOrBlob.type);
            }

            qq.each(extraHeaders, function(name, val) {
                xhr.setRequestHeader(name, val);
            });
        };

    qq.extend(this, {
        uploadChunk: function(id, chunkIdx, resuming) {
            var chunkData = handler._getChunkData(id, chunkIdx),
                xhr = handler._createXhr(id, chunkIdx),
                size = getSize(id),
                promise, toSend, params;

            promise = createReadyStateChangedHandler(id, xhr);
            handler._registerProgressHandler(id, chunkIdx, chunkData.size);
            params = spec.paramsStore.get(id);
            addChunkingSpecificParams(id, params, chunkData);

            if (resuming) {
                params[spec.resume.paramNames.resuming] = true;
            }

            toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
            setUploadHeaders(id, xhr);
            xhr.send(toSend);

            return promise;
        },

        uploadFile: function(id) {
            var fileOrBlob = handler.getFile(id),
                promise, xhr, params, toSend;

            xhr = handler._createXhr(id);
            handler._registerProgressHandler(id);
            promise = createReadyStateChangedHandler(id, xhr);
            params = spec.paramsStore.get(id);
            toSend = setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id);
            setUploadHeaders(id, xhr);
            xhr.send(toSend);

            return promise;
        }
    });

    qq.extend(this, new qq.XhrUploadHandler({
        options: qq.extend({namespace: "traditional"}, spec),
        proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
    }));

    qq.override(this, function(super_) {
        return {
            finalizeChunks: function(id) {
                if (spec.chunking.success.endpoint) {
                    return sendChunksCompleteRequest(id);
                }
                else {
                    return super_.finalizeChunks(id, qq.bind(parseResponse, this, true));
                }
            }
        };
    });
};
