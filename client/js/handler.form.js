/*globals qq, document, setTimeout*/
/*globals clearTimeout*/
qq.UploadHandlerForm = function(o, uploadCompleteCallback, onUuidChange, logCallback) {
    "use strict";

    var options = o,
        inputs = [],
        uuids = [],
        detachLoadEvents = {},
        postMessageCallbackTimers = {},
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        corsMessageReceiver = new qq.WindowReceiveMessage({log: log}),
        onloadCallbacks = {},
        formHandlerInstanceId = qq.getUniqueId(),
        api;


    function detachLoadEvent(id) {
        if (detachLoadEvents[id] !== undefined) {
            detachLoadEvents[id]();
            delete detachLoadEvents[id];
        }
    }

    function registerPostMessageCallback(iframe, callback) {
        var iframeName = iframe.id,
            fileId = getFileIdForIframeName(iframeName);

        onloadCallbacks[uuids[fileId]] = callback;

        detachLoadEvents[fileId] = qq(iframe).attach('load', function() {
            if (inputs[fileId]) {
                log("Received iframe load event for CORS upload request (iframe name " + iframeName + ")");

                postMessageCallbackTimers[iframeName] = setTimeout(function() {
                    var errorMessage = "No valid message received from loaded iframe for iframe name " + iframeName;
                    log(errorMessage, "error");
                    callback({
                        error: errorMessage
                    });
                }, 1000);
            }
        });

        corsMessageReceiver.receiveMessage(iframeName, function(message) {
            log("Received the following window message: '" + message + "'");
            var response = parseResponse(getFileIdForIframeName(iframeName), message),
                uuid = response.uuid,
                onloadCallback;

            if (uuid && onloadCallbacks[uuid]) {
                log("Handling response for iframe name " + iframeName);
                clearTimeout(postMessageCallbackTimers[iframeName]);
                delete postMessageCallbackTimers[iframeName];

                detachLoadEvent(iframeName);

                onloadCallback = onloadCallbacks[uuid];

                delete onloadCallbacks[uuid];
                corsMessageReceiver.stopReceivingMessages(iframeName);
                onloadCallback(response);
            }
            else if (!uuid) {
                log("'" + message + "' does not contain a UUID - ignoring.");
            }
        });
    }

    function attachLoadEvent(iframe, callback) {
        /*jslint eqeq: true*/

        if (options.cors.expected) {
            registerPostMessageCallback(iframe, callback);
        }
        else {
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
                }

                callback();
            });
        }
    }

    /**
     * Returns json object received by iframe from server.
     */
    function getIframeContentJson(id, iframe) {
        /*jshint evil: true*/

        var response;

        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHtml = doc.body.innerHTML;

            log("converting iframe's innerHTML to JSON");
            log("innerHTML = " + innerHtml);
            //plain text response may be wrapped in <pre> tag
            if (innerHtml && innerHtml.match(/^<pre/i)) {
                innerHtml = doc.body.firstChild.firstChild.nodeValue;
            }

            response = parseResponse(id, innerHtml);
        }
        catch(error) {
            log('Error when attempting to parse form upload response (' + error + ")", 'error');
            response = {success: false};
        }

        return response;
    }

    function parseResponse(id, innerHtmlOrMessage) {
        var response;

        try {
            response = qq.parseJson(innerHtmlOrMessage);

            if (response.newUuid !== undefined) {
                log("Server requested UUID change from '" + uuids[id] + "' to '" + response.newUuid + "'");
                uuids[id] = response.newUuid;
                onUuidChanged(id, response.newUuid);
            }
        }
        catch(error) {
            log('Error when attempting to parse iframe upload response (' + error + ')', 'error');
            response = {};
        }

        return response;
    }

    /**
     * Creates iframe with unique name
     */
    function createIframe(id) {
        // We can't use following code as the name attribute
        // won't be properly registered in IE6, and new window
        // on form submit will open
        // var iframe = document.createElement('iframe');
        // iframe.setAttribute('name', id);

        var iframeName = getIframeName(id),
            iframe = qq.toElement('<iframe src="javascript:false;" name="' + iframeName + '" />');

        iframe.setAttribute('id', iframeName);

        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        return iframe;
    }

    /**
     * Creates form, that will be submitted to iframe
     */
    function createForm(id, iframe){
        var params = options.paramsStore.getParams(id),
            protocol = options.demoMode ? "GET" : "POST",
            form = qq.toElement('<form method="' + protocol + '" enctype="multipart/form-data"></form>'),
            endpoint = options.endpointStore.getEndpoint(id),
            url = endpoint;

        params[options.uuidParamName] = uuids[id];

        if (!options.paramsInBody) {
            url = qq.obj2url(params, endpoint);
        }
        else {
            qq.obj2Inputs(params, form);
        }

        form.setAttribute('action', url);
        form.setAttribute('target', iframe.name);
        form.style.display = 'none';
        document.body.appendChild(form);

        return form;
    }

    function expungeFile(id) {
        delete inputs[id];
        delete uuids[id];
        delete detachLoadEvents[id];

        if (options.cors.expected) {
            clearTimeout(postMessageCallbackTimers[id]);
            delete postMessageCallbackTimers[id];
            corsMessageReceiver.stopReceivingMessages(id);
        }

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


    api = {
        add: function(fileInput) {
            fileInput.setAttribute('name', options.inputName);

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

            if (api.isValid(id)) {
                // get input value and remove path to normalize
                return inputs[id].value.replace(/.*(\/|\\)/, "");
            }
            else {
                log(id + " is not a valid item ID.", "error");
            }
        },
        isValid: function(id) {
            return inputs[id] !== undefined;
        },
        reset: function() {
            inputs = [];
            uuids = [];
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
            var input = inputs[id],
                fileName = api.getName(id),
                iframe = createIframe(id),
                form;

            if (!input){
                throw new Error('file with passed id was not added, or already uploaded or cancelled');
            }

            options.onUpload(id, api.getName(id));

            form = createForm(id, iframe);
            form.appendChild(input);

            attachLoadEvent(iframe, function(responseFromMessage){
                log('iframe loaded');

                var response = responseFromMessage ? responseFromMessage : getIframeContentJson(id, iframe);

                detachLoadEvent(id);

                //we can't remove an iframe if the iframe doesn't belong to the same domain
                if (!options.cors.expected) {
                    qq(iframe).remove();
                }

                if (!response.success) {
                    if (options.onAutoRetry(id, fileName, response)) {
                        return;
                    }
                }
                options.onComplete(id, fileName, response);
                uploadComplete(id);
            });

            log('Sending upload request for ' + id);
            form.submit();
            qq(form).remove();
        }
    };

    return api;
};
