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

    var inputs = [],
        uuids = [],
        newNames = [],
        keys = [],
        detachLoadEvents = {},
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        formHandlerInstanceId = qq.getUniqueId(),
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
        api;


    function detachLoadEvent(id) {
        if (detachLoadEvents[id] !== undefined) {
            detachLoadEvents[id]();
            delete detachLoadEvents[id];
        }
    }

    function attachLoadEvent(iframe, callback) {
        /*jslint eqeq: true*/

        detachLoadEvents[iframe.id] = qq(iframe).attach('load', function(){
            log('Received response for ' + iframe.id);

            // when we remove iframe from dom
            // the request stops, but in IE load
            // event fires
            if (!iframe.parentNode){
                return;
            }

            try {
                // fixing Opera 10.53
                if (iframe.contentDocument &&
                    iframe.contentDocument.body &&
                    iframe.contentDocument.body.innerHTML == "false"){
                    // In Opera event is fired second time
                    // when body.innerHTML changed from false
                    // to server response approx. after 1 sec
                    // when we upload file with iframe
                    return;
                }
            }
            catch (error) {
                //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
                log('Error when attempting to access iframe during handling of upload response (' + error + ")", 'error');
                callback(false);
            }

            callback(isValidResponse(iframe.id, iframe));
        });
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
            bucket = qq.s3.util.getBucket(endpoint),
            iframeName = iframe.id,
            fileId = getFileIdForIframeName(iframeName);


        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHtml = doc.body.innerHTML;

            var responseData = qq.s3.util.parseIframeResponse(iframe);
            if (responseData.bucket === bucket
                && responseData.key === keys[fileId]
                && responseData.etag !== undefined) {

                return true;
            }
        }
        catch(error) {
            log('Error when attempting to parse form upload response (' + error + ")", 'error');
        }

        return false;
    }

    function createIframe(id) {
        var iframeName = getIframeName(id);

        return qq.initIframeForUpload(iframeName);
    }

    function generateAwsParams(id) {
        var customParams = paramsStore.getParams(id);

        customParams[filenameParam] = api.getName(id);

        return qq.s3.util.generateAwsParams({
                endpoint: endpointStore.getEndpoint(id),
                params: customParams,
                key: keys[id],
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
            var form = qq.initFormForUpload({
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

    function expungeFile(id) {
        delete inputs[id];
        delete uuids[id];
        delete detachLoadEvents[id];

        var iframe = document.getElementById(getIframeName(id));
        if (iframe) {
            // to cancel request set src to something else
            // we use src="javascript:false;" because it doesn't
            // trigger ie6 prompt on https
            iframe.setAttribute('src', 'java' + String.fromCharCode(115) + 'cript:false;'); //deal with "JSLint: javascript URL" warning, which apparently cannot be turned off

            qq(iframe).remove();
        }
    }

    function getFileIdForIframeName(iframeName) {
        return iframeName.split("_")[0];
    }

    function getIframeName(fileId) {
        return fileId + "_" + formHandlerInstanceId;
    }

    function handleUpload(id) {
        var fileName = api.getName(id),
            iframe = createIframe(id),
            input = inputs[id];

        // TODO handle failure?
        createForm(id, iframe).then(function(form) {
            onUpload(id, fileName);

            form.appendChild(input);

            attachLoadEvent(iframe, function(wasSuccessful){
                var response = {success: false};

                log('iframe loaded');

                if (wasSuccessful === true || isValidResponse(id, iframe)) {
                    response = {success: true};
                }

                detachLoadEvent(id);

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

    function handleStartUploadSignal(id) {
        var name = api.getName(id);

        if (api.isValid(id)) {
            if (keys[id]) {
                handleUpload(id);
            }
            else {
                // The S3 uploader module will either calculate the key or ask the server for it
                // and will call us back once it is known.
                onGetKeyName(id, name).then(function(key) {
                    keys[id] = key;
                    handleUpload(id);
                });
            }
        }
    }

    api = {
        add: function(fileInput) {
            // AWS requires the file field be named "file".
            fileInput.setAttribute('name', "file");

            var id = inputs.push(fileInput) - 1;
            uuids[id] = qq.getUniqueId();

            // remove file input from DOM
            if (fileInput.parentNode){
                qq(fileInput).remove();
            }

            return id;
        },
        getName: function(id) {
            /*jslint regexp: true*/

            if (newNames[id] !== undefined) {
                return newNames[id];
            }
            else if (api.isValid(id)) {
                // get input value and remove path to normalize
                return inputs[id].value.replace(/.*(\/|\\)/, "");
            }
            else {
                log(id + " is not a valid item ID.", "error");
            }
        },
        setName: function(id, newName) {
            newNames[id] = newName;
        },
        isValid: function(id) {
            return inputs[id] !== undefined;
        },
        reset: function() {
            inputs = [];
            uuids = [];
            newNames = [];
            detachLoadEvents = {};
            formHandlerInstanceId = qq.getUniqueId();
        },
        expunge: function(id) {
            return expungeFile(id);
        },
        getUuid: function(id) {
            return uuids[id];
        },
        cancel: function(id) {
            var onCancelRetVal = options.onCancel(id, api.getName(id));

            if (qq.isPromise(onCancelRetVal)) {
                return onCancelRetVal.then(function() {
                    expungeFile(id);
                });
            }
            else if (onCancelRetVal !== false) {
                expungeFile(id);
                return true;
            }

            return false;
        },

        upload: function(id) {
            var input = inputs[id];

            if (!input){
                throw new Error('file with passed id was not added, or already uploaded or cancelled');
            }

            handleStartUploadSignal(id);
        },

        setUuid: function(id, newUuid) {
            log("Server requested UUID change from '" + uuids[id] + "' to '" + newUuid + "'");
            uuids[id] = newUuid;
            onUuidChanged(id, newUuid);
        }
    };

    return api;
};
