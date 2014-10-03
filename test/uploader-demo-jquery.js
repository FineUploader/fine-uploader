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
                    endpoint: "http://fineuploaderdev2.blob.core.windows.net/dev"
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
                    enabled: true,
                    concurrent: {
                        enabled: true
                    }
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
                    fileSizeOnSubmit: true
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
                        enabled: true,
                        concurrent: {
                            enabled: true
                        }
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
                        fileSizeOnSubmit: true
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
                        $(this).fineUploader('setParams', {
                            "hey": "hi ɛ $ hmm \\ hi",
                            "ho": "foobar"
                        }, id);
                    }).on('statusChange', function(event, id, oldS, newS) {
                        qq.log("id: " + id + " " + newS);
                    })
            .on("totalProgress", function(event, loaded, total) {
//                qq.log(loaded + "/" + total);
            })
            .on("complete", function(event, id, name, response, xhr) {
                                qq.log(response);
                            });


        $('#manual-example').fineUploader({
            autoUpload: false,
            debug: true,
            uploadButtonText: "Select Files",
            display: {
                fileSizeOnSubmit: true
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
                enabled: true,
                concurrent: {
                    enabled: true
                },
                success: {
                    endpoint: "/upload/receiver?done"
                }
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
//            scaling: {
//                sizes: [{name: "small", maxSize: 300}, {name: "medium", maxSize: 600}]
//            }
        }).on('error', errorHandler)
            .on("resume", function() {
//                return false;
            })
            .on("progress", function(event, id, name, loaded, total) {
//                qq.log(loaded + "/" + total);
            })
            .on("complete", function(event, id, name, response, xhr) {
                                qq.log(response);
                            });

        $('#triggerUpload').click(function() {
            return $('#manual-example').fineUploader("uploadStoredFiles");
        });

        $('#validation-example').fineUploader({
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

        $('#failure-example').fineUploader({
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
