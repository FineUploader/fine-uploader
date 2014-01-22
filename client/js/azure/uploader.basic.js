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
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploaderBasic.prototype, {
        _createUploadHandler: function() {
            return qq.FineUploaderBasic.prototype._createUploadHandler.call(this,
                {
                    signature: this._options.signature,
                    onGetBlobName: qq.bind(this._determineBlobName, this)
                },
                "azure");
        },

        _determineBlobName: function(id) {
            var blobNameOptionValue = this._options.blobProperties.name,
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
        }
    });
}());
