/**
 * This defines FineUploader mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader as well as code to handle uploads directly to S3.
 * This module inherits all logic from FineUploader mode and FineUploaderBasicS3 mode and adds some UI-related logic
 * specific to the upload-to-S3 workflow.  Some inherited options and API methods have a special meaning
 * in the context of the S3 uploader.
 */
qq.s3.FineUploader = function(o) {
    var options = {
        failedUploadTextDisplay: {
            mode: 'custom'
        }
    };

    // Replace any default options with user defined ones
    qq.extend(options, o, true);

    // Inherit instance data from FineUploader, which should in turn inherit from s3.FineUploaderBasic.
    qq.FineUploader.call(this, options, "s3");

    // Replace any default options with user defined ones
    qq.extend(this._options, options, true);
};

// Inherit the API methods from FineUploaderBasicS3
qq.extend(qq.s3.FineUploader.prototype, qq.s3.FineUploaderBasic.prototype);

// Inherit public and private API methods related to UI
qq.extend(qq.s3.FineUploader.prototype, qq.uiPublicApi);
qq.extend(qq.s3.FineUploader.prototype, qq.uiPrivateApi);

// Define public & private API methods for this module.
qq.extend(qq.s3.FineUploader.prototype, {});
