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
        onProgress = spec.onProgress,
        onComplete = spec.onComplete,
        onUpload = spec.onUpload,
        onUploadCompleted = function(id, xhr, isError) {
            onComplete(id, getName(id), {success: true}, xhr);
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
            onUpload: onUpload,
            onComplete: onUploadCompleted,
            log: log
        });


    function handleStartUploadSignal(id) {
        var fileOrBlob = publicApi.getFile(id),
            url = "about:blank", //TODO this will contain the SAS URI from the integrator's server,
            xhr;

        xhr = putBlob.upload(id, url, {}, fileOrBlob);
        internalApi.registerXhr(id, xhr);
    }

    qq.extend(this, new qq.UploadHandlerXhrApi(
        internalApi,
        {fileState: fileState, chunking: false},
        {onUpload: handleStartUploadSignal, onCancel: spec.onCancel, /*onUuidChanged: onUuidChanged,*/ getName: getName,
            getSize: getSize, getUuid: getUuid, log: log}
    ));
};
