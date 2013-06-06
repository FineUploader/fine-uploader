/**
 * A variety of helper functions to help me.
 */

var helpme = (function () {

    var obj = {
    
        // create a BLOB object
        createBlob: function (data) {
            var data, blobby;
            
            if (!data)
                data  = ["Hello, world!"];

            blobby = new Blob(data);

            return blobby;
        },
    
        createFineUploader: function (options, request, validation) {
            var defaults = {
                debug: true,
                button: null,
                multiple: true,
                maxConnections: 3,
                disableCancelForFormUploads: false,
                autoUpload: true,
            };
            var default_request = {
                endpoint: "http://localhost:3000/upload",
                params: {},
                paramsInBody: true,
                customHeaders: {},
                forceMultipart: true,
                inputName: 'qqfile',
                uuidName: 'qquuid',
                totalFileSizeName: 'qqtotalfilesize'
            };
            var default_validation = {
                allowedExtensions: [],
                acceptFiles: null,
                sizeLimit: 0,
                minSizeLimit: 0,
                itemLimit: 0,
                stopOnFirstInvalidFile: true
            };
            var default_retry = {
            };
                   
            var uploader = new qq.FineUploader(options); 
        }
    };

    return obj;
})();
