/**
 * Upload handler used by the upload to S3 module that assumes the current user agent does not have any support for the
 * File API, and, therefore, makes use of iframes and forms to submit the files directly to S3 buckets via the associated
 * AWS API.
 *
 * @param o Options passed from the base handler
 * @param uploadCompleteCallback Callback to invoke when the upload has completed, regardless of success.
 * @param onUuidChanged Callback to invoke when the associated items UUID has changed by order of the server.
 * @param logCallback Used to posting log messages.
 */
qq.s3.UploadHandlerForm = function(o, uploadCompleteCallback, onUuidChanged, logCallback) {
    "use strict";
};
