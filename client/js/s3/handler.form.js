/**
 * TODO eliminate duplication between this and traditional form upload handler.
 *
 * Upload handler used by the upload to S3 module that assumes the current user agent does not have any support for the
 * File API, and, therefore, makes use of iframes and forms to submit the files directly to S3 buckets via the associated
 * AWS API.
 *
 * @param options Options passed from the base handler
 * @param uploadCompleteCallback Callback to invoke when the upload has completed, regardless of success.
 * @param onUuidChanged Callback to invoke when the associated items UUID has changed by order of the server.
 * @param logCallback Used to posting log messages.
 */
qq.s3.UploadHandlerForm = function(options, uploadCompleteCallback, onUuidChanged, logCallback) {
    "use strict";

    var fileState = [],
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        onComplete = options.onComplete,
        onUpload = options.onUpload,
        onGetKeyName = options.getKeyName,
        filenameParam = options.filenameParam,
        paramsStore = options.paramsStore,
        endpointStore = options.endpointStore,
        accessKey = options.accessKey,
        acl = options.acl,
        validation = options.validation,
        successRedirectUrl = options.successRedirectEndpoint,
        getSignatureAjaxRequester = new qq.s3.PolicySignatureAjaxRequestor({
            endpoint: options.signatureEndpoint,
            cors: options.cors,
            log: log
        }),
        internalApi = {},
        publicApi;


    /**
     * Attempt to parse the contents of an iframe after receiving a response from the server.  If the contents cannot be
     * read (perhaps due to a security error) it is safe to assume that the upload was not successful since Amazon should
     * have redirected to a known endpoint that should provide a parseable response.
     *
     * @param id ID of the associated file
     * @param iframe target of the form submit
     * @returns {boolean} true if the contents can be read, false otherwise
     */
    function isValidResponse(id, iframe) {
        var response,
            endpoint = options.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            iframeName = iframe.id;


        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHtml = doc.body.innerHTML;

            var responseData = qq.s3.util.parseIframeResponse(iframe);
            if (responseData.bucket === bucket && responseData.key === fileState[id].key) {

                return true;
            }
        }
        catch(error) {
            log('Error when attempting to parse form upload response (' + error + ")", 'error');
        }

        return false;
    }

    function generateAwsParams(id) {
        var customParams = paramsStore.getParams(id);

        customParams[filenameParam] = publicApi.getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.getEndpoint(id),
                params: customParams,
                key: fileState[id].key,
                accessKey: accessKey,
                acl: acl,
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                successRedirectUrl: successRedirectUrl,
                log: log
            },
            qq.bind(getSignatureAjaxRequester.getSignature, this, id));
    }

    /**
     * Creates form, that will be submitted to iframe
     */
    function createForm(id, iframe) {
        var promise = new qq.Promise(),
            method = options.demoMode ? "GET" : "POST",
            endpoint = options.endpointStore.getEndpoint(id);

        // TODO handle failure?
        generateAwsParams(id).then(function(params) {
            var form = internalApi.initFormForUpload({
                method: method,
                endpoint: endpoint,
                params: params,
                paramsInBody: true,
                targetName: iframe.name
            });

            promise.success(form);
        });

        return promise;
    }

    function handleUpload(id) {
        var fileName = publicApi.getName(id),
            iframe = internalApi.createIframe(id),
            input = fileState[id].input;

        // TODO handle failure?
        createForm(id, iframe).then(function(form) {
            onUpload(id, fileName);

            form.appendChild(input);

            internalApi.attachLoadEvent(iframe, function(response) {
                log('iframe loaded');
                var wasSuccessful = response ? response.success : isValidResponse(id, iframe);

                if (wasSuccessful === true) {
                    response = {success: true};
                }

                internalApi.detachLoadEvent(id);

                qq(iframe).remove();

                if (!response.success) {
                    if (options.onAutoRetry(id, fileName, response)) {
                        return;
                    }
                }
                onComplete(id, fileName, response);
                uploadComplete(id);
            });

            log('Sending upload request for ' + id);
            form.submit();
            qq(form).remove();
        });
    }

    publicApi = new qq.UploadHandlerFormApi(internalApi, fileState, false, "file", options.onCancel, onUuidChanged, log);

    qq.extend(publicApi, {
        upload: function(id) {
            var input = fileState[id].input,
                name = publicApi.getName(id);

            if (!input){
                throw new Error('file with passed id was not added, or already uploaded or cancelled');
            }

            if (publicApi.isValid(id)) {
                if (fileState[id].key) {
                    handleUpload(id);
                }
                else {
                    // The S3 uploader module will either calculate the key or ask the server for it
                    // and will call us back once it is known.
                    onGetKeyName(id, name).then(function(key) {
                        fileState[id].key = key;
                        handleUpload(id);
                    });
                }
            }
        }
    });

    return publicApi;
};
