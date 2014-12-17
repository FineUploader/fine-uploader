qq(window).attach("load", function() {
    "use strict";

    var errorHandler = function(event, id, fileName, reason) {
            return qq.log("id: " + id + ", fileName: " + fileName + ", reason: " + reason);
        },
        azureUploader, s3Uploader, manualUploader, validatingUploader, failingUploader;

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

    s3Uploader = new qq.s3.FineUploader({
        element: document.getElementById("s3-example"),
        debug: true,
        request: {
            endpoint: "http://fineuploadertest.s3.amazonaws.com",
            accessKey: "AKIAJEQ4NDFBCZAMWGUQ"
        },
        signature: {
            endpoint: "/upload/s3/signature"
        },
        uploadSuccess: {
            endpoint: "/upload/s3/success"
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
            endpoint: "/upload/s3/files",
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


    manualUploader = new qq.FineUploader({
        element: document.getElementById("manual-example"),
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
            endpoint: "/upload/receiver",
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
            successEndpoint: "/upload/receiver?done"
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
        },
        scaling: {
            sizes: [{name: "small", maxSize: 300}, {name: "medium", maxSize: 600}]
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

    qq(document.getElementById("triggerUpload")).attach("click", function() {
        manualUploader.uploadStoredFiles();
    });

    validatingUploader = new qq.FineUploader({
        element: document.getElementById("validation-example"),
        multiple: false,
        request: {
            endpoint: "/upload/receiver"
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

    failingUploader = new qq.FineUploader({
        element: document.getElementById("failure-example"),
        request: {
            endpoint: "/upload/receiver",
            params: {
                generateError: "true"
            }
        },
        debug: true,
        failedUploadTextDisplay: {
            mode: "custom",
            maxChars: 5
        },
        retry: {
            enableAuto: true,
            showButton: true
        },
        callbacks: {
            onError: errorHandler
        }
    });
});
