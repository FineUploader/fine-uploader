/*globals qq, XDomainRequest*/
/** Generic class for sending non-upload ajax requests and handling the associated responses **/
qq.AjaxRequester = function (o) {
    "use strict";

    var log, shouldParamsBeInQueryString,
        queue = [],
        requestData = {},
        options = {
            validMethods: ["POST"],
            method: "POST",
            contentType: "application/x-www-form-urlencoded",
            maxConnections: 3,
            customHeaders: {},
            endpointStore: {},
            paramsStore: {},
            mandatedParams: {},
            allowXRequestedWithAndCacheControl: true,
            successfulResponseCodes: {
                "DELETE": [200, 202, 204],
                "POST": [200, 204],
                "GET": [200]
            },
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function (str, level) {},
            onSend: function (id) {},
            onComplete: function (id, xhrOrXdr, isError) {},
            onProgress: null
        };

    qq.extend(options, o);
    log = options.log;

    if (qq.indexOf(options.validMethods, options.method) < 0) {
        throw new Error("'" + options.method + "' is not a supported method for this type of request!");
    }

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
            method = options.method,
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
        var onDemandParams = requestData[id].additionalParams,
            mandatedParams = options.mandatedParams,
            params;

        if (options.paramsStore.get) {
            params = options.paramsStore.get(id);
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
            method = options.method,
            params = getParams(id),
            payload = requestData[id].payload,
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


        registerForUploadProgress(id);

        // The last parameter is assumed to be ignored if we are actually using `XDomainRequest`.
        xhr.open(method, url, true);

        // Instruct the transport to send cookies along with the CORS request,
        // unless we are using `XDomainRequest`, which is not capable of this.
        if (options.cors.expected && options.cors.sendCredentials && !isXdr(xhr)) {
            xhr.withCredentials = true;
        }

        setHeaders(id);

        log("Sending " + method + " request for " + id);

        if (payload) {
            xhr.send(payload);
        }
        else if (shouldParamsBeInQueryString || !params) {
            xhr.send();
        }
        else if (params && options.contentType && options.contentType.toLowerCase().indexOf("application/x-www-form-urlencoded") >= 0) {
            xhr.send(qq.obj2url(params, ""));
        }
        else if (params && options.contentType && options.contentType.toLowerCase().indexOf("application/json") >= 0) {
            xhr.send(JSON.stringify(params));
        }
        else {
            xhr.send(params);
        }

        return xhr;
    }

    function createUrl(id, params) {
        var endpoint = options.endpointStore.get(id),
            addToPath = requestData[id].addToPath;

        /*jshint -W116,-W041 */
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

    function registerForUploadProgress(id) {
        var onProgress = options.onProgress;

        if (onProgress) {
            getXhrOrXdr(id).upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    onProgress(id, e.loaded, e.total);
                }
            };
        }
    }

    // This will be called by IE to indicate **success** for an associated
    // `XDomainRequest` transported request.
    function getXdrLoadHandler(id) {
        return function () {
            onComplete(id);
        };
    }

    // This will be called by IE to indicate **failure** for an associated
    // `XDomainRequest` transported request.
    function getXdrErrorHandler(id) {
        return function () {
            onComplete(id, true);
        };
    }

    function setHeaders(id) {
        var xhr = getXhrOrXdr(id),
            customHeaders = options.customHeaders,
            onDemandHeaders = requestData[id].additionalHeaders || {},
            method = options.method,
            allHeaders = {};

        // If XDomainRequest is being used, we can't set headers, so just ignore this block.
        if (!isXdr(xhr)) {
            // Only attempt to add X-Requested-With & Cache-Control if permitted
            if (options.allowXRequestedWithAndCacheControl) {
                // Do not add X-Requested-With & Cache-Control if this is a cross-origin request
                // OR the cross-origin request contains a non-simple method or header.
                // This is done to ensure a preflight is not triggered exclusively based on the
                // addition of these 2 non-simple headers.
                if (!options.cors.expected || (!isSimpleMethod() || containsNonSimpleHeaders(customHeaders))) {
                    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    xhr.setRequestHeader("Cache-Control", "no-cache");
                }
            }

            if (options.contentType && (method === "POST" || method === "PUT")) {
                xhr.setRequestHeader("Content-Type", options.contentType);
            }

            qq.extend(allHeaders, qq.isFunction(customHeaders) ? customHeaders(id) : customHeaders);
            qq.extend(allHeaders, onDemandHeaders);

            qq.each(allHeaders, function (name, val) {
                xhr.setRequestHeader(name, val);
            });
        }
    }

    function isResponseSuccessful(responseCode) {
        return qq.indexOf(options.successfulResponseCodes[options.method], responseCode) >= 0;
    }

    function prepareToSend(id, addToPath, additionalParams, additionalHeaders, payload) {
        requestData[id] = {
            addToPath: addToPath,
            additionalParams: additionalParams,
            additionalHeaders: additionalHeaders,
            payload: payload
        };

        var len = queue.push(id);

        // if too many active connections, wait...
        if (len <= options.maxConnections) {
            return sendRequest(id);
        }
    }


    shouldParamsBeInQueryString = options.method === "GET" || options.method === "DELETE";

    qq.extend(this, {
        // Start the process of sending the request.  The ID refers to the file associated with the request.
        initTransport: function(id) {
            var path, params, headers, payload, cacheBuster;

            return {
                // Optionally specify the end of the endpoint path for the request.
                withPath: function(appendToPath) {
                    path = appendToPath;
                    return this;
                },

                // Optionally specify additional parameters to send along with the request.
                // These will be added to the query string for GET/DELETE requests or the payload
                // for POST/PUT requests.  The Content-Type of the request will be used to determine
                // how these parameters should be formatted as well.
                withParams: function(additionalParams) {
                    params = additionalParams;
                    return this;
                },

                // Optionally specify additional headers to send along with the request.
                withHeaders: function(additionalHeaders) {
                    headers = additionalHeaders;
                    return this;
                },

                // Optionally specify a payload/body for the request.
                withPayload: function(thePayload) {
                    payload = thePayload;
                    return this;
                },

                // Appends a cache buster (timestamp) to the request URL as a query parameter (only if GET or DELETE)
                withCacheBuster: function() {
                    cacheBuster = true;
                    return this;
                },

                // Send the constructed request.
                send: function() {
                    if (cacheBuster && qq.indexOf(["GET", "DELETE"], options.method) >= 0) {
                        params.qqtimestamp = new Date().getTime();
                    }

                    return prepareToSend(id, path, params, headers, payload);
                }
            };
        },

        canceled: function(id) {
            dequeue(id);
        }
    });
};
