/*globals qq */
/**
 * Upload handler used by the upload to Azure module that depends on File API support, and, therefore, makes use of
 * `XMLHttpRequest` level 2 to upload `File`s and `Blob`s directly to Azure Blob Storage containers via the
 * associated Azure API.
 *
 * @param spec Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
qq.azure.UploadHandlerXhr = function(spec, proxy) {
    "use strict";

    var publicApi = this,
        internalApi = {},
        fileState = [],
        log = proxy.log,
        cors = spec.cors,
        endpointStore = spec.endpointStore,
        paramsStore = spec.paramsStore,
        signature = spec.signature,
        onGetBlobName = spec.onGetBlobName,
        onProgress = spec.onProgress,
        onComplete = spec.onComplete,
        onUpload = spec.onUpload,
        onUuidChanged = proxy.onUuidChanged,
        onUploadComplete = function(id, xhr, errorMsg) {
            var azureError;

            if (errorMsg) {
                azureError = qq.azure.util.parseAzureError(xhr.responseText, log);
                if (!spec.onAutoRetry(id, getName(id), {error: errorMsg, azureError: azureError && azureError.message}, xhr)) {
                    onComplete(id, getName(id), {success: false, error: errorMsg, azureError: azureError && azureError.message}, xhr);
                }
            }
            else {
                onComplete(id, getName(id), {success: true}, xhr);
            }
        },
        getName = proxy.getName,
        getUuid = proxy.getUuid,
        getSize = proxy.getSize,
        progressHandler = function(id, loaded, total) {
            fileState[id].loaded = loaded;
            onProgress(id, getName(id), loaded, total);
        },
        putBlob = new qq.azure.PutBlob({
            onProgress: progressHandler,
            onUpload: function(id) {
                onUpload(id, getName(id));
            },
            onComplete: function(id, xhr, isError) {
                if (isError) {
                    log("Put Blob call failed for " + id, "error");
                }
                else {
                    log("Put Blob call succeeded for " + id);
                }

                onUploadComplete.call(this, id, xhr, isError ? "Problem sending file to Azure" : null);
            },
            log: log
        }),
        getSasForPutBlob = new qq.azure.GetSas({
            cors: cors,
            endpointStore: {
                get: function() {
                    return signature.endpoint;
                }
            },
            customHeaders: signature.customHeaders,
            restRequestVerb: putBlob.method,
            log: log
        });

    function determineBlobUrl(id) {
        var containerUrl = endpointStore.get(id),
            promise = new qq.Promise(),
            getBlobNameSuccess = function(blobName) {
                fileState[id].blobName = blobName;
                promise.success(containerUrl + "/" + blobName);
            },
            getBlobNameFailure = function(reason) {
                promise.failure(reason);
            };

        onGetBlobName(id).then(getBlobNameSuccess, getBlobNameFailure);

        return promise;
    }

    function handleStartUploadSignal(id) {
        var fileOrBlob = publicApi.getFile(id),
            params = paramsStore.get(id),
            getSasSuccess = function(sasUri) {
                log("GET SAS request succeeded.");
                xhr = putBlob.upload(id, sasUri, qq.azure.util.getParamsAsHeaders(params), fileOrBlob);
                internalApi.registerXhr(id, xhr);
            },
            getSasFailure = function(reason, getSasXhr) {
                log("GET SAS request failed: " + reason, "error");
                onUploadComplete(id, getSasXhr, "Problem communicating with local server");
            },
            determineBlobUrlSuccess = function(blobUrl) {
                getSasForPutBlob.request(id, blobUrl).then(
                    getSasSuccess,
                    getSasFailure
                );
            },
            determineBlobUrlFailure = function(reason) {
                log(qq.format("Failed to determine blob name for ID {} - {}", id, reason), "error");
                onUploadComplete(id, null, "Problem determining name of file to upload");
            },
            xhr;

        determineBlobUrl(id).then(determineBlobUrlSuccess, determineBlobUrlFailure);
    }

    qq.extend(this, new qq.UploadHandlerXhrApi(
        internalApi,
        {fileState: fileState, chunking: false},
        {onUpload: handleStartUploadSignal, onCancel: spec.onCancel, onUuidChanged: onUuidChanged, getName: getName,
            getSize: getSize, getUuid: getUuid, log: log}
    ));
};
