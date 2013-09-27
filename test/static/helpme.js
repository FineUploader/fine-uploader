/**
 * A variety of helper functions to help me.
 */

var helpme = (function () {

    var obj = {
    
        // create a BLOB object
        createBlob: function (data) {
            var blobby;
            
            if (!data) {
                data  = ["Hello, world!"];
            }

            blobby = new Blob(data);

            return blobby;
        },
    
        createUploadData: function (onStatusChange) {
            return new qq.UploadData({
                getUuid: function(id) {
                    return id + "_uuid";
                },

                getName: function(id) {
                    return id + "_name";
                },

                getSize: function(id) {
                    return 1980;
                },

                onStatusChange: function(id, oldStatus, newStatus) {
                    if (onStatusChange !== undefined) {
                        onStatusChange(id, oldStatus, newStatus);
                    }
                }
            });
        },

        createFineUploader: function (options, request, validation) {
            var defaults = {
                debug: true,
                button: null,
                multiple: true,
                maxConnections: 3,
                disableCancelForFormUploads: false,
                autoUpload: true
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
