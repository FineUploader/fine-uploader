/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.AjaxRequestor = function (o) {
    "use strict";

    var log, shouldParamsBeInQueryString,
        queue = [],
        requestData = [],
        options = {
            validMethods: ['POST'],
            method: 'POST',
            contentType: "application/x-www-form-urlencoded",
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

        // TODO remove code duplication among all ajax requesters
    if (qq.indexOf(options.validMethods, getNormalizedMethod()) < 0) {
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for this type of request!");
    }

    // TODO remove code duplication among all ajax requesters
    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    // [Simple methods](http://www.w3.org/TR/cors/#simple-method)
    // are defined by the W3C in the CORS spec as a list of methods that, in part,
    // make a CORS request eligible to be exempt from preflighting.
    function isSimpleMethod() {
        return qq.indexOf(["GET", "POST", "HEAD"], getNormalizedMethod()) >= 0;
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

        if (window.XMLHttpRequest || window.ActiveXObject) {
            xhrOrXdr = qq.createXhrInstance();

            if (xhrOrXdr.withCredentials === undefined) {
                xhrOrXdr = new XDomainRequest();
            }
        }

        return xhrOrXdr;
    }

    // Returns either a new XHR/XDR instance, or an existing one for the associated `File` or `Blob`.
    function getXhrOrXdr(id, dontCreateIfNotExist) {
        var xhrOrXdr = requestData[id].xhr;

        if (!xhrOrXdr && !dontCreateIfNotExist) {
            if (options.cors.expected) {
                xhrOrXdr = getCorsAjaxTransport();
            }
            else {
                xhrOrXdr = qq.createXhrInstance();
            }

            requestData[id].xhr = xhrOrXdr;
        }

        return xhrOrXdr;
    }

    // Removes element from queue, sends next request
    function dequeue(id) {
        var i = qq.indexOf(queue, id),
            max = options.maxConnections,
            nextId;

        delete requestData[id];
        queue.splice(i, 1);

        if (queue.length >= max && i < max) {
            nextId = queue[max - 1];
            sendRequest(nextId);
        }
    }

    function onComplete(id, xdrError) {
        var xhr = getXhrOrXdr(id),
            method = getNormalizedMethod(),
            isError = xdrError === true;

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
        var onDemandParams = requestData[id].onDemandParams,
            mandatedParams = options.mandatedParams,
            params;

        if (options.paramsStore.getParams) {
            params = options.paramsStore.getParams(id);
        }

        if (onDemandParams) {
            qq.each(onDemandParams, function (name, val) {
                params = params || {};
                params[name] = val;
            });
        }

        if (mandatedParams) {
            qq.each(mandatedParams, function (name, val) {
                params = params || {};
                params[name] = val;
            });
        }

        return params;
    }

    function sendRequest(id) {
        var xhr = getXhrOrXdr(id),
            method = getNormalizedMethod(),
            params = getParams(id),
            body = requestData[id].body,
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

        if (body) {
            xhr.send(body)
        }
        else if (shouldParamsBeInQueryString || !params) {
            xhr.send();
        }
        else if (params && options.contentType.toLowerCase().indexOf("application/x-www-form-urlencoded") >= 0) {
            xhr.send(qq.obj2url(params, ""));
        }
        else if (params && options.contentType.toLowerCase().indexOf("application/json") >= 0) {
            xhr.send(JSON.stringify(params));
        }
        else {
            xhr.send(params);
        }
    }

    function createUrl(id, params) {
        var endpoint = options.endpointStore.getEndpoint(id),
            addToPath = requestData[id].addToPath;

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
            customHeaders = options.customHeaders,
            onDemandHeaders = requestData[id].additionalHeaders || {},
            method = getNormalizedMethod(),
            allHeaders = {};

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

        // Note that we can't set the Content-Type when using this transport XDR, and it is
        // not relevant unless we will be including the params in the payload.
        if (options.contentType && (method === "POST" || method === "PUT") && !isXdr(xhr)) {
            xhr.setRequestHeader("Content-Type", options.contentType);
        }

        // `XDomainRequest` doesn't allow you to set any headers.
        if (!isXdr(xhr)) {
            qq.extend(allHeaders, customHeaders);
            qq.extend(allHeaders, onDemandHeaders);

            qq.each(allHeaders, function (name, val) {
                xhr.setRequestHeader(name, val);
            });
        }
    }

    function cancelRequest(id) {
        var xhr = getXhrOrXdr(id, true),
            method = getNormalizedMethod();

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
        return qq.indexOf(options.successfulResponseCodes[getNormalizedMethod()], responseCode) >= 0;
    }

    shouldParamsBeInQueryString = getNormalizedMethod() === 'GET' || getNormalizedMethod() === 'DELETE';

    return {
        send: function (id, addToPath, onDemandParams, onDemandHeaders, body) {
            requestData[id] = {
                addToPath: addToPath,
                onDemandParams: onDemandParams,
                additionalHeaders: onDemandHeaders,
                body: body
            };

            var len = queue.push(id);

            // if too many active connections, wait...
            if (len <= options.maxConnections) {
                sendRequest(id);
            }
        },

        cancel: function (id) {
            return cancelRequest(id);
        },

        getMethod: function() {
            return getNormalizedMethod();
        }
    };
};
