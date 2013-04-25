/*globals qq*/
qq.Promise = function() {
    "use strict";

    var successValue, failureValue,
        successCallback, failureCallback, doneCallback,
        state = 0;

    return {
        then: function(onSuccess, onFailure) {
            if (state === 0) {
                successCallback = onSuccess;
                failureCallback = onFailure;
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
                doneCallback = callback;
            }
            else {
                callback();
            }

            return this;
        },

        success: function(val) {
            state = 1;
            successValue = val;

            if (successCallback) {
                successCallback(val);
            }

            if(doneCallback) {
                doneCallback();
            }

            return this;
        },

        failure: function(val) {
            state = -1;
            failureValue = val;

            if (failureCallback) {
                failureCallback(val);
            }

            if(doneCallback) {
                doneCallback();
            }

            return this;
        }
    };
};