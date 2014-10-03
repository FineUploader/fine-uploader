/*globals qq */
/**
 * This defines FineUploader mode w/ support for uploading to Azure, which provides all the basic
 * functionality of Fine Uploader as well as code to handle uploads directly to Azure.
 * This module inherits all logic from UI & core mode and adds some UI-related logic
 * specific to the upload-to-Azure workflow.  Some inherited options and API methods have a special meaning
 * in the context of the Azure uploader.
 */
(function() {
    "use strict";

    qq.azure.FineUploader = function(o) {
        var options = {
            failedUploadTextDisplay: {
                mode: "custom"
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        // Inherit instance data from FineUploader, which should in turn inherit from azure.FineUploaderBasic.
        qq.FineUploader.call(this, options, "azure");
    };

    // Inherit the API methods from FineUploaderBasicS3
    qq.extend(qq.azure.FineUploader.prototype, qq.azure.FineUploaderBasic.prototype);

    // Inherit public and private API methods related to UI
    qq.extend(qq.azure.FineUploader.prototype, qq.uiPublicApi);
    qq.extend(qq.azure.FineUploader.prototype, qq.uiPrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.azure.FineUploader.prototype, {
    });
}());
