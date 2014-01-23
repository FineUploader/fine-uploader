/*globals qq */
/**
 * This defines FineUploaderBasic mode w/ support for uploading to Azure, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to Azure.
 * Some inherited options and API methods have a special meaning in the context of the Azure uploader.
 */
(function(){
    "use strict";

    qq.azure.FineUploaderBasic = function(o) {
        var options = {
            signature: {
                endpoint: null,

                customHeaders: {}
            },

            // 'uuid', 'filename', or a function which may be promissory
            blobProperties: {
                name: "uuid"
            },

            uploadSuccess: {
                endpoint: null,

                // In addition to the default params sent by Fine Uploader
                params: {},

                customHeaders: {}
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        // Call base module
        qq.FineUploaderBasic.call(this, options);

        this._uploadSuccessParamsStore = this._createStore(this._options.uploadSuccess.params);
        this._blobNames = {};

         // This will hold callbacks for failed uploadSuccess requests that will be invoked on retry.
        // Indexed by file ID.
        this._failedSuccessRequestCallbacks = {};

        // Holds blob names for file representations constructed from a session request.
        this._cannedBlobNames = {};
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploaderBasic.prototype, {
        getBlobName: function(id) {
            /* jshint eqnull:true */
            if (this._cannedBlobNames[id] == null) {
                return this._blobNames[id];
            }
            return this._cannedBlobNames[id];
        },

        setUploadSuccessParams: function(params, id) {
            this._uploadSuccessParamsStore.set(params, id);
        },

        /**
         * When the upload has completed, if it is successful, send a request to the `successEndpoint` (if defined).
         * This will hold up the call to the `onComplete` callback until we have determined success of the upload to S3
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
                blobName = this.getBlobName(id),
                successEndpoint = this._options.uploadSuccess.endpoint,
                successCustomHeaders = this._options.uploadSuccess.customHeaders,
                cors = this._options.cors,
                uuid = this.getUuid(id),
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

            // Ask the local server if the file sent to Azure is ok.
            if (success && successEndpoint) {
                successAjaxRequester = new qq.UploadSuccessAjaxRequester({
                    endpoint: successEndpoint,
                    customHeaders: successCustomHeaders,
                    cors: cors,
                    log: qq.bind(this.log, this)
                });


                // combine custom params and default params
                qq.extend(uploadSuccessParams, {
                    blobName: blobName,
                    uuid: uuid,
                    name: name,
                    containerUrl: self._endpointStore.get(id)
                }, true);

                submitSuccessRequest = qq.bind(function() {
                    successAjaxRequester.sendSuccessRequest(id, uploadSuccessParams)
                        .then(onSuccessFromServer, onFailureFromServer);
                }, self);

                submitSuccessRequest();

                return promise;
            }

            // If we are not asking the local server about the file in Azure, just delegate to the parent `_onComplete`.
            return qq.FineUploaderBasic.prototype._onComplete.apply(this, arguments);
        },

        // If the failure occurred on an upload success request (and a reset was not ordered), try to resend that instead.
        _manualRetry: function(id) {
            var successRequestCallback = this._failedSuccessRequestCallbacks[id];

            return qq.FineUploaderBasic.prototype._manualRetry.call(this, id, successRequestCallback);
        },

        _createUploadHandler: function() {
            return qq.FineUploaderBasic.prototype._createUploadHandler.call(this,
                {
                    signature: this._options.signature,
                    onGetBlobName: qq.bind(this._determineBlobName, this)
                },
                "azure");
        },

        _determineBlobName: function(id) {
            var self = this,
                blobNameOptionValue = this._options.blobProperties.name,
                uuid = this.getUuid(id),
                filename = this.getName(id),
                fileExtension = qq.getExtension(filename);

            /* jshint eqnull:true */
            if (this._blobNames[id] != null) {
                return new qq.Promise().success(this._blobNames[id]);
            }

            if (qq.isString(blobNameOptionValue)) {
                switch(blobNameOptionValue) {
                    case "uuid":
                        this._blobNames[id] = uuid + "." + fileExtension;
                        return new qq.Promise().success(this._blobNames[id]);
                    case "filename":
                        this._blobNames[id] = filename;
                        return new qq.Promise().success(filename);
                    default:
                        return new qq.Promise.failure("Invalid blobName option value - " + blobNameOptionValue);
                }
            }
            else {
                return blobNameOptionValue.call(this, id).then(function(blobName) {
                    self._blobNames[id] = blobName;
                });
            }
        },

        _addCannedFile: function(sessionData) {
            var id;

            /* jshint eqnull:true */
            if (sessionData.blobName == null) {
                throw new qq.Error("Did not find blob name property in server session response.  This is required!");
            }
            else {
                id = qq.FineUploaderBasic.prototype._addCannedFile.apply(this, arguments);
                this._cannedBlobNames[id] = sessionData.blobName;
            }

            return id;
        }
    });
}());
