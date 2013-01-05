$(document).ready(function() {
    var errorHandler = function(event, id, fileName, reason) {
        qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
    };

    var fileNum = 0;

    $('#basicUploadSuccessExample').fineUploader({
        debug: true,
        request: {
            endpoint: "/upload/receiver",
            paramsInBody: false,
            params: {
                test: 'one',
                blah: 'foo',
                bar: {
                    one: '1',
                    two: '2',
                    three: {
                        foo: 'bar'
                    }
                },
                fileNum: function() {
                    fileNum+=1;
                    return fileNum;
                }
            }
        },
        chunking: {
            enabled: true
        },
        resume: {
            enabled: true
        },
        retry: {
            enableAuto: true,
            showButton: true
        }
    })
        .on('error', errorHandler)
        .on('uploadChunk resume', function(event, id, fileName, chunkData) {
            qq.log('on' + event.type + ' -  ID: ' + id + ", FILENAME: " + fileName + ", PARTINDEX: " + chunkData.partIndex + ", STARTBYTE: " + chunkData.startByte + ", ENDBYTE: " + chunkData.endByte + ", PARTCOUNT: " + chunkData.totalParts);
        });

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
