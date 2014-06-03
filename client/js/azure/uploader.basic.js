/*globals qq */
/**
 * This defines FineUploaderBasic mode w/ support for uploading to Azure, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to Azure.
 * Some inherited options and API methods have a special meaning in the context of the Azure uploader.
 */
(function(){
    "use strict";

    qq.azure.FineUploaderBasic = function(o) {
        if (!qq.supportedFeatures.ajaxUploading) {
            throw new qq.Error("Uploading directly to Azure is not possible in this browser.");
        }

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
            },

            chunking: {
                // If this is increased, Azure may respond with a 413
                partSize: 4000000,
                // Don't chunk files less than this size
                minFileSize: 4000001
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        // Call base module
        qq.FineUploaderBasic.call(this, options);

        this._uploadSuccessParamsStore = this._createStore(this._options.uploadSuccess.params);

         // This will hold callbacks for failed uploadSuccess requests that will be invoked on retry.
        // Indexed by file ID.
        this._failedSuccessRequestCallbacks = {};

        // Holds blob names for file representations constructed from a session request.
        this._cannedBlobNames = {};
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePrivateApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.nonTraditionalBasePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.nonTraditionalBasePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploaderBasic.prototype, {
        getBlobName: function(id) {
            /* jshint eqnull:true */
            if (this._cannedBlobNames[id] == null) {
                return this._handler.getThirdPartyFileId(id);
            }
            return this._cannedBlobNames[id];
        },

        _getEndpointSpecificParams: function(id) {
            return {
                blob: this.getBlobName(id),
                uuid: this.getUuid(id),
                name: this.getName(id),
                container: this._endpointStore.get(id)
            };
        },

        _createUploadHandler: function() {
            return qq.FineUploaderBasic.prototype._createUploadHandler.call(this,
                {
                    signature: this._options.signature,
                    onGetBlobName: qq.bind(this._determineBlobName, this),
                    deleteBlob: qq.bind(this._deleteBlob, this, true)
                },
                "azure");
        },

        _determineBlobName: function(id) {
            var self = this,
                blobNameOptionValue = this._options.blobProperties.name,
                uuid = this.getUuid(id),
                filename = this.getName(id),
                fileExtension = qq.getExtension(filename);

            if (qq.isString(blobNameOptionValue)) {
                switch(blobNameOptionValue) {
                    case "uuid":
                        return new qq.Promise().success(uuid + "." + fileExtension);
                    case "filename":
                        return new qq.Promise().success(filename);
                    default:
                        return new qq.Promise.failure("Invalid blobName option value - " + blobNameOptionValue);
                }
            }
            else {
                return blobNameOptionValue.call(this, id);
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
        },

        _deleteBlob: function(relatedToCancel, id) {
            var self = this,
                deleteBlobSasUri = {},
                blobUriStore = {
                    get: function(id) {
                        return self._endpointStore.get(id) + "/" + self.getBlobName(id);
                    }
                },
                deleteFileEndpointStore = {
                    get: function(id) {
                        return deleteBlobSasUri[id];
                    }
                },
                getSasSuccess = function(id, sasUri) {
                    deleteBlobSasUri[id] = sasUri;
                    deleteBlob.send(id);
                },
                getSasFailure = function(id, reason, xhr) {
                    if (relatedToCancel) {
                        self.log("Will cancel upload, but cannot remove uncommitted parts from Azure due to issue retrieving SAS", "error");
                        qq.FineUploaderBasic.prototype._onCancel.call(self, id, self.getName(id));
                    }
                    else {
                        self._onDeleteComplete(id, xhr, true);
                        self._options.callbacks.onDeleteComplete(id, xhr, true);
                    }
                },
                deleteBlob = new qq.azure.DeleteBlob({
                    endpointStore: deleteFileEndpointStore,
                    log: qq.bind(self.log, self),
                    onDelete: function(id) {
                        self._onDelete(id);
                        self._options.callbacks.onDelete(id);
                    },
                    onDeleteComplete: function(id, xhrOrXdr, isError) {
                        delete deleteBlobSasUri[id];

                        if (isError) {
                            if (relatedToCancel) {
                                self.log("Will cancel upload, but failed to remove uncommitted parts from Azure.", "error");
                            }
                            else {
                                qq.azure.util.parseAzureError(xhrOrXdr.responseText, qq.bind(self.log, self));
                            }
                        }

                        if (relatedToCancel) {
                            qq.FineUploaderBasic.prototype._onCancel.call(self, id, self.getName(id));
                            self.log("Deleted uncommitted blob chunks for " + id);
                        }
                        else {
                            self._onDeleteComplete(id, xhrOrXdr, isError);
                            self._options.callbacks.onDeleteComplete(id, xhrOrXdr, isError);
                        }
                    }
                }),
                getSas = new qq.azure.GetSas({
                    cors: this._options.cors,
                    endpointStore: {
                        get: function() {
                            return self._options.signature.endpoint;
                        }
                    },
                    restRequestVerb: deleteBlob.method,
                    log: qq.bind(self.log, self)
                });


            getSas.request(id, blobUriStore.get(id)).then(
                qq.bind(getSasSuccess, self, id),
                qq.bind(getSasFailure, self, id));
        },

        _createDeleteHandler: function() {
            var self = this;

            return {
                sendDelete: function(id, uuid) {
                    self._deleteBlob(false, id);
                }
            };
        }
    });
}());
