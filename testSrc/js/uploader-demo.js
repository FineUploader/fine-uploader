$(document).ready(function() {
    var uploader = new qq.FineUploader({
        element: $('#basicUploadSuccessExample')[0],
        debug: true,
        request: {
            endpoint: "/upload/receiver"
        },
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        }
    });



    var uploader2 = new qq.FineUploader({
        element: $('#manualUploadModeExample')[0],
        autoUpload: false,
        uploadButtonText: "Select Files",
        request: {
            endpoint: "/upload/receiver"
        },
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        }
    });

    $('#triggerUpload').click(function() {
        uploader2.uploadStoredFiles();
    });


    var uploader3 = new qq.FineUploader({
        element: $('#basicUploadFailureExample')[0],
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        },
        request: {
            endpoint: "/upload/receiver",
            params: {"generateError": true}
        },
        failedUploadTextDisplay: {
            mode: 'custom',
            maxChars: 5
        }
    });


    var uploader4 = new qq.FineUploader({
        element: $('#uploadWithVariousOptionsExample')[0],
        multiple: false,
        request: {
            endpoint: "/upload/receiver",
        },
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

    uploader5 = new qq.FineUploaderBasic({
        multiple: false,
        autoUpload: false,
        button: $("#fubButton")[0],
        request: {
            endpoint: "/upload/receiver",
        },
        callbacks: {
            onError: function(id, fileName, reason) {
                console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
            }
        },
        button: $('#fubUploadButton')[0]
    });
});
