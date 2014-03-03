/*globals qq*/
/**
 * Defines the public API for non-traditional FineUploaderBasic mode.
 */
(function(){
    "use strict";

    qq.nonTraditionalBasePublicApi = {
        setUploadSuccessParams: function(params, id) {
            this._uploadSuccessParamsStore.set(params, id);
        }
    };




    qq.nonTraditionalBasePrivateApi = {
        /**
         * When the upload has completed, if it is successful, send a request to the `successEndpoint` (if defined).
         * This will hold up the call to the `onComplete` callback until we have determined success of the upload
         * according to the local server, if a `successEndpoint` has been defined by the integrator.
         *
         * @param id ID of the completed upload
         * @param name Name of the associated item
         * @param result Object created from the server's parsed JSON response.
         * @param xhr Associated XmlHttpRequest, if this was used to send the request.
         * @returns {boolean || qq.Promise} true/false if success can be determined immediately, otherwise a `qq.Promise`
         * if we need to ask the server.
         * @private
         */
        _onComplete: function(id, name, result, xhr) {
            var success = result.success ? true : false,
                self = this,
                onCompleteArgs = arguments,
                successEndpoint = this._options.uploadSuccess.endpoint,
                successCustomHeaders = this._options.uploadSuccess.customHeaders,
                cors = this._options.cors,
                promise = new qq.Promise(),
                uploadSuccessParams = this._uploadSuccessParamsStore.get(id),

                // If we are waiting for confirmation from the local server, and have received it,
                // include properties from the local server response in the `response` parameter
                // sent to the `onComplete` callback, delegate to the parent `_onComplete`, and
                // fulfill the associated promise.
                onSuccessFromServer = function(successRequestResult) {
                    delete self._failedSuccessRequestCallbacks[id];
                    qq.extend(result, successRequestResult);
                    qq.FineUploaderBasic.prototype._onComplete.apply(self, onCompleteArgs);
                    promise.success(successRequestResult);
                },

                // If the upload success request fails, attempt to re-send the success request (via the core retry code).
                // The entire upload may be restarted if the server returns a "reset" property with a value of true as well.
                onFailureFromServer = function(successRequestResult) {
                    var callback = submitSuccessRequest;

                    qq.extend(result, successRequestResult);

                    if (result && result.reset) {
                        callback = null;
                    }

                    if (!callback) {
                        delete self._failedSuccessRequestCallbacks[id];
                    }
                    else {
                        self._failedSuccessRequestCallbacks[id] = callback;
                    }

                    if (!self._onAutoRetry(id, name, result, xhr, callback)) {
                        qq.FineUploaderBasic.prototype._onComplete.apply(self, onCompleteArgs);
                        promise.failure(successRequestResult);
                    }
                },
                submitSuccessRequest,
                successAjaxRequester;

            // Ask the local server if the file sent is ok.
            if (success && successEndpoint) {
                successAjaxRequester = new qq.UploadSuccessAjaxRequester({
                    endpoint: successEndpoint,
                    customHeaders: successCustomHeaders,
                    cors: cors,
                    log: qq.bind(this.log, this)
                });


                // combine custom params and default params
                qq.extend(uploadSuccessParams, self._getEndpointSpecificParams(id, result, xhr), true);

                submitSuccessRequest = qq.bind(function() {
                    successAjaxRequester.sendSuccessRequest(id, uploadSuccessParams)
                        .then(onSuccessFromServer, onFailureFromServer);
                }, self);

                submitSuccessRequest();

                return promise;
            }

            // If we are not asking the local server about the file, just delegate to the parent `_onComplete`.
            return qq.FineUploaderBasic.prototype._onComplete.apply(this, arguments);
        },

        // If the failure occurred on an upload success request (and a reset was not ordered), try to resend that instead.
        _manualRetry: function(id) {
            var successRequestCallback = this._failedSuccessRequestCallbacks[id];

            return qq.FineUploaderBasic.prototype._manualRetry.call(this, id, successRequestCallback);
        }
    };
}());
