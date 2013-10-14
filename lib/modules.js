// Fine Uploader's modules
//
// shamelessly inspired by:
// https://github.com/angular/angular.js/blob/master/angularFiles.js

var fineUploaderModules = {
  "fuSrcCore": [
    "client/js/util.js",
    "client/js/version.js",
    "client/js/features.js",
    "client/js/promise.js",
    "client/js/button.js",
    "client/js/upload-data.js",
    "client/js/uploader.basic.api.js",
    "client/js/uploader.basic.js",
    "client/js/ajax.requester.js",
    "client/js/handler.base.js",
    "client/js/handler.form.api.js",
    "client/js/handler.xhr.api.js",
    "client/js/window.receive.message.js"
  ],
  "fuSrcUi": [
    "client/js/uploader.api.js",
    "client/js/uploader.js",
    "client/js/templating.js"
  ],
  "fuSrcTraditional": [
    "client/js/traditional/handler.form.js",
    "client/js/traditional/handler.xhr.js"
  ],
  "fuSrcS3": [
    "client/js/s3/util.js",
    "client/js/s3/uploader.basic.js",
    "client/js/s3/uploader.js",
    "client/js/s3/signature.ajax.requester.js",
    "client/js/s3/uploadsuccess.ajax.requester.js",
    "client/js/s3/multipart.initiate.ajax.requester.js",
    "client/js/s3/multipart.complete.ajax.requester.js",
    "client/js/s3/multipart.abort.ajax.requester.js",
    "client/js/s3/handler.form.js",
    "client/js/s3/handler.xhr.js",
  ],
  "fuSrcS3Jquery": [
    "@fuSrcJquery",
    "client/js/s3/jquery-plugin.js"
  ],
  "fuSrcJquery": [
    "client/js/jquery-plugin.js",
    "client/js/jquery-dnd.js"
  ],
  "fuSrcAll": [
    "@fuSrcTraditional",
    "@fuSrcS3",
    "@fuSrcJquery",
    "@fuSrcS3Jquery"
  ],
  "fuSrcModules": [
    "@fuPasteModule",
    "@fuDndModule",
    "@fuDeleteFileModule",
    "@fuImagePreviewModules"
  ],
  "fuImagePreviewModules": [
    "client/js/third-party/megapix-image.js",
    "client/js/image.js",
    "client/js/exif.js",
    "client/js/identify.js"
  ],
  "fuPasteModule": [
    "client/js/paste.js"
  ],
  "fuDndModule" : [
    "client/js/dnd.js"
  ],
  "fuDeleteFileModule": [
    "client/js/deletefile.ajax.requester.js"
  ],
  "fuIframeXssResponse": [
    "client/js/iframe.xss.response.js"
  ],
  "fuUiModules": [
    "client/js/ui.handler.events.js",
    "@fuDeleteFileUiModule",
    "@fuEditFilenameModule"
  ],
  "fuDeleteFileUiModule": [
    "client/js/ui.handler.click.drc.js",
  ],
  "fuEditFilenameModule": [
    "client/js/ui.handler.click.filename.js",
    "client/js/ui.handler.edit.filename.js",
    "client/js/ui.handler.focusin.filenameinput.js",
    "client/js/ui.handler.focus.filenameinput.js"
  ],
  "fuExtra": [
    "@fuImages",
    "@fuCss",
    "@fuDocs"
  ],
  "fuImages": [
    "client/loading.gif",
    "client/processing.gif",
    "client/edit.gif",
  ],
  "fuCss": [
    "client/fineuploader.css",
  ],
  "fuDocs": [
    "README.md",
    "LICENSE"
  ],
  "versioned": [
    "package.json",
    "fineuploader.jquery.json",
    "client/js/version.js",
    "bower.json",
    "README.md"
  ],
  "fuUnit": [
    "test/static/helpme.js",
    "test/unit/*.js",
    "test/unit/s3/*.js"
  ],
  "fuFunctional": [
    "test/functional/**/*.coffee"
  ],
  "karmaModules": [
    "test/static/karma-runner.js",
    "test/_vendor/assert/assert.js",
    "test/_vendor/jquery/jquery.js",
    "test/_vendor/jquery.simulate/jquery.simulate.js",
    "test/_vendor/json2/json2.js",
    "test/_vendor/purl/purl.js"
  ],
  "fuSrcBuild": [
    "_build/all!(@(*.min.js|*.gif|*.css))"
  ],
  // Pre-defined forumlae
  "fuCoreTraditional": [
    "@fuSrcCore",
    "@fuSrcTraditional",
    "@fuPasteModule",
    "@fuDndModule",
    "@fuDeleteFileModule"
  ],
  "fuCoreS3": [
    "@fuSrcCore",
    "@fuSrcS3",
    "@fuPasteModule",
    "@fuDndModule",
    "@fuDeleteFileModule"
  ],
  "fuUiTraditional": [
    "@fuCoreTraditional",
    "@fuSrcUi",
    "@fuDeleteFileUiModule",
    "@fuEditFilenameModule"
  ],
  "fuUiS3": [
    "@fuCoreS3",
    "@fuSrcUi",
    "@fuDeleteFileUiModule",
    "@fuEditFilenameModule"
  ]
};
if (exports) {
  var mergeModules = function() {
    var files = [];

    Array.prototype.slice.call(arguments, 0).forEach(function(filegroup) {
      fineUploaderModules[filegroup].forEach(function(file) {
        // replace @ref
        var match = file.match(/^\@(.*)/);
        if (match) {
            files = files.concat(mergeModules(match[1]));
            //files = files.concat(fineUploaderModules[match[1]]);
        } else {
          files.push(file);
        }
      });
    });

    return files;
  };

  exports.modules = fineUploaderModules;
  exports.mergeModules = mergeModules;

}
