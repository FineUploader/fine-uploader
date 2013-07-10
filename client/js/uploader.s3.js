/**
 * This defines FineUploader mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader as well as code to handle uploads directly to S3.
 * This module inherits all logic from FineUploader mode and FineUploaderBasicS3 mode and adds some UI-related logic
 * specific to the upload-to-S3 workflow.  Some inherited options and API methods have a special meaning
 * in the context of the S3 uploader.
 */
qq.FineUploaderS3 = function(o) {
    // Inherit instance data from FineUploader, which should in turn inherit from FineUploaderBasicS3.
    qq.FineUploader.call(this, o, "FineUploaderBasicS3");

    // Replace any default options with user defined ones
    qq.extend(this._options, o, true);
};

// Inherit the API methods from FineUploaderBasicS3
qq.extend(qq.FineUploaderS3.prototype, qq.FineUploaderBasicS3.prototype);

// Inherit public and private API methods related to UI
qq.extend(qq.FineUploaderS3.prototype, qq.uiPublicApi);
qq.extend(qq.FineUploaderS3.prototype, qq.uiPrivateApi);

// Define public & private API methods for this module.
qq.extend(qq.FineUploaderS3.prototype, {});
