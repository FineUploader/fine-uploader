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

    var getName = proxy.getName,
        getUuid = proxy.getUuid,
        getSize = proxy.getSize,
        log = proxy.log,
        multipart = spec.forceMultipart || spec.paramsInBody,
        handler = this;


    function addChunkingSpecificParams(id, params, chunkData) {
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
    }

    function addResumeSpecificParams(params) {
        params[spec.resume.paramNames.resuming] = true;
    }

    function setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id) {
        var formData = new FormData(),
            method = spec.demoMode ? "GET" : "POST",
            endpoint = spec.endpointStore.get(id),
            url = endpoint,
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
            url = qq.obj2url(params, endpoint);
        }

        xhr.open(method, url, true);

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
    }

    function setHeaders(id, xhr) {
        var extraHeaders = spec.customHeaders,
            fileOrBlob = handler.getFile(id);

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
    }

    function uploadChunk(id, chunkIdx, resuming) {
        var chunkData = handler._getChunkData(id, chunkIdx),
            xhr = handler._createXhr(id),
            size = getSize(id),
            promise, toSend, params;

        if (handler._getFileState(id).loaded === undefined) {
            handler._getFileState(id).loaded = 0;
        }

        promise = createReadyStateChangeHandler(id, xhr);
        handler._registerProgressHandler(id, chunkData.size);
        params = spec.paramsStore.get(id);
        addChunkingSpecificParams(id, params, chunkData);

        resuming && addResumeSpecificParams(params);

        toSend = setParamsAndGetEntityToSend(params, xhr, chunkData.blob, id);
        setHeaders(id, xhr);

        log("Sending chunked upload request for item " + id + ": bytes " + (chunkData.start+1) + "-" + chunkData.end + " of " + size);
        xhr.send(toSend);

        return promise;
    }

    function isErrorResponse(xhr, response) {
        return xhr.status !== 200 || !response.success || response.reset;
    }

    function parseResponse(id) {
        var xhr = handler._getFileState(id).xhr,
            response;

        try {
            log(qq.format("Received response status {} with body: {}", xhr.status, xhr.responseText));
            response = qq.parseJson(xhr.responseText);
        }
        catch(error) {
            log("Error when attempting to parse xhr response text (" + error.message + ")", "error");
            response = {};
        }

        return response;
    }

    function onComplete(id, xhr) {
        var response;

        log("xhr - server response received for " + id);
        log("responseText = " + xhr.responseText);

        response = parseResponse(id);

        return {
            success: !isErrorResponse(xhr, response),
            response: response
        };
    }

    function createReadyStateChangeHandler(id, xhr) {
        var promise = new qq.Promise();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var result = onComplete(id, xhr);

                if (result.success) {
                    promise.success(result.response, xhr);
                }
                else {
                    promise.failure(result.response, xhr);
                }
            }
        };

        return promise;
    }

    function handleStandardFileUpload(id) {
        var fileOrBlob = handler.getFile(id),
            name = getName(id),
            promise, xhr, params, toSend;

        handler._getFileState(id).loaded = 0;

        xhr = handler._createXhr(id);
        handler._registerProgressHandler(id);
        promise = createReadyStateChangeHandler(id, xhr);
        params = spec.paramsStore.get(id);
        toSend = setParamsAndGetEntityToSend(params, xhr, fileOrBlob, id);
        setHeaders(id, xhr);

        log("Sending upload request for " + id);
        xhr.send(toSend);

        return promise;
    }

    qq.extend(this, {
        uploadFile: handleStandardFileUpload,
        uploadChunk: uploadChunk
    });

    qq.extend(this, new qq.XhrUploadHandler({
            options: qq.extend({namespace: "traditional"}, spec),
            proxy: qq.extend({getEndpoint: spec.endpointStore.get}, proxy)
        }
    ));
};
