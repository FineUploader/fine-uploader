/* global sinon:true */
// The following is apparently required to mock XHR in some versions of IE
function XMLHttpRequest() {} // jshint ignore:line
XMLHttpRequest = sinon.xhr.XMLHttpRequest || undefined; // jshint ignore:line

/* globals qq, beforeEach, afterEach, sinon, mockFormData, unmockFormData */
var helpme = (function () {
    "use strict";

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
                inputName: "qqfile",
                uuidName: "qquuid",
                totalFileSizeName: "qqtotalfilesize"
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
                requests;

            beforeEach(function() {
                mockFormData();

                requests = [];
            });

            afterEach(function() {
                unmockXhr();
                unmockFormData();
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
