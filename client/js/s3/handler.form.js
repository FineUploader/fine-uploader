/*globals qq */
/**
 * Upload handler used by the upload to S3 module that assumes the current user agent does not have any support for the
 * File API, and, therefore, makes use of iframes and forms to submit the files directly to S3 buckets via the associated
 * AWS API.
 *
 * @param options Options passed from the base handler
 * @param proxy Callbacks & methods used to query for or push out data/changes
 */
qq.s3.UploadHandlerForm = function(options, proxy) {
    "use strict";

    var handler = this,
        uploadCompleteCallback = proxy.onUploadComplete,
        onUuidChanged = proxy.onUuidChanged,
        getName = proxy.getName,
        getUuid = proxy.getUuid,
        log = proxy.log,
        onCompleteCallback = options.onComplete,
        onUpload = options.onUpload,
        onGetKeyName = options.getKeyName,
        filenameParam = options.filenameParam,
        paramsStore = options.paramsStore,
        endpointStore = options.endpointStore,
        aclStore = options.aclStore,
        reducedRedundancy = options.objectProperties.reducedRedundancy,
        serverSideEncryption = options.objectProperties.serverSideEncryption,
        validation = options.validation,
        signature = options.signature,
        successRedirectUrl = options.iframeSupport.localBlankPagePath,
        credentialsProvider = options.signature.credentialsProvider,
        getSignatureAjaxRequester = new qq.s3.RequestSigner({
            signatureSpec: signature,
            cors: options.cors,
            log: log
        });


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
            endpoint = options.endpointStore.get(id),
            bucket = qq.s3.util.getBucket(endpoint);


        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHtml = doc.body.innerHTML;

            var responseData = qq.s3.util.parseIframeResponse(iframe);
            if (responseData.bucket === bucket &&
                responseData.key === qq.s3.util.encodeQueryStringParam(handler._getFileState(id).key)) {

                return true;
            }

            log("Response from AWS included an unexpected bucket or key name.", "error");

        }
        catch(error) {
            log("Error when attempting to parse form upload response (" + error.message + ")", "error");
        }

        return false;
    }

    function generateAwsParams(id) {
        /*jshint -W040 */
        var customParams = paramsStore.get(id);

        customParams[filenameParam] = getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.get(id),
                params: customParams,
                key: handler._getFileState(id).key,
                accessKey: credentialsProvider.get().accessKey,
                sessionToken: credentialsProvider.get().sessionToken,
                acl: aclStore.get(id),
                minFileSize: validation.minSizeLimit,
                maxFileSize: validation.maxSizeLimit,
                successRedirectUrl: successRedirectUrl,
                reducedRedundancy: reducedRedundancy,
                serverSideEncryption: serverSideEncryption,
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
            endpoint = options.endpointStore.get(id),
            fileName = getName(id);

        generateAwsParams(id).then(function(params) {
            var form = handler._initFormForUpload({
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
        var fileName = getName(id),
            iframe = handler._createIframe(id),
            input = handler._getFileState(id).input;

        createForm(id, iframe).then(function(form) {
            onUpload(id, fileName);

            form.appendChild(input);

            // Register a callback when the response comes in from S3
            handler._attachLoadEvent(iframe, function(response) {
                log("iframe loaded");

                // If the common response handler has determined success or failure immediately
                if (response) {
                    // If there is something fundamentally wrong with the response (such as iframe content is not accessible)
                    if (response.success === false) {
                        log("Amazon likely rejected the upload request", "error");
                    }
                }
                // The generic response (iframe onload) handler was not able to make a determination regarding the success of the request
                else {
                    response = {};
                    response.success = isValidResponse(id, iframe);

                    // If the more specific response handle detected a problem with the response from S3
                    if (response.success === false) {
                        log("A success response was received by Amazon, but it was invalid in some way.", "error");
                    }
                    else {
                        qq.extend(response, qq.s3.util.parseIframeResponse(iframe));
                    }
                }

                handleFinishedUpload(id, iframe, fileName, response);
            });

            log("Sending upload request for " + id);
            form.submit();
            qq(form).remove();
        });
    }

    function handleFinishedUpload(id, iframe, fileName, response) {
        handler._detachLoadEvent(id);

        iframe && qq(iframe).remove();

        if (!response.success) {
            if (options.onAutoRetry(id, fileName, response)) {
                return;
            }
        }
        onCompleteCallback(id, fileName, response);
        uploadCompleteCallback(id);
    }

    qq.extend(this, new qq.AbstractUploadHandlerForm({
            options: {
                isCors: false,
                inputName: "file"
            },

            proxy: {
                onCancel: options.onCancel,
                onUuidChanged: onUuidChanged,
                getName: getName,
                getUuid: getUuid,
                log: log
            }
        }
    ));

    qq.extend(this, {
        upload: function(id) {
            var input = handler._getFileState(id).input,
                name = getName(id);

            if (!input){
                throw new Error("file with passed id was not added, or already uploaded or canceled");
            }

            if (this.isValid(id)) {
                if (handler._getFileState(id).key) {
                    handleUpload(id);
                }
                else {
                    // The S3 uploader module will either calculate the key or ask the server for it
                    // and will call us back once it is known.
                    onGetKeyName(id, name).then(function(key) {
                        handler._getFileState(id).key = key;
                        handleUpload(id);
                    }, function(errorReason) {
                        handleFinishedUpload(id, null, name, {error: errorReason});
                    });
                }
            }
        },

        getThirdPartyFileId: function(id) {
            return handler._getFileState(id).key;
        }
    });
};
