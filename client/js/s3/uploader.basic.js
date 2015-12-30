/*globals qq */
/**
 * This defines FineUploaderBasic mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to S3.
 * Some inherited options and API methods have a special meaning in the context of the S3 uploader.
 */
(function() {
    "use strict";

    qq.s3.FineUploaderBasic = function(o) {
        var options = {
            request: {
                // public key (required for server-side signing, ignored if `credentials` have been provided)
                accessKey: null,

                // padding, in milliseconds, to add to the x-amz-date header & the policy expiration date
                clockDrift: 0
            },

            objectProperties: {
                acl: "private",

                // string or a function which may be promissory
                bucket: qq.bind(function(id) {
                    return qq.s3.util.getBucket(this.getEndpoint(id));
                }, this),

                // string or a function which may be promissory - only used for V4 multipart uploads
                host: qq.bind(function(id) {
                    return (/(?:http|https):\/\/(.+)(?:\/.+)?/).exec(this._endpointStore.get(id))[1];
                }, this),

                // 'uuid', 'filename', or a function which may be promissory
                key: "uuid",

                reducedRedundancy: false,

                // Defined at http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
                region: "us-east-1",

                serverSideEncryption: false
            },

            credentials: {
                // Public key (required).
                accessKey: null,
                // Private key (required).
                secretKey: null,
                // Expiration date for the credentials (required).  May be an ISO string or a `Date`.
                expiration: null,
                // Temporary credentials session token.
                // Only required for temporary credentials obtained via AssumeRoleWithWebIdentity.
                sessionToken: null
            },

            // All but `version` are ignored if `credentials` is provided.
            signature: {
                customHeaders: {},
                endpoint: null,
                version: 2
            },

            uploadSuccess: {
                endpoint: null,

                method: "POST",

                // In addition to the default params sent by Fine Uploader
                params: {},

                customHeaders: {}
            },

            // required if non-File-API browsers, such as IE9 and older, are used
            iframeSupport: {
                localBlankPagePath: null
            },

            chunking: {
                // minimum part size is 5 MiB when uploading to S3
                partSize: 5242880
            },

            cors: {
                allowXdr: true
            },

            callbacks: {
                onCredentialsExpired: function() {}
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        if (!this.setCredentials(options.credentials, true)) {
            this._currentCredentials.accessKey = options.request.accessKey;
        }

        this._aclStore = this._createStore(options.objectProperties.acl);

        // Call base module
        qq.FineUploaderBasic.call(this, options);

        this._uploadSuccessParamsStore = this._createStore(this._options.uploadSuccess.params);
        this._uploadSuccessEndpointStore = this._createStore(this._options.uploadSuccess.endpoint);

        // This will hold callbacks for failed uploadSuccess requests that will be invoked on retry.
        // Indexed by file ID.
        this._failedSuccessRequestCallbacks = {};

        // Holds S3 keys for file representations constructed from a session request.
        this._cannedKeys = {};
        // Holds S3 buckets for file representations constructed from a session request.
        this._cannedBuckets = {};

        this._buckets = {};
        this._hosts = {};
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.s3.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.s3.FineUploaderBasic.prototype, qq.basePrivateApi);
    qq.extend(qq.s3.FineUploaderBasic.prototype, qq.nonTraditionalBasePublicApi);
    qq.extend(qq.s3.FineUploaderBasic.prototype, qq.nonTraditionalBasePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.s3.FineUploaderBasic.prototype, {
        getBucket: function(id) {
            if (this._cannedBuckets[id] == null) {
                return this._buckets[id];
            }
            return this._cannedBuckets[id];
        },

        /**
         * @param id File ID
         * @returns {*} Key name associated w/ the file, if one exists
         */
        getKey: function(id) {
            /* jshint eqnull:true */
            if (this._cannedKeys[id] == null) {
                return this._handler.getThirdPartyFileId(id);
            }

            return this._cannedKeys[id];
        },

        /**
         * Override the parent's reset function to cleanup various S3-related items.
         */
        reset: function() {
            qq.FineUploaderBasic.prototype.reset.call(this);
            this._failedSuccessRequestCallbacks = [];
            this._buckets = {};
            this._hosts = {};
        },

        setCredentials: function(credentials, ignoreEmpty) {
            if (credentials && credentials.secretKey) {
                if (!credentials.accessKey) {
                    throw new qq.Error("Invalid credentials: no accessKey");
                }
                else if (!credentials.expiration) {
                    throw new qq.Error("Invalid credentials: no expiration");
                }
                else {
                    this._currentCredentials = qq.extend({}, credentials);

                    // Ensure expiration is a `Date`.  If initially a string, assuming it is in ISO format.
                    if (qq.isString(credentials.expiration)) {
                        this._currentCredentials.expiration = new Date(credentials.expiration);
                    }
                }

                return true;
            }
            else if (!ignoreEmpty) {
                throw new qq.Error("Invalid credentials parameter!");
            }
            else {
                this._currentCredentials = {};
            }
        },

        setAcl: function(acl, id) {
            this._aclStore.set(acl, id);
        },

        /**
         * Ensures the parent's upload handler creator passes any additional S3-specific options to the handler as well
         * as information required to instantiate the specific handler based on the current browser's capabilities.
         *
         * @returns {qq.UploadHandlerController}
         * @private
         */
        _createUploadHandler: function() {
            var self = this,
                additionalOptions = {
                    aclStore: this._aclStore,
                    getBucket: qq.bind(this._determineBucket, this),
                    getHost: qq.bind(this._determineHost, this),
                    getKeyName: qq.bind(this._determineKeyName, this),
                    iframeSupport: this._options.iframeSupport,
                    objectProperties: this._options.objectProperties,
                    signature: this._options.signature,
                    clockDrift: this._options.request.clockDrift,
                    // pass size limit validation values to include in the request so AWS enforces this server-side
                    validation: {
                        minSizeLimit: this._options.validation.minSizeLimit,
                        maxSizeLimit: this._options.validation.sizeLimit
                    }
                };

            // We assume HTTP if it is missing from the start of the endpoint string.
            qq.override(this._endpointStore, function(super_) {
                return {
                    get: function(id) {
                        var endpoint = super_.get(id);

                        if (endpoint.indexOf("http") < 0) {
                            return "http://" + endpoint;
                        }

                        return endpoint;
                    }
                };
            });

            // Some param names should be lower case to avoid signature mismatches
            qq.override(this._paramsStore, function(super_) {
                return {
                    get: function(id) {
                        var oldParams = super_.get(id),
                            modifiedParams = {};

                        qq.each(oldParams, function(name, val) {
                            var paramName = name;

                            if (qq.indexOf(qq.s3.util.CASE_SENSITIVE_PARAM_NAMES, paramName) < 0) {
                                paramName = paramName.toLowerCase();
                            }

                            modifiedParams[paramName] = qq.isFunction(val) ? val() : val;
                        });

                        return modifiedParams;
                    }
                };
            });

            additionalOptions.signature.credentialsProvider = {
                get: function() {
                    return self._currentCredentials;
                },

                onExpired: function() {
                    var updateCredentials = new qq.Promise(),
                        callbackRetVal = self._options.callbacks.onCredentialsExpired();

                    if (qq.isGenericPromise(callbackRetVal)) {
                        callbackRetVal.then(function(credentials) {
                            try {
                                self.setCredentials(credentials);
                                updateCredentials.success();
                            }
                            catch (error) {
                                self.log("Invalid credentials returned from onCredentialsExpired callback! (" + error.message + ")", "error");
                                updateCredentials.failure("onCredentialsExpired did not return valid credentials.");
                            }
                        }, function(errorMsg) {
                            self.log("onCredentialsExpired callback indicated failure! (" + errorMsg + ")", "error");
                            updateCredentials.failure("onCredentialsExpired callback failed.");
                        });
                    }
                    else {
                        self.log("onCredentialsExpired callback did not return a promise!", "error");
                        updateCredentials.failure("Unexpected return value for onCredentialsExpired.");
                    }

                    return updateCredentials;
                }
            };

            return qq.FineUploaderBasic.prototype._createUploadHandler.call(this, additionalOptions, "s3");
        },

        _determineObjectPropertyValue: function(id, property) {
            var maybe = this._options.objectProperties[property],
                promise = new qq.Promise(),
                self = this;

            if (qq.isFunction(maybe)) {
                maybe = maybe(id);
                if (qq.isGenericPromise(maybe)) {
                    promise = maybe;
                }
                else {
                    promise.success(maybe);
                }
            }
            else if (qq.isString(maybe)) {
                promise.success(maybe);
            }

            promise.then(
                function success(value) {
                    self["_" + property + "s"][id] = value;
                },

                function failure(errorMsg) {
                    qq.log("Problem determining " + property + " for ID " + id + " (" + errorMsg + ")", "error");
                }
            );

            return promise;
        },

        _determineBucket: function(id) {
            return this._determineObjectPropertyValue(id, "bucket");
        },

        _determineHost: function(id) {
            return this._determineObjectPropertyValue(id, "host");
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
            /*jshint -W015*/
            var promise = new qq.Promise(),
                keynameLogic = this._options.objectProperties.key,
                extension = qq.getExtension(filename),
                onGetKeynameFailure = promise.failure,
                onGetKeynameSuccess = function(keyname, extension) {
                    var keynameToUse = keyname;

                    if (extension !== undefined) {
                        keynameToUse += "." + extension;
                    }

                    promise.success(keynameToUse);
                };

            switch (keynameLogic) {
                case "uuid":
                    onGetKeynameSuccess(this.getUuid(id), extension);
                    break;
                case "filename":
                    onGetKeynameSuccess(filename);
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
            var self = this,
                onSuccess = function(keyname) {
                    successCallback(keyname);
                },
                onFailure = function(reason) {
                    self.log(qq.format("Failed to retrieve key name for {}.  Reason: {}", id, reason || "null"), "error");
                    failureCallback(reason);
                },
                keyname = keynameFunc.call(this, id);

            if (qq.isGenericPromise(keyname)) {
                keyname.then(onSuccess, onFailure);
            }
            /*jshint -W116*/
            else if (keyname == null) {
                onFailure();
            }
            else {
                onSuccess(keyname);
            }
        },

        _getEndpointSpecificParams: function(id, response, maybeXhr) {
            var params = {
                key: this.getKey(id),
                uuid: this.getUuid(id),
                name: this.getName(id),
                bucket: this.getBucket(id)
            };

            if (maybeXhr && maybeXhr.getResponseHeader("ETag")) {
                params.etag = maybeXhr.getResponseHeader("ETag");
            }
            else if (response.etag) {
                params.etag = response.etag;
            }

            return params;
        },

        // Hooks into the base internal `_onSubmitDelete` to add key and bucket params to the delete file request.
        _onSubmitDelete: function(id, onSuccessCallback) {
            var additionalMandatedParams = {
                key: this.getKey(id),
                bucket: this.getBucket(id)
            };

            return qq.FineUploaderBasic.prototype._onSubmitDelete.call(this, id, onSuccessCallback, additionalMandatedParams);
        },

        _addCannedFile: function(sessionData) {
            var id;

            /* jshint eqnull:true */
            if (sessionData.s3Key == null) {
                throw new qq.Error("Did not find s3Key property in server session response.  This is required!");
            }
            else {
                id = qq.FineUploaderBasic.prototype._addCannedFile.apply(this, arguments);
                this._cannedKeys[id] = sessionData.s3Key;
                this._cannedBuckets[id] = sessionData.s3Bucket;
            }

            return id;
        }
    });
}());
