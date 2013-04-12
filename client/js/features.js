qq(window).attach("load", function() {
    "use strict";

    qq.supportedFeatures = (function() {
        var supportsFileInputElement,
            supportsAjaxFileUploading,
            supportsFolderDrop,
            supportsChunking;


        function testSupportsFileInputElement() {
            var supported = true,
                tempInput;

            try {
                tempInput = document.createElement('input');
                tempInput.type = 'file';
                qq(tempInput).hide();
                document.getElementsByTagName('body')[0].appendChild(tempInput);

                if(tempInput.disabled) {
                    supported = false;
                }
            }
            catch(ex) {
                supported = false;
            }
            finally {
                if (tempInput) {
                    qq(tempInput).remove();
                }
            }

            return supported;
        }

        //only way to test for Filesystem API support since webkit does not expose the DataTransfer interface
        function isChrome21OrHigher() {
            return qq.chrome() &&
                navigator.userAgent.match(/Chrome\/[2][1-9]|Chrome\/[3-9][0-9]/) !== undefined;
        }

        supportsFileInputElement = testSupportsFileInputElement();
        supportsAjaxFileUploading = qq.isXhrUploadSupported();
        supportsFolderDrop = isChrome21OrHigher();
        supportsChunking = qq.isFileChunkingSupported();


        return {
            uploading: supportsFileInputElement || supportsAjaxFileUploading,
            ajaxUploading: supportsAjaxFileUploading,
            fileDrop: supportsAjaxFileUploading, //NOTE: will also return true for touch-only devices.  It's not currently possible to accurately test for touch-only devices
            folderDrop: supportsAjaxFileUploading && supportsFolderDrop,
            chunking: supportsAjaxFileUploading && supportsChunking,
            resume: supportsAjaxFileUploading && supportsChunking && qq.areCookiesEnabled()
        }

    }());

});
