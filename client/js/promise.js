/*globals qq*/
qq.Promise = function() {
    "use strict";

    var successValue, failureValue,
        successCallback, failureCallback,
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
        },

        success: function(val) {
            state = 1;
            successValue = val;

            if (successCallback) {
                successCallback(val);
            }

            return this;
        },

        failure: function(val) {
            state = -1;
            failureValue = val;

            if (failureCallback) {
                failureCallback(val);
            }

            return this;
        }
    };
};