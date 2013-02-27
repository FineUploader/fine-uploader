/** Generic class for sending non-upload ajax requests and handling the associated responses **/
//TODO Use XDomainRequest if expectCors = true.  Not necessary now since only DELETE requests are sent and XDR doesn't support pre-flighting.
/*globals qq, XMLHttpRequest*/
qq.AjaxRequestor = function(o) {
    "use strict";

    var log, shouldParamsBeInQueryString,
        queue = [],
        requestState = [],
        options = {
            method: 'POST',
            maxConnections: 3,
            customHeaders: {},
            endpointStore: {},
            paramsStore: {},
            successfulResponseCodes: [200],
            demoMode: false,
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {},
            onSend: function(id) {},
            onComplete: function(id, xhr, isError) {},
            onCancel: function(id) {}
        };

    qq.extend(options, o);
    log = options.log;
    shouldParamsBeInQueryString = getMethod() === 'GET' || getMethod() === 'DELETE';


    /**
     * Removes element from queue, sends next request
     */
    function dequeue(id) {
        var i = qq.indexOf(queue, id),
            max = options.maxConnections,
            nextId;

        delete requestState[id];
        queue.splice(i, 1);

        if (queue.length >= max && i < max){
            nextId = queue[max-1];
            sendRequest(nextId);
        }
    }

    function onComplete(id) {
        var xhr = requestState[id].xhr,
            method = getMethod(),
            isError = false;

        dequeue(id);

        if (!isResponseSuccessful(xhr.status)) {
            isError = true;
            log(method + " request for " + id + " has failed - response code " + xhr.status, "error");
        }

        options.onComplete(id, xhr, isError);
    }

    function sendRequest(id) {
        var xhr = new XMLHttpRequest(),
            method = getMethod(),
            params = {},
            url;

        options.onSend(id);

        if (options.paramsStore.getParams) {
            params = options.paramsStore.getParams(id);
        }

        url = createUrl(id, params);

        requestState[id].xhr = xhr;
        xhr.onreadystatechange = getReadyStateChangeHandler(id);
        xhr.open(method, url, true);

        if (options.cors.expected && options.cors.sendCredentials) {
            xhr.withCredentials = true;
        }

        setHeaders(id);

        log('Sending ' + method + " request for " + id);
        if (!shouldParamsBeInQueryString && params) {
            xhr.send(qq.obj2url(params, ""));
        }
        else {
            xhr.send();
        }
    }

    function createUrl(id, params) {
        var endpoint = options.endpointStore.getEndpoint(id),
            addToPath = requestState[id].addToPath;

        if (addToPath !== undefined) {
            endpoint += "/" + addToPath;
        }

        if (shouldParamsBeInQueryString && params) {
            return qq.obj2url(params, endpoint);
        }
        else {
            return endpoint;
        }
    }

    function getReadyStateChangeHandler(id) {
        var xhr = requestState[id].xhr;

        return function() {
            if (xhr.readyState === 4) {
                onComplete(id, xhr);
            }
        };
    }

    function setHeaders(id) {
        var xhr = requestState[id].xhr,
            customHeaders = options.customHeaders;

        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("Cache-Control", "no-cache");

        qq.each(customHeaders, function(name, val) {
            xhr.setRequestHeader(name, val);
        });
    }

    function cancelRequest(id) {
        var xhr = requestState[id].xhr,
            method = getMethod();

        if (xhr) {
            xhr.onreadystatechange = null;
            xhr.abort();
            dequeue(id);

            log('Cancelled ' + method + " for " + id);
            options.onCancel(id);

            return true;
        }

        return false;
    }

    function isResponseSuccessful(responseCode) {
        return qq.indexOf(options.successfulResponseCodes, responseCode) >= 0;
    }

    function getMethod() {
        if (options.demoMode) {
            return "GET";
        }

        return options.method;
    }


    return {
        send: function(id, addToPath) {
            requestState[id] = {
                addToPath: addToPath
            };

            var len = queue.push(id);

            // if too many active connections, wait...
            if (len <= options.maxConnections){
                sendRequest(id);
            }
        },
        cancel: function(id) {
            return cancelRequest(id);
        }
    };
};
