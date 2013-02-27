$(document).ready(function() {
    var errorHandler = function(event, id, fileName, reason) {
        qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
    };

    var fileNum = 0;

    $('#basicUploadSuccessExample').fineUploader({
        debug: true,
//        cors: {
//            expected: true
//        },
        request: {
            endpoint: "/upload/receiver",
            paramsInBody: true
//            params: {
//                test: 'one',
//                blah: 'foo',
//                bar: {
//                    one: '1',
//                    two: '2',
//                    three: {
//                        foo: 'bar'
//                    }
//                },
//                fileNum: function() {
//                    fileNum+=1;
//                    return fileNum;
//                }
//            }
        },
        chunking: {
            enabled: true
        },
//        resume: {
//            enabled: true
//        },
        retry: {
            enableAuto: true,
            showButton: true
        },
        deleteFile: {
            enabled: true,
            endpoint: '/upload/receiver',
            forceConfirm: true,
            params: {foo: "bar"}
        },
        display: {
            fileSizeOnSubmit: true
        }
    })
        .on('error', errorHandler)
        .on('uploadChunk resume', function(event, id, fileName, chunkData) {
            qq.log('on' + event.type + ' -  ID: ' + id + ", FILENAME: " + fileName + ", PARTINDEX: " + chunkData.partIndex + ", STARTBYTE: " + chunkData.startByte + ", ENDBYTE: " + chunkData.endByte + ", PARTCOUNT: " + chunkData.totalParts);
        })
        .on("upload", function(event, id, filename) {
            $(this).fineUploader('setParams', {"hey": "ho"}, id);
        });

    $('#manualUploadModeExample').fineUploader({
        autoUpload: false,
        uploadButtonText: "Select Files",
        request: {
            endpoint: "/upload/receiver"
        },
        display: {
            fileSizeOnSubmit: true
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
        },
        retry: {
            enableAuto: true,
            showButton: true
        }
    }).on('error', errorHandler);


    $('#uploadWithVariousOptionsExample').fineUploader({
        multiple: false,
        request: {
            endpoint: "/upload/receiver"
        },
        validation: {
            allowedExtensions: ['jpeg', 'jpg', 'txt'],
            sizeLimit: 50000,
            minSizeLimit: 2000
        },
        text: {
            uploadButton: "Click Or Drop"
        },
        display: {
            fileSizeOnSubmit: true
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
