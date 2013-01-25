/** Generic class for sending non-upload ajax requests and handling the associated responses **/
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
            successfulResponseCodes: [200],
            log: function(str, level) {},
            onSend: function(id) {},
            onComplete: function(id, xhr, isError) {},
            onCancel: function(id) {}
        };

    qq.extend(options, o);
    log = options.log;
    shouldParamsBeInQueryString = options.method === 'GET' || options.method === 'DELETE';


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
            method = options.method,
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
            method = options.method,
            params = {},
            url;

        options.onSend(id);

        if (requestState[id].paramsStore.getParams) {
            params = requestState[id].paramsStore.getParams(id);
        }

        url = createUrl(id, params);

        requestState[id].xhr = xhr;
        xhr.onreadystatechange = getReadyStateChangeHandler(id);

        xhr.open(method, url, true);

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
        var method = options.method,
            endpoint = requestState[id].endpoint;

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
            method = options.method;

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


    return {
        send: function(id, endpoint, paramsStore) {
            requestState[id] = {
                paramsStore: paramsStore,
                endpoint: endpoint
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
