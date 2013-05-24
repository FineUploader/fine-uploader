# Fine Uploader 3.6 (IN PROGRESS) #

###[Download the 3.5 combined & minified javascript file (along with all other required files) here](http://fineuploader.com/downloads.html)###

###[3.5 change summary](http://blog.fineuploader.com/2013/04/fine-uploader-35.html)###

<br/>
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


<br/>
## Documentation Quick Reference ##
If you are an experienced user who has already read the [Introduction](#introduction), the
["Two Modes..." section](#fine-uploader-has-two-modes), and has followed the documentation wizard
(starting with the ["Choose Your Path..."](#choose-your-path) section), you might be looking for a set of links that point
you at the API, callbacks, options, etc for the purpose of reference.  Here you go:

* [Server-side guidelines and documentation](docs/server.md)
* [Server-side examples](https://github.com/Widen/fine-uploader-server)
* [API: FineUploaderBasic mode](docs/api-fineuploaderbasic.md)
* [API: FineUploader mode](docs/api-fineuploader.md)
* [Options: FineUploaderBasic mode](docs/options-fineuploaderbasic.md)
* [Options: FineUploader mode](docs/options-fineuploader.md)
* [Callbacks](docs/callbacks.md)
* [Promises - `qq.Promise`](docs/promise.md)
* [qQuery - utility functions](docs/qquery.md)
* [Styling Fine Uploader](docs/styling.md)
* [Drag and Drop standalone module](docs/drag-and-drop.md)
* [Feature Detection module](docs/feature-detection.md)
* [IE Limitations](docs/limitations-ie.md)
* [FAQ](docs/faq.md)
* [Downloads](http://fineuploader.com/downloads.html)
* [Support](http://fineuploader.com/support.html)
* [Blog](http://blog.fineuploader.com)
* [@fineuploader](https://twitter.com/fineuploader)
* [Demo](http://fineuploader.com)


<br/>
## Introduction ##
This project attempts to achieve a user-friendly file-uploading experience over the web.
It's built as a Javascript plugin for developers looking to incorporate file-uploading into their website.

This plugin uses an XMLHttpRequest (AJAX) for uploading multiple files with a progress-bar in
FF3.6+, Safari4+, Chrome and falls back to hidden-iframe-based upload in other browsers (namely IE),
providing good user experience everywhere.

It does not use Flash, jQuery, or any other external libraries.  There is an optional jQuery plug-in that can be used to
integrate Fine Uploader into your project, but it is NOT required.  The same features are available with or without the
jQuery plug-in.


<br/>
## Fine Uploader Has Two Modes... ##
You can use Fine Uploader in **FineUploader mode**, or in **FineUploaderBasic mode**.

### FineUploaderBasic mode ###
FineUploaderBasic mode is defined in the `qq.FineUploaderBasic` module in the code.  This is the base module for
Fine Uploader, and provides all functions that do not involve UI components.  Choose this mode if you need very tight
control over your uploader's UI.  If you choose this option, it is expected that you will provide all of your own UI, but
Fine Uploader will do the rest.

### FineUploader mode ###
FineUploader mode is defined in the `qq.FineUploader` module in the code.  It inherits everything from FineUploaderBasic,
plus it provides a customizable UI, including drag & drop, progress bars, status messages, a file list with color-coded status
indicators, and other UI niceties.  Most developers will likely opt to use FineUploader.

### jQuery plug-in ###
Fine Uploader also provides an optional jQuery plug-in.  This simply wraps the native uploader code.  You can use either of
the modes described above when using the jQuery plug-in via the `uploaderType` option.  More on the plug-in in the
[jQuery plug-in section](docs/using-jquery-plugin.md).


<br/>
## Choose Your Path... ##
Once you have decided how you will use Fine Uploader, click on the appropriate link below to get started.

### jQuery plug-in for FineUploader mode users ###
Start [here](docs/path-jquery-fineuploader.md).

### jQuery plug-in for FineUploaderBasic mode users  ###
Your journey begins [here](docs/path-jquery-fineuploaderbasic.md).

### FineUploader mode users ###
Look no further, your plan of action is described [here](docs/path-fineuploader.md).

### FineUploaderBasic mode users ###
I didn't forget about you!  Read on, starting [here](docs/path-fineuploaderbasic.md).


<br/>
### Troubleshooting ###
If you can't get the uploader to work, please try the following steps
before asking for help.

If the upload doesn't complete, saying "failed":

* Set the `debug` option of the FineUploader to true.
* Open the page where you have a FineUploader.
* Open developer console in your browser.
* Try to upload the file. You should see a server response.

It should be `{"success":true}` for completed requests. If it's not,
then you have a problem with your server-side script.

If you are having other issues, please read [the FAQ section](docs/faq.md) before posting a question or bug.


<br/>
### Issue Tracker ###
Have a bug or feature request? Please [create an issue here on GitHub](https://github.com/Widen/fine-uploader/issues) 
that conforms with [necolas's guidelines](https://github.com/necolas/issue-guidelines/blob/master/README.md).


<br/>
### License ###
This plugin is open sourced under GNU GPL v3 or you may purchase a Widen Commerical license to release you from the terms of
GPL v3.  Please see the [downloads page](http://fineuploader.com/downloads.html) for details.


<br/>
### Contributors ###
We would love developers to contribute any improvements and bugfixes they produce.  Note that any pull requests MUST be against the "develop" branch!
See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

Thanks to everybody who contributed, either by sending bug reports, pull requests, or purchasing a commercial license.
The project wouldn't be possible without all this generous help. Thank you!
