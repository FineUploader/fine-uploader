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
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        // Call base module
        qq.FineUploaderBasic.call(this, options);

        this._blobNames = {};
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploaderBasic.prototype, {
        getBlobName: function(id) {
            return this._blobNames[id];
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
        }
    });
}());
