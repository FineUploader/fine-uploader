/**
 * This defines FineUploaderBasic mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader Basic as well as code to handle uploads directly to S3.
 * Some inherited options and API methods have a special meaning in the context of the S3 uploader.
 */
qq.FineUploaderBasicS3 = function(o) {
    // Inherit instance data from FineUploaderBasic.
    qq.FineUploaderBasic.apply(this, arguments);

    // Replace any default options with user defined ones
    qq.extend(this._options, o, true);
};

// Inherit basic public & private API methods.
qq.extend(qq.FineUploaderBasicS3.prototype, qq.basePublicApi);
qq.extend(qq.FineUploaderBasicS3.prototype, qq.basePrivateApi);

// Define public & private API methods for this module.
qq.extend(qq.FineUploaderBasicS3.prototype, {});
