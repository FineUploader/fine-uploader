$ ->
    errorHandler = (event, id, fileName, reason, xhr) ->
        qq.log "id: #{id}, fileName: #{fileName}, reason: #{reason}"

    $('#basicUploadSuccessExample').fineUploader(
        debug: true
        request:
            endpoint: "/upload/receiver"
            paramsInBody: true
        chunking:
            enabled: true
        resume:
            enabled: true
        retry:
            enableAuto: true
            showButton: true
        deleteFile:
            enabled: true
            endpoint: '/upload/receiver'
            forceConfirm: true
            params:
                foo: "bar"
        display:
            fileSizeOnSubmit: true
        paste:
            targetElement: $(document)
    )
        .on('error', errorHandler)
        .on "upload", (event, id, filename) ->
            $(this).fineUploader 'setParams', {"hey": "ho"}, id


    $('#manualUploadModeExample').fineUploader(
        autoUpload: false
        debug: true
        uploadButtonText: "Select Files"
        request:
            endpoint: "/upload/receiver"
        display:
            fileSizeOnSubmit: true
    )
        .on 'error', errorHandler

    $('#triggerUpload').click ->
        $('#manualUploadModeExample').fineUploader "uploadStoredFiles"


    $('#basicUploadFailureExample').fineUploader(
        request:
            endpoint: "/upload/receiver"
            params: "generateError": "true"
        debug: true
        failedUploadTextDisplay:
            mode: 'custom'
            maxChars: 5
        retry:
            enableAuto: true
            showButton: true
    )
        .on 'error', errorHandler


    $('#uploadWithVariousOptionsExample').fineUploader(
        multiple: false
        request:
            endpoint: "/upload/receiver"
        debug: true
        validation:
            allowedExtensions: ['jpeg', 'jpg', 'txt']
            sizeLimit: 50000
            minSizeLimit: 2000
        text:
            uploadButton: "Click Or Drop"
        display:
            fileSizeOnSubmit: true
    )
        .on 'error', errorHandler


    $('#fubExample').fineUploader(
        uploaderType: 'basic'
        multiple: false
        debug: true
        autoUpload: false
        button: $("#fubUploadButton")
        request:
            endpoint: "/upload/receiver"
    )
        .on 'error', errorHandler
