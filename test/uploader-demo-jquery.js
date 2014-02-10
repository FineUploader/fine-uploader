(function() {
    $(function() {
        var errorHandler;
        errorHandler = function(event, id, fileName, reason, xhr) {
            return qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        };

        if (qq.supportedFeatures.ajaxUploading) {
            $('#azure-example').fineUploaderAzure({
                debug: true,
                request: {
                    endpoint: "http://fineuploaderdev.blob.core.windows.net/dev"
                },
                cors: {
                    expected: true
                },
                signature: {
                    endpoint: 'http://192.168.56.101:8080/sas'
                },
                uploadSuccess: {
                    endpoint: 'http://192.168.56.101:8080/success'
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
                },
                deleteFile: {
                    enabled: true
                },
                display: {
                    fileSizeOnSubmit: true,
                    prependFiles: true
                },
                paste: {
                    targetElement: $(document)
                },
                thumbnails: {
                    placeholders: {
                        waitingPath: "/client/placeholders/waiting-generic.png",
                        notAvailablePath: "/client/placeholders/not_available-generic.png"
                    }
                }
            }).on('error', errorHandler).on("upload", function(event, id, filename) {
//                    $(this).fineUploader('setParams', {
//                        "hey": "hi ɛ $ hmm \\ hi",
//                        "ho": "foobar"
//                    }, id);
                }).on('statusChange', function(event, id, oldS, newS) {
                    qq.log("id: " + id + " " + newS);
                }).on("complete", function(event, id, name, response, xhr) {
                    qq.log(response);
                });

            $("#basicUploadSuccessExample > div > div > input[name='qqfile']").hover(function(event) {
                return event.preventDefault();
            });

            $("#basicUploadSuccessExample > div > .qq-upload-button").hover(function(event) {
                return event.preventDefault();
            });
        }


        $('#s3-example').fineUploaderS3({
                    debug: true,
                    request: {
                        endpoint: "http://fineuploadertest.s3.amazonaws.com",
                        accessKey: 'AKIAJEQ4NDFBCZAMWGUQ'
                    },
                    signature: {
                        endpoint: '/upload/s3/signature'
                    },
                    uploadSuccess: {
                        endpoint: '/upload/s3/success'
                    },
                    iframeSupport: {
                        localBlankPagePath: 'success.html'
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
                    },
                    deleteFile: {
                        enabled: true,
                        endpoint: '/upload/s3/files',
                        forceConfirm: true,
                        params: {
                            foo: "bar"
                        }
                    },
                    failedUploadTextDisplay: {
                        mode: 'custom'
                    },
                    display: {
                        fileSizeOnSubmit: true,
                        prependFiles: true
                    },
                    paste: {
                        targetElement: $(document)
                    },
                    thumbnails: {
                        placeholders: {
                            waitingPath: "/client/placeholders/waiting-generic.png",
                            notAvailablePath: "/client/placeholders/not_available-generic.png"
                        }
                    },
                    validation: {
                        itemLimit: 3
                    }
                }).on('error', errorHandler).on("upload", function(event, id, filename) {
                        $(this).fineUploader('setParams', {
                            "hey": "hi ɛ $ hmm \\ hi",
                            "ho": "foobar"
                        }, id);
                    }).on('statusChange', function(event, id, oldS, newS) {
                        qq.log("id: " + id + " " + newS);
                    });

        $('#manualUploadModeExample').fineUploader({
            autoUpload: false,
            debug: true,
            uploadButtonText: "Select Files",
            display: {
                fileSizeOnSubmit: true,
                prependFiles: true
            },
            request: {
                endpoint: "/upload/receiver"
            },
            deleteFile: {
                enabled: true,
                endpoint: '/upload/receiver',
                forceConfirm: true,
                params: {
                    foo: "bar"
                }
            },
            chunking: {
                enabled: true
            },
            resume: {
                enabled: true
            },
            retry: {
                enableAuto: true
            },
            thumbnails: {
                placeholders: {
                    waitingPath: "/client/placeholders/waiting-generic.png",
                    notAvailablePath: "/client/placeholders/not_available-generic.png"
                }
            }
        }).on('error', errorHandler);
        $('#triggerUpload').click(function() {
            return $('#manualUploadModeExample').fineUploader("uploadStoredFiles");
        });

        $('#uploadWithVariousOptionsExample').fineUploader({
            multiple: false,
            request: {
                endpoint: "/upload/receiver"
            },
            debug: true,
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

        $('#basicUploadFailureExample').fineUploader({
            request: {
                endpoint: "/upload/receiver",
                params: {
                    "generateError": "true"
                }
            },
            debug: true,
            failedUploadTextDisplay: {
                mode: 'custom',
                maxChars: 5
            },
            retry: {
                enableAuto: true,
                showButton: true
            }
        }).on('error', errorHandler);


    });

}).call(this);
