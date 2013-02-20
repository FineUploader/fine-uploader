/*globals qq, document, setTimeout*/
/*globals clearTimeout*/
qq.UploadHandlerForm = function(o, uploadCompleteCallback, logCallback) {
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
        api;


    function detachLoadEvent(id) {
        if (detachLoadEvents[id] !== undefined) {
            detachLoadEvents[id]();
            delete detachLoadEvents[id];
        }
    }

    function registerPostMessageCallback(iframe, callback) {
        var id = iframe.id;

        onloadCallbacks[uuids[id]] = callback;

        detachLoadEvents[id] = qq(iframe).attach('load', function() {
            if (inputs[id]) {
                log("Received iframe load event for CORS upload request (file id " + id + ")");

                postMessageCallbackTimers[id] = setTimeout(function() {
                    var errorMessage = "No valid message received from loaded iframe for file id " + id;
                    log(errorMessage, "error");
                    callback({
                        error: errorMessage
                    });
                }, 1000);
            }
        });

        corsMessageReceiver.receiveMessage(id, function(message) {
            log("Received the following window message: '" + message + "'");
            var response = qq.parseJson(message),
                uuid = response.uuid,
                onloadCallback;

            if (uuid && onloadCallbacks[uuid]) {
                clearTimeout(postMessageCallbackTimers[id]);
                delete postMessageCallbackTimers[id];

                detachLoadEvent(id);

                onloadCallback = onloadCallbacks[uuid];

                delete onloadCallbacks[uuid];
                corsMessageReceiver.stopReceivingMessages(id);
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
    function getIframeContentJson(iframe) {
        /*jshint evil: true*/

        var response;

        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                innerHTML = doc.body.innerHTML;

            log("converting iframe's innerHTML to JSON");
            log("innerHTML = " + innerHTML);
            //plain text response may be wrapped in <pre> tag
            if (innerHTML && innerHTML.match(/^<pre/i)) {
                innerHTML = doc.body.firstChild.firstChild.nodeValue;
            }

            response = qq.parseJson(innerHTML);
        } catch(error){
            log('Error when attempting to parse form upload response (' + error + ")", 'error');
            response = {success: false};
        }

        return response;
    }

    /**
     * Creates iframe with unique name
     */
    function createIframe(id){
        // We can't use following code as the name attribute
        // won't be properly registered in IE6, and new window
        // on form submit will open
        // var iframe = document.createElement('iframe');
        // iframe.setAttribute('name', id);

        var iframe = qq.toElement('<iframe src="javascript:false;" name="' + id + '" />');

        iframe.setAttribute('id', id);

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

            // get input value and remove path to normalize
            return inputs[id].value.replace(/.*(\/|\\)/, "");
        },
        isValid: function(id) {
            return inputs[id] !== undefined;
        },
        reset: function() {
            qq.UploadHandler.prototype.reset.apply(this, arguments);
            inputs = [];
            uuids = [];
            detachLoadEvents = {};
        },
        getUuid: function(id) {
            return uuids[id];
        },
        cancel: function(id) {
            options.onCancel(id, this.getName(id));

            delete inputs[id];
            delete uuids[id];
            delete detachLoadEvents[id];

            if (options.cors.expected) {
                clearTimeout(postMessageCallbackTimers[id]);
                delete postMessageCallbackTimers[id];
                corsMessageReceiver.stopReceivingMessages(id);
            }

            var iframe = document.getElementById(id);
            if (iframe) {
                // to cancel request set src to something else
                // we use src="javascript:false;" because it doesn't
                // trigger ie6 prompt on https
                iframe.setAttribute('src', 'java' + String.fromCharCode(115) + 'cript:false;'); //deal with "JSLint: javascript URL" warning, which apparently cannot be turned off

                qq(iframe).remove();
            }
        },
        upload: function(id){
            var input = inputs[id],
                fileName = api.getName(id),
                iframe = createIframe(id),
                form;

            if (!input){
                throw new Error('file with passed id was not added, or already uploaded or cancelled');
            }

            options.onUpload(id, this.getName(id));

            form = createForm(id, iframe);
            form.appendChild(input);

            attachLoadEvent(iframe, function(responseFromMessage){
                log('iframe loaded');

                var response = responseFromMessage ? responseFromMessage : getIframeContentJson(iframe);

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

            return id;
        }
    };

    return api;
};
