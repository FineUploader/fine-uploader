/* globals qq */
/**
 * Module used to control populating the initial list of files.
 *
 * @constructor
 */
qq.Session = function(spec) {
    "use strict";

    var options = {
        endpoint: null,
        params: {},
        customHeaders: {},
        cors: {},
        addFileRecord: function(sessionData) {},
        log: function(message, level) {}
    };

    qq.extend(options, spec, true);


    function isJsonResponseValid(response) {
        if (qq.isArray(response)) {
            return true;
        }

        options.log("Session response is not an array.", "error");
    }

    function handleFileItems(fileItems, success, xhrOrXdr, promise) {
        success = isJsonResponseValid(fileItems);

        if (success) {
            qq.each(fileItems, function(idx, fileItem) {
                /* jshint eqnull:true */
                if (fileItem.uuid == null) {
                    options.log(qq.format("Session response item {} did not include a valid UUID - ignoring.", idx), "error");
                }
                else if (fileItem.name == null) {
                    options.log(qq.format("Session response item {} did not include a valid name - ignoring.", idx), "error");
                }
                else {
                    options.addFileRecord(fileItem);
                    return true;
                }

                return false;
            });
        }

        promise[success ? "success" : "failure"](fileItems, xhrOrXdr);
    }

    // Initiate a call to the server that will be used to populate the initial file list.
    // Returns a `qq.Promise`.
    this.refresh = function() {
        /*jshint indent:false */
        var refreshEffort = new qq.Promise(),
            refreshCompleteCallback = function(response, success, xhrOrXdr) {
                handleFileItems(response, success, xhrOrXdr, refreshEffort);
            },
            requsterOptions = qq.extend({}, options),
            requester = new qq.SessionAjaxRequester(
                qq.extend(requsterOptions, {onComplete: refreshCompleteCallback})
            );

        requester.queryServer();

        return refreshEffort;
    };
};
