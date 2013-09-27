// Fine Uploader's modules
//
// shamelessly inspired by:
// https://github.com/angular/angular.js/blob/master/angularFiles.js

fineUploaderModules = {
  "fuSrcCore": [
    "./client/js/util.js",
    "./client/js/version.js",
    "./client/js/features.js",
    "./client/js/promise.js",
    "./client/js/button.js",
    "./client/js/upload-data.js",
    "./client/js/uploader.basic.api.js",
    "./client/js/uploader.basic.js",
    "./client/js/uploader.api.js",
    "./client/js/uploader.js",
    "./client/js/ajax.requester.js",
    "./client/js/handler.base.js",
    "./client/js/handler.xhr.api.js",
    "./client/js/handler.form.api.js"
  ],
  "fuSrcTraditional": [
    "@fuSrcCore",
    "./client/js/traditional/handler.form.js",
    "./client/js/traditional/handler.xhr.js"
  ],
  "fuSrcS3": [
    "@fuSrcCore",
    "./client/js/s3/util.js",
    "./client/js/s3/uploader.basic.js",
    "./client/js/s3/uploader.js",
    "./client/js/s3/signature.ajax.requester.js",
    "./client/js/s3/uploadsuccess.ajax.requester.js",
    "./client/js/s3/multipart.initiate.ajax.requester.js",
    "./client/js/s3/multipart.complete.ajax.requester.js",
    "./client/js/s3/multipart.abort.ajax.requester.js",
    "./client/js/s3/handler.xhr.js",
    "./client/js/s3/handler.form.js",
    "./client/js/s3/jquery-plugin.js"
  ],
  "fuSrcJquery": [
    "./client/js/jquery-plugin.js",
    "./client/js/jquery-dnd.js"
  ],
  "fuSrcAll": [
    "@fuSrcTraditional",
    "@fuSrcS3",
    "@fuSrcJquery"
  ],
  "fuSrcModules": [
    "./client/js/paste.js",
    "./client/js/dnd.js",
    "./client/js/deletefile.ajax.requester.js",
    "./client/js/window.receive.message.js"
  ],
  "fuUiModules": [
    "./client/js/ui.handler.events.js",
    "./client/js/ui.handler.click.drc.js",
    "./client/js/ui.handler.edit.filename.js",
    "./client/js/ui.handler.click.filename.js",
    "./client/js/ui.handler.focusin.filenameinput.js",
    "./client/js/ui.handler.focus.filenameinput.js"
  ],
  "fuIframeXssResponse": [
    "./client/js/iframe.xss.response.js"
  ],
  "fuExtra": [
    "./client/loading.gif",
    "./client/processing.gif",
    "./client/fineuploader.css",
    "./client/edit.gif",
    "./README.md",
    "./LICENSE"
  ],
  "versioned": [
    "package.json",
    "fineuploader.jquery.json",
    "./client/js/version.js",
    "bower.json",
    "README.md"
  ],
  "fuUnit": [
    "./test/static/helpme.js",
    "./test/unit/*.js",
    "./test/unit/s3/*.js"
  ],
  "fuFunctional": [
    "./test/functional/**/*.coffee"
  ],
  "karmaModules": [
    "./test/static/karma-runner.js",
    "./test/_vendor/assert/assert.js",
    "./test/_vendor/jquery/jquery.js",
    "./test/_vendor/jquery.simulate/jquery.simulate.js",
    "./test/_vendor/json2/json2.js",
    "./test/_vendor/purl/purl.js"
  ],

};

if (exports) {
  exports.modules = fineUploaderModules;
  exports.mergeModules = function() {
    var files = [];

    Array.prototype.slice.call(arguments, 0).forEach(function(filegroup) {
      fineUploaderModules[filegroup].forEach(function(file) {
        // replace @ref
        var match = file.match(/^\@(.*)/);
        if (match) {
            files = files.concat(fineUploaderModules[match[1]]);
        } else {
          files.push(file);
        }
      });
    });

    return files;
  };
}
