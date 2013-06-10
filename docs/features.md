## Features ##
* Multiple file select, progress-bar in FF, Chrome, and Safari
* Drag-and-drop file select in FF, Chrome, and Safari (OS X)
* Uploads are cancelable
* No external dependencies **at all** if using FineUploader or FineUploaderBasic.  If using the optional jQuery wrapper, jQuery is of course required.
* FineUploaderBasic only requires the associated Fine Uploader javascript file.  All Fine Uploader css and image files can be omitted.
* Doesn't use Flash
* Fully working with HTTPS
* Tested in IE7+, Firefox, Safari (OS X), Chrome, IOS6, and various versions of Android.  IE10 is now also supported!
* Ability to upload files as soon as they are selected, or "queue" them for uploading at user's request later
* Display specific error messages from server on upload failure (hover over failed upload item)
* Ability to auto-retry failed uploads
* Option to allow users to manually retry a failed upload
* Create your own file validator and/or use some default validators include with Fine Uploader
* Receive callback at various stages of the upload process
* Send any parameters server-side along with each file.
* Upload directories via drag and drop (Chrome 21+).
* [Include parameters in the query string OR the request body.](http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html)
* Submit files to be uploaded via the API.
* [Split up a file into multiple requests](http://blog.fineuploader.com/2012/12/file-chunkingpartitioning-is-now.html) (file chunking/partitioning).
* [Resume failed/stopped uploads from previous sessions](http://blog.fineuploader.com/2013/01/resume-failed-uploads-from-previous.html)
* [Delete uploaded files](http://blog.fineuploader.com/2013/01/delete-uploaded-file-in-33.html)
* [CORS support](http://blog.fineuploader.com/2013/01/cors-support-in-33.html)
* Upload any `Blob` objects via the API.
* Easily set and enforce a maximum item limit.
* [Upload images via paste (Chrome)](http://blog.fineuploader.com/2013/03/upload-image-via-paste-in-34.html).
* [Standalone file & folder drag & drop module](docs/drag-and-drop.md).  Integrated by default into FineUploader mode.
* [Perform async (non-blocking) tasks in callbacks that influence the associated file or files](http://blog.fineuploader.com/2013/05/callbacks-that-permit-asynchronous.html)
* [Upload images directly from a mobile device's camera](http://blog.fineuploader.com/2013/05/upload-directly-via-camera-on-mobile.html)
* [Retrieve statistics for uploaded files and receive callbacks on status changes](http://blog.fineuploader.com/2013/05/query-fine-uploader-for-upload-stats.html)
* And many more!
