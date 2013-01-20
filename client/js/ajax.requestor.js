/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq, XMLHttpRequest*/
qq.AjaxRequestor = function(o) {
    "use strict";

    var log,
        queue = [],
        requestState = [],

        options = {
            endpoint: '/server/upload',
            method: 'POST',
            maxConnections: 3,
            customHeaders: {},
            log: function(str, level) {},
            onSend: function(id) {},
            onComplete: function(id, xhr, isError) {}
        };

    qq.extend(options, o);
    log = options.log;


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

        if (xhr.status !== 200) {
            isError = true;
            log(method + " request for " + id + " has failed - response code " + xhr.status, "error");
        }

        options.onComplete(id, xhr, isError);
    }

    function sendRequest(id) {
        var xhr = new XMLHttpRequest(),
            method = options.method,
            url = options.endpoint + "/" + requestState[id].param;

        requestState[id].xhr = xhr;
        xhr.onreadystatechange = getReadyStateChangeHandler(id);
        setHeaders(id);
        xhr.open(method, url, true);

        log('Sending ' + method + " request for " + id);

        xhr.send();
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
            xhr.abort();
            dequeue(id);
            log('Cancelled ' + method + " for " + id);
            return true;
        }

        return false;
    }


    return {
        send: function(id, parameter) {
            requestState[id] = {param: parameter};

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
