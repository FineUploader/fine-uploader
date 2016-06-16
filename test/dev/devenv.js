qq(window).attach("load", function() {
    "use strict";

    var errorHandler = function(id, fileName, reason) {
            return qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        },
        azureUploader, s3Uploader, manualUploader, validatingUploader, failingUploader;

    manualUploader = new qq.FineUploader({
        element: document.getElementById("manual-example"),
        autoUpload: false,
        debug: false,
        uploadButtonText: "Select Files",
        display: {
            fileSizeOnSubmit: true
        },
        request: {
            endpoint: "/test/dev/handlers/vendor/fineuploader/php-traditional-server/endpoint.php"
        },
        deleteFile: {
            enabled: true,
            endpoint: "/test/dev/handlers/vendor/fineuploader/php-traditional-server/endpoint.php",
            forceConfirm: true,
            params: {
                foo: "bar"
            }
        },
        chunking: {
            enabled: true,
            concurrent: {
                enabled: false
            },
            success: {
                endpoint: "/test/dev/handlers/vendor/fineuploader/php-traditional-server/endpoint.php?done"
            }
        },
        resume: {
            enabled: true
        },
        retry: {
            enableAuto: true
        },
        thumbnails: {
            customResizer: !qq.ios() && function(resizeInfo) {
                var promise = new qq.Promise();

                pica.resizeCanvas(resizeInfo.sourceCanvas, resizeInfo.targetCanvas, {}, function() {
                    promise.success();
                })

                return promise;
            },
            placeholders: {
                waitingPath: "/client/placeholders/waiting-generic.png",
                notAvailablePath: "/client/placeholders/not_available-generic.png"
            }
        },
        scaling: {
            customResizer: !qq.ios() && function(resizeInfo) {
                var promise = new qq.Promise();

                pica.resizeCanvas(resizeInfo.sourceCanvas, resizeInfo.targetCanvas, {}, function() {
                    promise.success();
                })

                return promise;
            },
            sizes: [{name: "small", maxSize: 800}]
        },
        session: {
            //endpoint: "/test/dev/handlers/vendor/fineuploader/php-traditional-server/endpoint.php?initial"
        },
        callbacks: {
            onError: errorHandler,
            onUpload: function (id, filename) {
                this.setParams({
                    "hey": "hi ɛ $ hmm \\ hi",
                    "ho": "foobar"
                }, id);

            }
        }
    });

    qq(document.getElementById("triggerUpload")).attach("click", function() {
        manualUploader.uploadStoredFiles();
    });


    s3Uploader = new qq.s3.FineUploader({
        element: document.getElementById("s3-example"),
        debug: true,
        request: {
            endpoint: "http://fineuploadertest.s3.amazonaws.com",
            accessKey: "AKIAIXVR6TANOGNBGANQ"
        },
        signature: {
            endpoint: "/test/dev/handlers/vendor/fineuploader/php-s3-server/endpoint.php"
        },
        uploadSuccess: {
            endpoint: "/test/dev/handlers/vendor/fineuploader/php-s3-server/endpoint.php?success"
        },
        iframeSupport: {
            localBlankPagePath: "success.html"
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
            endpoint: "/test/dev/handlers/vendor/fineuploader/php-s3-server/endpoint.php",
            forceConfirm: true,
            params: {
                foo: "bar"
            }
        },
        failedUploadTextDisplay: {
            mode: "custom"
        },
        display: {
            fileSizeOnSubmit: true
        },
        paste: {
            targetElement: document,
            promptForName: true
        },
        thumbnails: {
            placeholders: {
                waitingPath: "/client/placeholders/waiting-generic.png",
                notAvailablePath: "/client/placeholders/not_available-generic.png"
            }
        },
        workarounds: {
            ios8BrowserCrash: false
        },
        callbacks: {
            onError: errorHandler,
            onUpload: function(id, filename) {
                this.setParams({
                    "hey": "hi ɛ $ hmm \\ hi",
                    "ho": "foobar"
                }, id);

            },
            onStatusChange: function(id, oldS, newS) {
                qq.log("id: " + id + " " + newS);
            },
            onComplete: function(id, name, response) {
                qq.log(response);
            }
        }
    });

    if (qq.supportedFeatures.ajaxUploading) {
        azureUploader = new qq.azure.FineUploader({
            element: document.getElementById("azure-example"),
            debug: true,
            request: {
                endpoint: "http://fineuploaderdev2.blob.core.windows.net/dev"
            },
            cors: {
                expected: true
            },
            signature: {
                endpoint: "http://192.168.56.101:8080/sas"
            },
            uploadSuccess: {
                endpoint: "http://192.168.56.101:8080/success"
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
                targetElement: document
            },
            thumbnails: {
                placeholders: {
                    waitingPath: "/client/placeholders/waiting-generic.png",
                    notAvailablePath: "/client/placeholders/not_available-generic.png"
                }
            },
            callbacks: {
                onError: errorHandler,
                onUpload: function (id, filename) {
                    this.setParams({
                        "hey": "hi ɛ $ hmm \\ hi",
                        "ho": "foobar"
                    }, id);

                },
                onStatusChange: function (id, oldS, newS) {
                    qq.log("id: " + id + " " + newS);
                },
                onComplete: function (id, name, response) {
                    qq.log(response);
                }
            }
        });
    }

    failingUploader = new qq.FineUploader({
        element: document.getElementById("failure-example"),
        request: {
            endpoint: "/test/dev/handlers/traditional/endpoint.php",
            params: {
                generateError: "true"
            }
        },
        debug: true,
        failedUploadTextDisplay: {
            mode: "custom"
        },
        retry: {
            enableAuto: true,
            showButton: true
        },
        thumbnails: {
            placeholders: {
                waitingPath: "/client/placeholders/waiting-generic.png",
                notAvailablePath: "/client/placeholders/not_available-generic.png"
            }
        },
        callbacks: {
            onError: errorHandler
        }
    });

    validatingUploader = new qq.FineUploader({
        element: document.getElementById("validation-example"),
        multiple: false,
        request: {
            endpoint: "/test/dev/handlers/traditional/endpoint.php"
        },
        debug: true,
        validation: {
            allowedExtensions: ["jpeg", "jpg", "txt"],
            sizeLimit: 50000,
            minSizeLimit: 2000
        },
        text: {
            uploadButton: "Click Or Drop"
        },
        display: {
            fileSizeOnSubmit: true
        },
        callbacks: {
            onError: errorHandler
        }
    });
});