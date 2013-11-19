/*globals qq */
/**
 * This defines FineUploader mode w/ support for uploading to S3, which provides all the basic
 * functionality of Fine Uploader as well as code to handle uploads directly to S3.
 * This module inherits all logic from FineUploader mode and FineUploaderBasicS3 mode and adds some UI-related logic
 * specific to the upload-to-S3 workflow.  Some inherited options and API methods have a special meaning
 * in the context of the S3 uploader.
 */
(function(){
    "use strict";

    qq.s3.FineUploader = function(o) {
        var options = {
            failedUploadTextDisplay: {
                mode: "custom"
            }
        };

        // Replace any default options with user defined ones
        qq.extend(options, o, true);

        // Inherit instance data from FineUploader, which should in turn inherit from s3.FineUploaderBasic.
        qq.FineUploader.call(this, options, "s3");

        if (!qq.supportedFeatures.ajaxUploading && options.iframeSupport.localBlankPagePath === undefined) {
            this._options.element.innerHTML = "<div>You MUST set the <code>localBlankPagePath</code> property " +
                "of the <code>iframeSupport</code> option since this browser does not support the File API!</div>";
        }
    };

    // Inherit the API methods from FineUploaderBasicS3
    qq.extend(qq.s3.FineUploader.prototype, qq.s3.FineUploaderBasic.prototype);

    // Inherit public and private API methods related to UI
    qq.extend(qq.s3.FineUploader.prototype, qq.uiPublicApi);
    qq.extend(qq.s3.FineUploader.prototype, qq.uiPrivateApi);

    // Define public & private API methods for this module.
    qq.extend(qq.s3.FineUploader.prototype, {
        /**
         * When the upload has completed, change the visible status to "processing" if we are expecting an async operation to
         * determine status of the file in S3.
         *
         * @param id ID of the completed upload
         * @param name Name of the associated item
         * @param result Object created from the server's parsed JSON response.
         * @param xhr Associated XmlHttpRequest, if this was used to send the request.
         * @returns {boolean || qq.Promise} true/false if success can be determined immediately, otherwise a `qq.Promise`
         * if we need to ask the server.
         * @private
         */
        _onComplete: function(id, name, result, xhr) {
            var parentRetVal = qq.FineUploader.prototype._onComplete.apply(this, arguments);

            if (parentRetVal instanceof qq.Promise) {
                this._templating.hideProgress(id);
                this._templating.setStatusText(id, this._options.text.waitingForResponse);
            }

            return parentRetVal;
        }
    });
}());
