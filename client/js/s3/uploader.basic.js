/**
 * This defines FineUploaderBasic mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to S3.
 * Some inherited options and API methods have a special meaning in the context of the S3 uploader.
 */
qq.s3.FineUploaderBasic = function(o) {
    var options = {
        request: {
            signatureEndpoint: null,
            accessKey: null,
            // 'uuid', 'filename', or a function, which may be promissory
            key: 'uuid',
            acl: 'private'
        }
    };

    // Replace any default options with user defined ones
    qq.extend(options, o, true);

    // Call base module
    qq.FineUploaderBasic.call(this, options);

    this.keys = [];
};

// Inherit basic public & private API methods.
qq.extend(qq.s3.FineUploaderBasic.prototype, qq.basePublicApi);
qq.extend(qq.s3.FineUploaderBasic.prototype, qq.basePrivateApi);

// Define public & private API methods for this module.
qq.extend(qq.s3.FineUploaderBasic.prototype, {
    /**
     * @param id File ID
     * @returns {*} Key name associated w/ the file, if one exists
     */
    getKey: function(id) {
        return this.keys[id];
    },

    /**
     * Override the parent's reset function to cleanup various S3-related items.
     */
    reset: function() {
        qq.FineUploaderBasic.prototype.reset.call(this);

        this.keys = [];
    },

    /**
     * Ensures the parent's upload handler creator passes any additional S3-specific options to the handler as well
     * as information required to instantiate the specific handler based on the current browser's capabilities.
     *
     * @returns {qq.UploadHandler}
     * @private
     */
    _createUploadHandler: function() {
        var additionalOptions = {
            getKeyName: qq.bind(this._determineKeyName, this)
        };

        return qq.FineUploaderBasic.prototype._createUploadHandler.call(this, additionalOptions, "s3");
    },

    /**
     * Determine the file's key name and passes it to the caller via a promissory callback.  This also may
     * delegate to an integrator-defined function that determines the file's key name on demand,
     * which also may be promissory.
     *
     * @param id ID of the file
     * @param filename Name of the file
     * @returns {qq.Promise} A promise that will be fulfilled when the key name has been determined (and will be passed to the caller via the success callback).
     * @private
     */
    _determineKeyName: function(id, filename) {
        var self = this,
            promise = new qq.Promise(),
            keynameLogic = this._options.request.key,
            extension = qq.getExtension(filename),
            onGetKeynameFailure = promise.failure,
            onGetKeynameSuccess = function(keyname) {
                var keynameToUse = keyname || filename;

                if (keyname && extension !== undefined) {
                    self.keys[id] = keynameToUse + "." + extension;
                }
                else {
                    self.keys[id] = keynameToUse;
                }

                promise.success(self.keys[id]);
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
     * the promise contract associated with the caller as well.
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
