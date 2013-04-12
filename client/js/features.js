qq(window).attach("load", function() {
    "use strict";

    qq.supportedFeatures = (function() {
        var supportsUploading = false,
            supportsAjaxFileUploading = false,
            supportsFolderDrop = false,
            supportsChunking = false,
            supportsResume = false;


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

        supportsUploading = testSupportsFileInputElement();
        supportsAjaxFileUploading = supportsUploading && qq.isXhrUploadSupported();
        supportsFolderDrop = supportsAjaxFileUploading && isChrome21OrHigher();
        supportsChunking = supportsAjaxFileUploading && qq.isFileChunkingSupported();
        supportsResume = supportsAjaxFileUploading && supportsChunking && qq.areCookiesEnabled();


        return {
            uploading: supportsUploading,
            ajaxUploading: supportsAjaxFileUploading,
            fileDrop: supportsAjaxFileUploading, //NOTE: will also return true for touch-only devices.  It's not currently possible to accurately test for touch-only devices
            folderDrop: supportsFolderDrop,
            chunking: supportsChunking,
            resume: supportsResume
        }

    }());

});
