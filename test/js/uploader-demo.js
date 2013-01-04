$(document).ready(function() {
    var errorHandler = function(event, id, fileName, reason) {
        qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
    };

    var uploader = new qq.FineUploader({
        element: $('#basicUploadSuccessExample')[0],
        debug: true,
        request: {
            endpoint: "/upload/receiver"
        },
        callbacks: {
            onError: errorHandler
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
            onError: errorHandler
        }
    });

    $('#triggerUpload').click(function() {
        uploader2.uploadStoredFiles();
    });


    var uploader3 = new qq.FineUploader({
        element: $('#basicUploadFailureExample')[0],
        callbacks: {
            onError: errorHandler
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
            endpoint: "/upload/receiver"
        },
        validation: {
            allowedExtensions: ['jpeg', 'jpg', 'txt'],
            sizeLimit: 50000
        },
        text: {
            uploadButton: "Click Or Drop"
        },
        callbacks: {
            onError: errorHandler
        }
    });

    uploader5 = new qq.FineUploaderBasic({
        multiple: false,
        autoUpload: false,
        button: $("#fubUploadButton")[0],
        request: {
            endpoint: "/upload/receiver"
        },
        callbacks: {
            onError: errorHandler
        }
    });
});
