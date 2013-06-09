/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.AjaxRequestor = function (o) {
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
            successfulResponseCodes: {
                "DELETE": [200, 202, 204],
                "POST": [200, 204]
            },
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function (str, level) {},
            onSend: function (id) {},
            onComplete: function (id, xhrOrXdr, isError) {},
            onCancel: function (id) {}
        };

    qq.extend(options, o);
    log = options.log;
    shouldParamsBeInQueryString = options.method === 'GET' || options.method === 'DELETE';


    // [Simple methods](http://www.w3.org/TR/cors/#simple-method)
    // are defined by the W3C in the CORS spec as a list of methods that, in part,
    // make a CORS request eligible to be exempt from preflighting.
    function isSimpleMethod() {
        return qq.indexOf(["GET", "POST", "HEAD"], options.method) >= 0;
    }

    // [Simple headers](http://www.w3.org/TR/cors/#simple-header)
    // are defined by the W3C in the CORS spec as a list of headers that, in part,
    // make a CORS request eligible to be exempt from preflighting.
    function containsNonSimpleHeaders(headers) {
        var containsNonSimple = false;

        qq.each(containsNonSimple, function(idx, header) {
            if (qq.indexOf(["Accept", "Accept-Language", "Content-Language", "Content-Type"], header) < 0) {
                containsNonSimple = true;
                return false;
            }
        });

        return containsNonSimple;
    }

    function isXdr(xhr) {
        //The `withCredentials` test is a commonly accepted way to determine if XHR supports CORS.
        return options.cors.expected && xhr.withCredentials === undefined;
    }

    // Returns either a new `XMLHttpRequest` or `XDomainRequest` instance.
    function getCorsAjaxTransport() {
        var xhrOrXdr;

        if (window.XMLHttpRequest) {
            xhrOrXdr = new XMLHttpRequest();

            if (xhrOrXdr.withCredentials === undefined) {
                xhrOrXdr = new XDomainRequest();
            }
        }

        return xhrOrXdr;
    }

    // Returns either a new XHR/XDR instance, or an existing one for the associated `File` or `Blob`.
    function getXhrOrXdr(id, dontCreateIfNotExist) {
        var xhrOrXdr = requestState[id].xhr;

        if (!xhrOrXdr && !dontCreateIfNotExist) {
            if (options.cors.expected) {
                xhrOrXdr = getCorsAjaxTransport();
            }
            else {
                xhrOrXdr = new XMLHttpRequest();
            }

            requestState[id].xhr = xhrOrXdr;
        }

        return xhrOrXdr;
    }

    // Removes element from queue, sends next request
    function dequeue(id) {
        var i = qq.indexOf(queue, id),
            max = options.maxConnections,
            nextId;

        delete requestState[id];
        queue.splice(i, 1);

        if (queue.length >= max && i < max) {
            nextId = queue[max - 1];
            sendRequest(nextId);
        }
    }

    function onComplete(id, xdrError) {
        var xhr = getXhrOrXdr(id),
            method = options.method,
            isError = xdrError === false;

        dequeue(id);

        if (isError) {
            log(method + " request for " + id + " has failed", "error");
        }
        else if (!isXdr(xhr) && !isResponseSuccessful(xhr.status)) {
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
            qq.each(additionalParams, function (name, val) {
                params[name] = val;
            });
        }

        if (mandatedParams) {
            qq.each(mandatedParams, function (name, val) {
                params[name] = val;
            });
        }

        return params;
    }

    function sendRequest(id) {
        var xhr = getXhrOrXdr(id),
            method = options.method,
            params = getParams(id),
            url;

        options.onSend(id);

        url = createUrl(id, params);

        // XDR and XHR status detection APIs differ a bit.
        if (isXdr(xhr)) {
            xhr.onload = getXdrLoadHandler(id);
            xhr.onerror = getXdrErrorHandler(id);
        }
        else {
            xhr.onreadystatechange = getXhrReadyStateChangeHandler(id);
        }

        // The last parameter is assumed to be ignored if we are actually using `XDomainRequest`.
        xhr.open(method, url, true);

        // Instruct the transport to send cookies along with the CORS request,
        // unless we are using `XDomainRequest`, which is not capable of this.
        if (options.cors.expected && options.cors.sendCredentials && !isXdr(xhr)) {
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

    // Invoked by the UA to indicate a number of possible states that describe
    // a live `XMLHttpRequest` transport.
    function getXhrReadyStateChangeHandler(id) {
        return function () {
            if (getXhrOrXdr(id).readyState === 4) {
                onComplete(id);
            }
        };
    }

    // This will be called by IE to indicate **success** for an associated
    // `XDomainRequest` transported request.
    function getXdrLoadHandler(id) {
        return function () {
            onComplete(id);
        }
    }

    // This will be called by IE to indicate **failure** for an associated
    // `XDomainRequest` transported request.
    function getXdrErrorHandler(id) {
        return function () {
            onComplete(id, true);
        }
    }

    function setHeaders(id) {
        var xhr = getXhrOrXdr(id),
            customHeaders = options.customHeaders;

        // If this is a CORS request and a simple method with simple headers are used
        // on an `XMLHttpRequest`, exclude these specific non-simple headers
        // in an attempt to prevent preflighting.  `XDomainRequest` does not support setting
        // request headers, so we will take this into account as well.
        if (isXdr(xhr)) {
            if (!options.cors.expected || (!isSimpleMethod() || containsNonSimpleHeaders(customHeaders))) {
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                xhr.setRequestHeader("Cache-Control", "no-cache");
            }
        }

        // Assuming that all POST and PUT requests will need to be URL encoded.
        // The payload of a POST `XDomainRequest` also needs to be URL encoded, but we
        // can't set the Content-Type when using this transport.
        if ((options.method === "POST" || options.method === "PUT") && !isXdr(xhr)) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        // `XDomainRequest` doesn't allow you to set any headers.
        if (!isXdr(xhr)) {
            qq.each(customHeaders, function (name, val) {
                xhr.setRequestHeader(name, val);
            });
        }
    }

    function cancelRequest(id) {
        var xhr = getXhrOrXdr(id, true),
            method = options.method;

        if (xhr) {
            // The event handlers we remove/unregister is dependant on whether we are
            // using `XDomainRequest` or `XMLHttpRequest`.
            if (isXdr(xhr)) {
                xhr.onerror = null;
                xhr.onload = null;
            }
            else {
                xhr.onreadystatechange = null;
            }

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
        send: function (id, addToPath, additionalParams) {
            requestState[id] = {
                addToPath: addToPath,
                additionalParams: additionalParams
            };

            var len = queue.push(id);

            // if too many active connections, wait...
            if (len <= options.maxConnections) {
                sendRequest(id);
            }
        },
        cancel: function (id) {
            return cancelRequest(id);
        }
    };
};
