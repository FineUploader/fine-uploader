// Fine Uploader's modules
//
// shamelessly inspired by:
// https://github.com/angular/angular.js/blob/master/angularFiles.js
/* jshint node: true */
var //dependencies
    _  = require("underscore"),

    fineUploaderModules = {
        // Pre-defined forumlae
        fuTraditional: [
            "@fuSrcCore",
            "@fuSrcUi",
            "@fuSrcTraditional",
            "@fuSrcModules",
            "@fuUiModules"
        ],
        fuS3: [
            "@fuSrcCore",
            "@fuSrcUi",
            "@fuSrcS3",
            "@fuSrcS3Ui",
            "@fuSrcModules",
            "@fuUiModules",
            "@cryptoJs"
        ],
        fuAzure: [
            "@fuSrcCore",
            "@fuSrcUi",
            "@fuSrcAzure",
            "@fuSrcAzureUi",
            "@fuSrcModules",
            "@fuUiModules"
        ],
        fuTraditionalJquery: [
            "@fuTraditional",
            "@fuSrcJquery",
            "@fuSrcJqueryDnd"
        ],
        fuS3Jquery: [
            "@fuS3",
            "@fuSrcS3Jquery",
            "@fuSrcJqueryDnd"
        ],
        fuAzureJquery: [
            "@fuAzure",
            "@fuSrcAzureJquery",
            "@fuSrcJqueryDnd"
        ],
        fuAll: [
            "@fuTraditionalJquery",
            "@fuSrcS3",
            "@fuSrcS3Ui",
            "@fuSrcS3Jquery",
            "@fuSrcAzure",
            "@fuSrcAzureUi",
            "@fuSrcAzureJquery",
            "@cryptoJs"
        ],

        // Groups
        fuSrcModules: [
            "@fuPasteModule",
            "@fuDndModule",
            "@fuDeleteFileModule",
            "@fuImagePreviewModule",
            "@fuImageValidationModule",
            "@fuSessionModule",
            "@fuFormSupportModule",
            "@fuScaling",
            "@fuTotalProgress"
        ],

        fuUiModules: [
            "@fuUiEvents",
            "@fuEditFilenameModule"
        ],

        // Source
        fuSrcCore: [
            "client/js/util.js",
            "client/js/error/error.js",
            "client/js/version.js",
            "client/js/features.js",
            "client/js/promise.js",
            "client/js/blob-proxy.js",
            "client/js/button.js",
            "client/js/upload-data.js",
            "client/js/uploader.basic.api.js",
            "client/js/uploader.basic.js",
            "client/js/ajax.requester.js",
            "client/js/upload-handler/upload.handler.js",
            "client/js/upload-handler/upload.handler.controller.js",
            "client/js/upload-handler/form.upload.handler.js",
            "client/js/upload-handler/xhr.upload.handler.js",
            "client/js/window.receive.message.js" //TODO Remove this - it is only applicable to traditional endpoints at this time
        ],
        fuSrcUi: [
            "client/js/uploader.api.js",
            "client/js/uploader.js",
            "client/js/templating.js"
        ],
        fuSrcTraditional: [
            "client/js/traditional/traditional.form.upload.handler.js",
            "client/js/traditional/traditional.xhr.upload.handler.js",
            "client/js/traditional/all-chunks-done.ajax.requester.js"
        ],
        fuSrcJquery: [
            "client/js/jquery-plugin.js"
        ],
        fuSrcS3: [
            "client/js/s3/util.js",
            "client/js/non-traditional-common/*.js",
            "client/js/s3/uploader.basic.js",
            "client/js/s3/request-signer.js",
            "client/js/uploadsuccess.ajax.requester.js",
            "client/js/s3/multipart.initiate.ajax.requester.js",
            "client/js/s3/multipart.complete.ajax.requester.js",
            "client/js/s3/multipart.abort.ajax.requester.js",
            "client/js/s3/s3.xhr.upload.handler.js",
            "client/js/s3/s3.form.upload.handler.js"
        ],
        fuSrcS3Ui: [
            "client/js/s3/uploader.js"
        ],
        fuSrcS3Jquery: [
            "@fuSrcJquery",
            "client/js/s3/jquery-plugin.js"
        ],
        fuSrcAzure: [
            "client/js/azure/util.js",
            "client/js/non-traditional-common/*.js",
            "client/js/azure/uploader.basic.js",
            "client/js/azure/azure.xhr.upload.handler.js",
            "client/js/azure/get-sas.js",
            "client/js/uploadsuccess.ajax.requester.js",
            "client/js/azure/rest/*.js"
        ],
        fuSrcAzureWithFormSupport: [
            "client/js/traditional/handler.form.js",
            "@fuSrcAzure"
        ],
        fuSrcAzureUi: [
            "client/js/azure/uploader.js"
        ],
        fuSrcAzureJquery: [
            "@fuSrcJquery",
            "client/js/azure/jquery-plugin.js"
        ],
        cryptoJs: [
            "client/js/third-party/crypto-js/core.js",
            "client/js/third-party/crypto-js/enc-base64.js",
            "client/js/third-party/crypto-js/hmac.js",
            "client/js/third-party/crypto-js/sha1.js"
        ],
        fuImagePreviewModule: [
            "client/js/image-support/megapix-image.js",
            "client/js/image-support/image.js",
            "client/js/image-support/exif.js",
            "client/js/identify.js"
        ],
        fuImageValidationModule: [
            "client/js/identify.js",
            "client/js/image-support/validation.image.js"
        ],
        fuPasteModule: [
            "client/js/paste.js"
        ],
        fuDndModule: [
            "client/js/dnd.js"
        ],
        fuSrcJqueryDnd: [
            "client/js/jquery-dnd.js"
        ],
        fuDeleteFileModule: [
            "client/js/deletefile.ajax.requester.js"
        ],
        fuUiEvents: [
            "client/js/ui.handler.events.js",
            "client/js/ui.handler.click.filebuttons.js"
        ],
        fuEditFilenameModule: [
            "client/js/ui.handler.click.filename.js",
            "client/js/ui.handler.focusin.filenameinput.js",
            "client/js/ui.handler.focus.filenameinput.js",
            "client/js/ui.handler.edit.filename.js"
        ],
        fuSessionModule: [
            "client/js/session.js",
            "client/js/session.ajax.requester.js"
        ],
        fuFormSupportModule: [
            "client/js/form-support.js"
        ],
        fuScaling: [
            "client/js/image-support/scaler.js",
            "client/js/third-party/ExifRestorer.js"
        ],
        fuTotalProgress: [
            "client/js/total-progress.js"
        ],
        fuIframeXssResponse: [
            "client/js/iframe.xss.response.js"
        ],
        fuExtra: [
            "@fuImages",
            "@fuCss",
            "@fuDocs",
            "@fuTemplates"
        ],
        fuTemplates: [
            "client/html/templates/default.html",
            "client/html/templates/simple-thumbnails.html"
        ],
        fuImages: [
            "client/loading.gif",
            "client/processing.gif",
            "client/edit.gif"
        ],
        fuPlaceholders: [
            "client/placeholders/not_available-generic.png",
            "client/placeholders/waiting-generic.png"
        ],
        fuCss: [
            "client/fineuploader.css"
        ],
        fuDocs: [
            "README.md",
            "LICENSE"
        ],
        versioned: [
            "package.json",
            "fineuploader.jquery.json",
            "client/js/version.js",
            "bower.json",
            "README.md"
        ],
        fuUnit: [
            "test/static/local/helpme.js",
            "test/unit/**/*.js"
        ],
        karmaModules: [
            "test/static/third-party/assert/assert.js",
            "test/static/third-party/jquery/jquery.js",
            "test/static/third-party/jquery.simulate/jquery.simulate.js",
            "test/static/third-party/json2/json2.js",
            "test/static/third-party/purl/purl.js",
            "test/static/third-party/sinon/sinon.js",
            "test/static/third-party/sinon/event.js",
            "test/static/third-party/sinon/fake_xml_http_request.js",
            "test/static/local/formdata.js"
        ],
        testHelperModules: [
            "test/static/local/karma-runner.js",
            "test/static/local/blob-maker.js",
            "test/static/third-party/q/q-1.0.1.js"
        ],
        fuSrcBuild: [
            "_build/all!(@(*.min.js|*.gif|*.css))"
        ]
    };

if (exports) {
    (function() {
        "use strict";
        var mergeModules = function() {
            var files = [],
                quiet = false,
                start = 0,
                args = Array.prototype.slice.call(arguments, start);
            if (typeof args[0] === "boolean") {
                quiet = true;
                start = 1;
            }

            Array.prototype.slice.call(arguments, start).forEach(function(filegroup) {
                fineUploaderModules[filegroup].forEach(function(file) {
                    // replace @ref
                    var match = file.match(/^\@(.*)/);
                    if (match) {
                        //if (!quiet) { console.log("Adding module to build: @" + match[1]); }
                        files = files.concat(mergeModules(quiet, match[1]));
                        //files = files.concat(fineUploaderModules[match[1]]);
                    } else {
                        //if (!quiet) { console.log("    Adding file to build: " + file); }
                        files.push(file);
                    }
                });
            });

            return _.unique(files);
        };

        exports.modules = fineUploaderModules;
        exports.mergeModules = mergeModules;
    }());
}
