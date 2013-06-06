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
            endpointStore: {},
            paramsStore: {},
            mandatedParams: {},
            successfulResponseCodes:  {
                "DELETE": [200, 202, 204],
                "POST": [200, 204]
            },
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

    function getParams(id) {
        var params = {},
            additionalParams = requestState[id].additionalParams,
            mandatedParams = options.mandatedParams;

        if (options.paramsStore.getParams) {
            params = options.paramsStore.getParams(id);
        }

        if (additionalParams) {
            qq.each(additionalParams, function(name, val) {
                params[name] = val;
            });
        }

        if (mandatedParams) {
            qq.each(mandatedParams, function(name, val) {
                params[name] = val;
            });
        }

        return params;
    }

    function sendRequest(id) {
        var xhr = new XMLHttpRequest(),
            method = options.method,
            params = getParams(id),
            url;

        options.onSend(id);

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

        if (addToPath != undefined) {
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

        if (options.method === "POST" || options.method === "PUT") {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

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
        return qq.indexOf(options.successfulResponseCodes[options.method], responseCode) >= 0;
    }

    return {
        send: function(id, addToPath, additionalParams) {
            requestState[id] = {
                addToPath: addToPath,
                additionalParams: additionalParams
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
