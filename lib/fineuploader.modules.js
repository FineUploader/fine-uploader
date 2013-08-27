fineUploaderModules = {
  "core": [
    "./client/js/util.js",
    "./client/js/version.js",
    "./client/js/features.js",
    "./client/js/promise.js",
    "./client/js/button.js",
    "./client/js/paste.js",
    "./client/js/upload-data.js",
    "./client/js/uploader.basic.api.js",
    "./client/js/uploader.basic.js",
    "./client/js/dnd.js",
    "./client/js/uploader.api.js",
    "./client/js/uploader.js",
    "./client/js/ajax.requester.js",
    "./client/js/deletefile.ajax.requester.js",
    "./client/js/window.receive.message.js",
    "./client/js/handler.base.js",
    "./client/js/handler.xhr.api.js",
    "./client/js/handler.form.api.js",
    "./client/js/ui.handler.events.js",
    "./client/js/ui.handler.click.drc.js",
    "./client/js/ui.handler.edit.filename.js",
    "./client/js/ui.handler.click.filename.js",
    "./client/js/ui.handler.focusin.filenameinput.js",
    "./client/js/ui.handler.focus.filenameinput.js"
  ],
  "traditional": [
    "./client/js/traditional/handler.form.js",
    "./client/js/traditional/handler.xhr.js"
  ],
  "s3": [
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
  "jquery": [
    "./client/js/util.js",
    "./client/js/version.js",
    "./client/js/features.js",
    "./client/js/promise.js",
    "./client/js/button.js",
    "./client/js/paste.js",
    "./client/js/upload-data.js",
    "./client/js/uploader.basic.api.js",
    "./client/js/uploader.basic.js",
    "./client/js/dnd.js",
    "./client/js/uploader.api.js",
    "./client/js/uploader.js",
    "./client/js/ajax.requester.js",
    "./client/js/deletefile.ajax.requester.js",
    "./client/js/window.receive.message.js",
    "./client/js/handler.base.js",
    "./client/js/handler.xhr.api.js",
    "./client/js/handler.form.api.js",
    "./client/js/ui.handler.events.js",
    "./client/js/ui.handler.click.drc.js",
    "./client/js/ui.handler.edit.filename.js",
    "./client/js/ui.handler.click.filename.js",
    "./client/js/ui.handler.focusin.filenameinput.js",
    "./client/js/ui.handler.focus.filenameinput.js",
    "./client/js/jquery-plugin.js",
    "./client/js/jquery-dnd.js"
  ],
  "all": [
    "./client/js/util.js",
    "./client/js/version.js",
    "./client/js/features.js",
    "./client/js/promise.js",
    "./client/js/button.js",
    "./client/js/paste.js",
    "./client/js/upload-data.js",
    "./client/js/uploader.basic.api.js",
    "./client/js/uploader.basic.js",
    "./client/js/dnd.js",
    "./client/js/uploader.api.js",
    "./client/js/uploader.js",
    "./client/js/ajax.requester.js",
    "./client/js/deletefile.ajax.requester.js",
    "./client/js/window.receive.message.js",
    "./client/js/handler.base.js",
    "./client/js/handler.xhr.api.js",
    "./client/js/handler.form.api.js",
    "./client/js/ui.handler.events.js",
    "./client/js/ui.handler.click.drc.js",
    "./client/js/ui.handler.edit.filename.js",
    "./client/js/ui.handler.click.filename.js",
    "./client/js/ui.handler.focusin.filenameinput.js",
    "./client/js/ui.handler.focus.filenameinput.js",
    "./client/js/jquery-plugin.js",
    "./client/js/jquery-dnd.js",
    "./client/js/traditional/handler.form.js",
    "./client/js/traditional/handler.xhr.js",
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
  "extra": [
    "./client/js/iframe.xss.response.js",
    "./client/loading.gif",
    "./client/processing.gif",
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
  ]
};

if (exports) {
  exports.modules = fineUploaderModules;
  exports.mergeModules = function() {
    var files = [];

    Array.prototype.slice.call(arguments, 0).forEach(function(filegroup) {
      fineUploaderModules[filegroup].forEach(function(file) {
          files.push(file);
      });
    });

    return files;
  };
}
