$(document).ready(function() {
    var errorHandler = function(event, id, fileName, reason) {
        qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
    };
    var validateHandler = function(event, fileData, isBatch) {
        if (isBatch) {
            qq.log("Handling batch validate call...");
            for (var i in fileData) {
                qq.log("name: " + fileData[i].name + ", size: " + fileData[i].size);
                if (fileData[i].name.indexOf('a') >= 0) {
                    return false;
                }
            }
            qq.log("...finished handling batch validate call");
        }
        else {
            qq.log("Single file validate call - name: " + fileData.name + ", size: " + fileData.size);
            if (fileData.name.indexOf('a') >= 0) {
                return false;
            }
        }
    };


    $('#basicUploadSuccessExample').fineUploader({
        debug: true,
        request: {
            endpoint: "/upload/receiver"
        }
    })
        .on('error', errorHandler)
        .on("validate", validateHandler);


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
            endpoint: "/upload/receiver"
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
