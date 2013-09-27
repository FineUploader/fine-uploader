/*globals qq*/
qq.UploadHandlerForm = function(options, uploadCompleteCallback, onUuidChanged, logCallback) {
    "use strict";

    var fileState = [],
        uploadComplete = uploadCompleteCallback,
        log = logCallback,
        internalApi = {},
        publicApi;


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

            response = internalApi.parseJsonResponse(id, innerHtml);
        }
        catch(error) {
            log('Error when attempting to parse form upload response (' + error.message + ")", 'error');
            response = {success: false};
        }

        return response;
    }

    /**
     * Creates form, that will be submitted to iframe
     */
    function createForm(id, iframe){
        var params = options.paramsStore.getParams(id),
            method = options.demoMode ? "GET" : "POST",
            endpoint = options.endpointStore.getEndpoint(id),
            newName = fileState[id].newName;

        params[options.uuidParam] = fileState[id].uuid;

        if (newName) {
            params[options.filenameParam] = newName;
        }

        return internalApi.initFormForUpload({
            method: method,
            endpoint: endpoint,
            params: params,
            paramsInBody: options.paramsInBody,
            targetName: iframe.name
        });
    }

    publicApi = new qq.UploadHandlerFormApi(internalApi, fileState, options.cors.expected, options.inputName, options.onCancel, onUuidChanged, log);

    return qq.extend(publicApi, {
        upload: function(id) {
            var input = fileState[id].input,
                fileName = publicApi.getName(id),
                iframe = internalApi.createIframe(id),
                form;

            if (!input){
                throw new Error('file with passed id was not added, or already uploaded or cancelled');
            }

            options.onUpload(id, publicApi.getName(id));

            form = createForm(id, iframe);
            form.appendChild(input);

            internalApi.attachLoadEvent(iframe, function(responseFromMessage){
                log('iframe loaded');

                var response = responseFromMessage ? responseFromMessage : getIframeContentJson(id, iframe);

                internalApi.detachLoadEvent(id);

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
    });
};
