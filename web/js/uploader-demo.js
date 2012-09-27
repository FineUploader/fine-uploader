$(document).ready(function() {
    var uploader = new qq.FileUploader({
        element: $('#basicUploadSuccessExample')[0],
        action: "/upload/receiver",
        debug: true,
        onError: function(id, fileName, reason) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        },
        failedUploadTextDisplay: {
            mode: 'custom',
            maxChars: 4,
            responseProperty: 'error',
            enableTooltip: true
        }
    });



    var uploader2 = new qq.FileUploader({
        element: $('#manualUploadModeExample')[0],
        action: "/upload/receiver",
        autoUpload: false,
        uploadButtonText: "Select Files",
        onError: function(id, fileName, reason) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        }
    });

    $('#triggerUpload').click(function() {
        uploader2.uploadStoredFiles();
    });


    var uploader3 = new qq.FileUploader({
        element: $('#basicUploadFailureExample')[0],
        action: "/upload/receiver",
        onError: function(id, fileName, reason) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        }
    });


    var uploader4 = new qq.FileUploader({
        element: $('#uploadWithVariousOptionsExample')[0],
        action: "/upload/receiver",
        multiple: false,
        allowedExtensions: ['jpeg', 'jpg', 'txt'],
        sizeLimit: 50000,
        uploadButtonText: "Click Or Drop",
        onError: function(id, fileName, reason) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        }
    });

    uploader5 = new qq.FileUploaderBasic({
        multiple: false,
        autoUpload: false,
        action: "/upload/receiver",
        button: $("#fubButton")[0],
        onError: function(id, fileName, reason) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        },
        button: $('#fubUploadButton')[0]
    });
});
