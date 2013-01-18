/** Generic class for sending non-upload ajax requests and handling the associated responses **/
/*globals qq*/
qq.AjaxRequestor = function(o) {
    "use strict";

    var log,
        queue = [],
        requestState = [],

        options = {
            endpoint: '/server/upload',
            method: 'POST',
            maxConnections: 3,
            log: function(str, level) {},
            onSend: function(id) {},
            onComplete: function(id, xhr) {}
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

        queue.splice(i, 1);

        if (queue.length >= max && i < max){
            nextId = queue[max-1];
            sendRequest(nextId);
        }
    }

    function onComplete(id) {
        var xhr = requestState[id].xhr;

        options.onComplete(id, xhr);
        dequeue(id);
    }

    function sendRequest(id) {
        //TODO
    }


    return {
        send: function(id, parameters) {
            requestState[id] = {params: parameters};

            var len = queue.push(id);

            // if too many active connections, wait...
            if (len <= options.maxConnections){
                sendRequest(id);
            }
        }
    };
};
