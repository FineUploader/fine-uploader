qq.supportedFeatures = (function () {
    var supportsUploading,
        supportsAjaxFileUploading,
        supportsFolderDrop,
        supportsChunking,
        supportsResume,
        supportsUploadViaPaste,
        supportsUploadCors,
        supportsDeleteFileXdr,
        supportsDeleteFileCorsXhr,
        supportsDeleteFileCors,
        supportsFolderSelection;


    function testSupportsFileInputElement() {
        var supported = true,
            tempInput;

        try {
            tempInput = document.createElement('input');
            tempInput.type = 'file';
            qq(tempInput).hide();

            if (tempInput.disabled) {
                supported = false;
            }
        }
        catch (ex) {
            supported = false;
        }

        return supported;
    }

    //only way to test for Filesystem API support since webkit does not expose the DataTransfer interface
    function isChrome21OrHigher() {
        return qq.chrome() &&
            navigator.userAgent.match(/Chrome\/[2][1-9]|Chrome\/[3-9][0-9]/) !== undefined;
    }

    //only way to test for complete Clipboard API support at this time
    function isChrome14OrHigher() {
        return qq.chrome() &&
            navigator.userAgent.match(/Chrome\/[1][4-9]|Chrome\/[2-9][0-9]/) !== undefined;
    }

    //Ensure we can send cross-origin `XMLHttpRequest`s
    function isCrossOriginXhrSupported() {
        if (window.XMLHttpRequest) {
            var xhr = qq.createXhrInstance();

            //Commonly accepted test for XHR CORS support.
            return xhr.withCredentials !== undefined;
        }

        return false;
    }

    //Test for (terrible) cross-origin ajax transport fallback for IE9 and IE8
    function isXdrSupported() {
        return window.XDomainRequest !== undefined;
    }

    // CORS Ajax requests are supported if it is either possible to send credentialed `XMLHttpRequest`s,
    // or if `XDomainRequest` is an available alternative.
    function isCrossOriginAjaxSupported() {
        if (isCrossOriginXhrSupported()) {
            return true;
        }

        return isXdrSupported();
    }

    function isFolderSelectionSupported() {
        // We know that folder selection is only supported in Chrome via this proprietary attribute for now
        return document.createElement('input').webkitdirectory !== undefined;
    }


    supportsUploading = testSupportsFileInputElement();

    supportsAjaxFileUploading = supportsUploading && qq.isXhrUploadSupported();

    supportsFolderDrop = supportsAjaxFileUploading && isChrome21OrHigher();

    supportsChunking = supportsAjaxFileUploading && qq.isFileChunkingSupported();

    supportsResume = supportsAjaxFileUploading && supportsChunking && qq.areCookiesEnabled();

    supportsUploadViaPaste = supportsAjaxFileUploading && isChrome14OrHigher();

    supportsUploadCors = supportsUploading && (window.postMessage !== undefined || supportsAjaxFileUploading);

    supportsDeleteFileCorsXhr = isCrossOriginXhrSupported();

    supportsDeleteFileXdr = isXdrSupported();

    supportsDeleteFileCors = isCrossOriginAjaxSupported();

    supportsFolderSelection = isFolderSelectionSupported();


    return {
        uploading: supportsUploading,
        ajaxUploading: supportsAjaxFileUploading,
        fileDrop: supportsAjaxFileUploading, //NOTE: will also return true for touch-only devices.  It's not currently possible to accurately test for touch-only devices
        folderDrop: supportsFolderDrop,
        chunking: supportsChunking,
        resume: supportsResume,
        uploadCustomHeaders: supportsAjaxFileUploading,
        uploadNonMultipart: supportsAjaxFileUploading,
        itemSizeValidation: supportsAjaxFileUploading,
        uploadViaPaste: supportsUploadViaPaste,
        progressBar: supportsAjaxFileUploading,
        uploadCors: supportsUploadCors,
        deleteFileCorsXhr: supportsDeleteFileCorsXhr,
        deleteFileCorsXdr: supportsDeleteFileXdr, //NOTE: will also return true in IE10, where XDR is also supported
        deleteFileCors: supportsDeleteFileCors,
        canDetermineSize: supportsAjaxFileUploading,
        folderSelection: supportsFolderSelection
    }

}());
