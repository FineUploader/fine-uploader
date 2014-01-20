/*globals jQuery*/
/**
 * Simply an alias for the `fineUploader` plug-in wrapper, but hides the required `endpointType` option from the
 * integrator.  I thought it may be confusing to convey to the integrator that, when using Fine Uploader in Azure mode,
 * you need to specify an `endpointType` with a value of "azure", and perhaps an `uploaderType` with a value of "basic" if
 * you want to use basic mode when uploading directly to Azure as well.  So, you can use this plug-in alias and not worry
 * about the `endpointType` option at all.
 */
(function($) {
    "use strict";

    $.fn.fineUploaderAzure = function(optionsOrCommand) {
        if (typeof optionsOrCommand === "object") {

            // This option is used to tell the plug-in wrapper to instantiate the appropriate Azure-namespace modules.
            optionsOrCommand.endpointType = "azure";
        }

        return $.fn.fineUploader.apply(this, arguments);
    };

}(jQuery));
