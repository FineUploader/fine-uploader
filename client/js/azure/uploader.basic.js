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

        // This will hold callbacks for failed uploadSuccess requests that will be invoked on retry.
        // Indexed by file ID.
        this._failedSuccessRequestCallbacks = {};

        // Holds S3 keys for file representations constructed from a session request.
        this._cannedKeys = {};
    };

    // Inherit basic public & private API methods.
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePublicApi);
    qq.extend(qq.azure.FineUploaderBasic.prototype, qq.basePrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploaderBasic.prototype, {
    });
}());
