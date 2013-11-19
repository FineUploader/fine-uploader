/*globals jQuery*/
/**
 * Simply an alias for the `fineUploader` plug-in wrapper, but hides the required `endpointType` option from the
 * integrator.  I thought it may be confusing to convey to the integrator that, when using Fine Uploader in S3 mode,
 * you need to specify an `endpointType` with a value of S3, and perhaps an `uploaderType` with a value of "basic" if
 * you want to use basic mode when uploading directly to S3 as well.  So, you can use this plug-in alias and not worry
 * about the `endpointType` option at all.
 */
(function($) {
    "use strict";

    $.fn.fineUploaderS3 = function(optionsOrCommand) {
        if (typeof optionsOrCommand === "object") {

            // This option is used to tell the plug-in wrapper to instantiate the appropriate S3-namespace modules.
            optionsOrCommand.endpointType = "s3";
        }

        return $.fn.fineUploader.apply(this, arguments);
    };

}(jQuery));
