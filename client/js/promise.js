/*globals qq*/
qq.Promise = function() {
    "use strict";

    var successValue, failureValue,
        successCallbacks = [],
        failureCallbacks = [],
        doneCallbacks = [],
        state = 0;

    return {
        then: function(onSuccess, onFailure) {
            if (state === 0) {
                if (onSuccess) {
                    successCallbacks.push(onSuccess);
                }
                if (onFailure) {
                    failureCallbacks.push(onFailure);
                }
            }
            else if (state === -1 && onFailure) {
                onFailure(failureValue);
            }
            else if (onSuccess) {
                onSuccess(successValue);
            }

            return this;
        },

        done: function(callback) {
            if (state === 0) {
                doneCallbacks.push(callback);
            }
            else {
                callback();
            }

            return this;
        },

        success: function(val) {
            state = 1;
            successValue = val;

            if (successCallbacks.length) {
                qq.each(successCallbacks, function(idx, callback) {
                    callback(val);
                })
            }

            if(doneCallbacks.length) {
                qq.each(doneCallbacks, function(idx, callback) {
                    callback();
                })
            }

            return this;
        },

        failure: function(val) {
            state = -1;
            failureValue = val;

            if (failureCallbacks.length) {
                qq.each(failureCallbacks, function(idx, callback) {
                    callback(val);
                })
            }

            if(doneCallbacks.length) {
                qq.each(doneCallbacks, function(idx, callback) {
                    callback();
                })
            }

            return this;
        }
    };
};

qq.isPromise = function(maybePromise) {
    return maybePromise && maybePromise.then && maybePromise.done;
};