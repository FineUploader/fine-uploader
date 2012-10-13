$(document).ready(function() {
    var errorHandler = function(event, id, fileName, reason) {
        if (window.console) {
            console.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        }
    };


    $('#basicUploadSuccessExample').fineUploader({
        debug: true,
        request: {
            endpoint: "/upload/receiver"
        }
    }).on('error', errorHandler);


    $('#manualUploadModeExample').fineUploader({
        autoUpload: false,
        uploadButtonText: "Select Files",
        request: {
            endpoint: "/upload/receiver"
        }
    }).on('error', errorHandler);

    $('#triggerUpload').click(function() {
        $('#manualUploadModeExample').fineUploader("uploadStoredFiles");
    });


    $('#basicUploadFailureExample').fineUploader({
        request: {
            endpoint: "/upload/receiver",
            params: {"generateError": true}
        },
        failedUploadTextDisplay: {
            mode: 'custom',
            maxChars: 5
        }
    }).on('error', errorHandler);


    $('#uploadWithVariousOptionsExample').fineUploader({
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
        }
    }).on('error', errorHandler);


    $('#fubExample').fineUploader({
        uploaderType: 'basic',
        multiple: false,
        autoUpload: false,
        button: $("#fubUploadButton"),
        request: {
            endpoint: "/upload/receiver"
        }
    }).on('error', errorHandler);
});
