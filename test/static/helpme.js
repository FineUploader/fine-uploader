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
        },

        setupFileTests: function() {
            var testUploadEndpoint = "/test/upload",
                xhr,
                oldWrapCallbacks,
                requests;

            beforeEach(function() {
                mockFormData();

                requests = [];
                oldWrapCallbacks = qq.FineUploaderBasic.prototype._wrapCallbacks;

                // "Turn off" wrapping of callbacks that squelches errors.  We need AssertionErrors in callbacks to bubble.
                qq.FineUploaderBasic.prototype._wrapCallbacks = function() {};
            });

            afterEach(function() {
                unmockXhr();
                unmockFormData();

                qq.FineUploaderBasic.prototype._wrapCallbacks = oldWrapCallbacks;
            });

            function mockXhr() {
                xhr = sinon.useFakeXMLHttpRequest();
                xhr.onCreate = function(req) {
                    requests.push(req);
                };
            }

            function unmockXhr() {
                xhr && xhr.restore && xhr.restore();
            }

            return {
                getRequests: function() {
                    return requests;
                },

                mockXhr: mockXhr
            };
        }
    };

    return obj;
})();
