$(document).ready(function() {
    var uploader = new qq.FileUploader({
        element: $('#basicUploadSuccessExample')[0],
        endpoint: "/upload/receiver",
        debug: true,
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        }
    });



    var uploader2 = new qq.FileUploader({
        element: $('#manualUploadModeExample')[0],
        endpoint: "/upload/receiver",
        autoUpload: false,
        uploadButtonText: "Select Files",
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        }
    });

    $('#triggerUpload').click(function() {
        uploader2.uploadStoredFiles();
    });


    var uploader3 = new qq.FileUploader({
        element: $('#basicUploadFailureExample')[0],
        endpoint: "/upload/receiver",
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        },
        params: {"generateError": true},
        failedUploadTextDisplay: {
            mode: 'custom',
            maxChars: 5
        }
    });


    var uploader4 = new qq.FileUploader({
        element: $('#uploadWithVariousOptionsExample')[0],
        endpoint: "/upload/receiver",
        multiple: false,
        validation: {
            allowedExtensions: ['jpeg', 'jpg', 'txt'],
            sizeLimit: 50000
        },
        text: {
            uploadButton: "Click Or Drop"
        },
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        }
    });

    uploader5 = new qq.FileUploaderBasic({
        multiple: false,
        autoUpload: false,
        endpoint: "/upload/receiver",
        button: $("#fubButton")[0],
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        },
        button: $('#fubUploadButton')[0]
    });
});
