/**
 * This defines FineUploaderBasic mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to S3.
 * Some inherited options and API methods have a special meaning in the context of the S3 uploader.
 */
qq.FineUploaderBasicS3 = function(o) {
    var options = {
        s3: {
            accessKey: null,
            acl: 'private',
            keynameLogic: 'uuid',
            getKeyEndpoint: null,
            getSignatureEndpoint: null
        }
    };

    // Replace any default options with user defined ones
    qq.extend(options, o, true);

    // These are additional options that must be passed to the upload handler
    this._s3BasicOptions = {
        s3: options.s3
    };

    // Call base module
    qq.FineUploaderBasic.call(this, options);
};

// Inherit basic public & private API methods.
qq.extend(qq.FineUploaderBasicS3.prototype, qq.basePublicApi);
qq.extend(qq.FineUploaderBasicS3.prototype, qq.basePrivateApi);

// Define public & private API methods for this module.
qq.extend(qq.FineUploaderBasicS3.prototype, {
    _createUploadHandler: function() {
        return qq.FineUploaderBasic.prototype._createUploadHandler.call(this, this._s3BasicOptions, "S3");
    },
    _onUpload: function(id, name) {
        var promise = new qq.Promise(),
            keynameLogic = this._s3BasicOptions.s3.keynameLogic,
            superFunc = qq.bind(qq.FineUploaderBasic.prototype._onUpload, this, id, name);

        switch(keynameLogic) {
            case 'uuid':
                superFunc();
                promise.success(this.getUuid(id));
                break;
            case 'filename':
                superFunc();
                promise.success(name);
                break;
            case 'dynamic':
                //TODO ajax call to retrieve key name from server
                break;
            default:
                this.log(keynameLogic + " is not a valid value for s3.keynameLogic!", "error");
                promise.failure();
        }

        return promise;
    }
});
