/**
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
        uploadCompleteCallback = uploadCompleteCallback,
        log = logCallback,
        onCompleteCallback = options.onComplete,
        onUpload = options.onUpload,
        onGetKeyName = options.getKeyName,
        filenameParam = options.filenameParam,
        paramsStore = options.paramsStore,
        endpointStore = options.endpointStore,
        accessKey = options.accessKey,
        acl = options.objectProperties.acl,
        validation = options.validation,
        signature = options.signature,
        successRedirectUrl = options.iframeSupport.localBlankPagePath,
        getSignatureAjaxRequester = new qq.s3.SignatureAjaxRequestor({
            signatureSpec: signature,
            cors: options.cors,
            log: log
        }),
        internalApi = {},
        publicApi;


    if (successRedirectUrl === undefined) {
        throw new Error("successRedirectEndpoint MUST be defined if you intend to use browsers that do not support the File API!");
    }

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
            bucket = qq.s3.util.getBucket(endpoint);


        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHtml = doc.body.innerHTML;

            var responseData = qq.s3.util.parseIframeResponse(iframe);
            if (responseData.bucket === bucket &&
                responseData.key === qq.s3.util.encodeQueryStringParam(fileState[id].key)) {

                return true;
            }

            log("Response from AWS included an unexpected bucket or key name.", "error");

        }
        catch(error) {
            log('Error when attempting to parse form upload response (' + error.message + ")", 'error');
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
            endpoint = options.endpointStore.getEndpoint(id),
            fileName = publicApi.getName(id);

        generateAwsParams(id).then(function(params) {
            var form = internalApi.initFormForUpload({
                method: method,
                endpoint: endpoint,
                params: params,
                paramsInBody: true,
                targetName: iframe.name
            });

            promise.success(form);
        }, function(errorMessage) {
            promise.failure(errorMessage);
            handleFinishedUpload(id, iframe, fileName, {error: errorMessage});
        });

        return promise;
    }

    function handleUpload(id) {
        var fileName = publicApi.getName(id),
            iframe = internalApi.createIframe(id),
            input = fileState[id].input;

        createForm(id, iframe).then(function(form) {
            onUpload(id, fileName);

            form.appendChild(input);

            // Register a callback when the response comes in from S3
            internalApi.attachLoadEvent(iframe, function(response) {
                log('iframe loaded');

                // If the common response handler has determined success or failure immediately
                if (response) {
                    // If there is something fundamentally wrong with the response (such as iframe content is not accessible)
                    if (response.success === false) {
                        log('Amazon likely rejected the upload request', 'error');
                    }
                }
                // The generic response (iframe onload) handler was not able to make a determination regarding the success of the request
                else {
                    response = {};
                    response.success = isValidResponse(id, iframe);

                    // If the more specific response handle detected a problem with the response from S3
                    if (response.success === false) {
                        log('A success response was received by Amazon, but it was invalid in some way.', 'error');
                    }
                }

                handleFinishedUpload(id, iframe, fileName, response);
            });

            log('Sending upload request for ' + id);
            form.submit();
            qq(form).remove();
        });
    }

    function handleFinishedUpload(id, iframe, fileName, response) {
        internalApi.detachLoadEvent(id);

        qq(iframe).remove();

        if (!response.success) {
            if (options.onAutoRetry(id, fileName, response)) {
                return;
            }
        }
        onCompleteCallback(id, fileName, response);
        uploadCompleteCallback(id);
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
        },

        getThirdPartyFileId: function(id) {
            return fileState[id].key;
        }
    });

    return publicApi;
};
