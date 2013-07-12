/**
 * This defines FineUploaderBasic mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to S3.
 * Some inherited options and API methods have a special meaning in the context of the S3 uploader.
 */
qq.FineUploaderBasicS3 = function(o) {
    var options = {
        s3: {
            // required
            accessKey: null,
            acl: 'private',
            // required
            getSignatureEndpoint: null,
            // 'uuid', 'filename', or a function, which may be promissory
            keyname: 'uuid'
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
    /**
     * Ensure's the parent's upload handler creator passes the S3-specific options the handler as well as information
     * required to instantiate the specific handler based on the current browser's capabilities.
     *
     * @returns {qq.UploadHandler}
     * @private
     */
    _createUploadHandler: function() {
        return qq.FineUploaderBasic.prototype._createUploadHandler.call(this, this._s3BasicOptions, "S3");
    },

    /**
     * Overrides the parent's internal onUpload handler by determining the file's key name and passing it
     * to the caller via a promissory callback.  This also may delegate to an integrator-defined function
     * that determines the file's key name on demand, which also may be promissory.  Note that, on success,
     * the parent function is then invoked.
     *
     * @param id ID of the file to be uploaded
     * @param filename Name of the file to be uploaded
     * @returns {qq.Promise} A promise that will be fulfilled when the key name has been determined (and will be passed to the caller via the success callback).
     * @private
     */
    _onUpload: function(id, filename) {
        var promise = new qq.Promise(),
            keynameLogic = this._s3BasicOptions.s3.keyname,
            extension = qq.getExtension(filename),
            superFunc = qq.bind(qq.FineUploaderBasic.prototype._onUpload, this, id, filename),
            onGetKeynameFailure = promise.failure,
            onGetKeynameSuccess = function(keyname) {
                superFunc();
                if (keyname) {
                    promise.success(keyname + "." + extension);
                }
                else {
                    promise.success(filename);
                }
            };

        switch(keynameLogic) {
            case 'uuid':
                onGetKeynameSuccess(this.getUuid(id));
                break;
            case 'filename':
                onGetKeynameSuccess();
                break;
            default:
                if (qq.isFunction(keynameLogic)) {
                    this._handleKeynameFunction(keynameLogic, id, onGetKeynameSuccess, onGetKeynameFailure);
                }
                else {
                    this.log(keynameLogic + " is not a valid value for the s3.keyname option!", "error");
                    onGetKeynameFailure();
                }
        }

        return promise;
    },

    /**
     * Called by the internal onUpload handler if the integrator has supplied a function to determine
     * the file's key name.  The integrator's function may be promissory.  We also need to fulfill
     * the promise contract associated with the original internal onUpload handler as well.
     *
     * @param keynameFunc Integrator-supplied function that must be executed to determine the key name.  May be promissory.
     * @param id ID of the associated file
     * @param successCallback Invoke this if key name retrieval is successful, passing in the key name.
     * @param failureCallback Invoke this if key name retrieval was unsuccessful.
     * @private
     */
    _handleKeynameFunction: function(keynameFunc, id, successCallback, failureCallback) {
        var onSuccess = function(keyname) {
                successCallback(keyname);
            },
            onFailure = function() {
                this.log('Failed to retrieve key name for ' + id, "error");
                failureCallback();
            },
            keyname = keynameFunc(id);


        if (qq.isPromise(keyname)) {
            keynameFunc(id).then(onSuccess, onFailure);
        }
        else if (keyname == null) {
            onFailure();
        }
        else {
            onSuccess(keyname)
        }
    }
});
