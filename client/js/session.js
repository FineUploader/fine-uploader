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
        var someItemsIgnored = false;

        success = success && isJsonResponseValid(fileItems);

        if (success) {
            qq.each(fileItems, function(idx, fileItem) {
                /* jshint eqnull:true */
                if (fileItem.uuid == null) {
                    someItemsIgnored = true;
                    options.log(qq.format("Session response item {} did not include a valid UUID - ignoring.", idx), "error");
                }
                else if (fileItem.name == null) {
                    someItemsIgnored = true;
                    options.log(qq.format("Session response item {} did not include a valid name - ignoring.", idx), "error");
                }
                else {
                    try {
                        options.addFileRecord(fileItem);
                        return true;
                    }
                    catch (err) {
                        someItemsIgnored = true;
                        options.log(err.message, "error");
                    }
                }

                return false;
            });
        }

        promise[success && !someItemsIgnored ? "success" : "failure"](fileItems, xhrOrXdr);
    }

    // Initiate a call to the server that will be used to populate the initial file list.
    // Returns a `qq.Promise`.
    this.refresh = function() {
        /*jshint indent:false */
        var refreshEffort = new qq.Promise(),
            refreshCompleteCallback = function(response, success, xhrOrXdr) {
                handleFileItems(response, success, xhrOrXdr, refreshEffort);
            },
            requesterOptions = qq.extend({}, options),
            requester = new qq.SessionAjaxRequester(
                qq.extend(requesterOptions, {onComplete: refreshCompleteCallback})
            );

        requester.queryServer();

        return refreshEffort;
    };
};
