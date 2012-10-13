# Fine Uploader 2.2-SNAPSHOT (planned release date of October 27) #

Originally developed/designed by Andrew Valums.   
Currently maintained by Ray Nicholus.

*If you have found Fine Uploader useful, please consider [donating](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6ZMVZSC4DBRVN&lc=US&item_name=Fine%20Uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted) 
to support continued maintenance and evolution of this library.*

<br/>
### Announcements ###
_October 11, 2012_ - Interested in short status/issue updates?  [Follow Fine Uploader on Twitter!](https://twitter.com/fineuploader)
Also, check out the [3.0 branch](https://github.com/valums/file-uploader/tree/3.0) from time to time if you are interested 
in the progress.

<br/>
###Table of Contents###
- [Summary](#summary)
- [Releases/Downloads](#releasesdownloads)
- [Upgrading from Fine Uploader 2.0](#upgrading-from-fine-uploader-20)
- [Features](#features)
- [License](#license)
- [Getting started](#getting-started)
- [qq.FileUploader - Setting up full upload widget](#qqfileuploader---setting-up-full-upload-widget)
- [Options of both FileUploader & FileUploaderBasic](#options-of-both-fileuploader--fileuploaderbasic)
- [Options of FileUploader](#options-of-fileuploader)
- [Styling FileUploader](#styling-fileuploader)
- [Callbacks (FileUploader & FileUploaderBasic)](#callbacks-fileuploader--fileuploaderbasic)
- [Changing alert/messages to something more user friendly](#changing-alertmessages-to-something-more-user-friendly)
- [Instance methods](#instance-methods)
- [Internet Explorer limitations](#internet-explorer-limitations)
- [Troubleshooting](#troubleshooting)
- [Issue Tracker](#issue-tracker)
- [Contributors](#contributors)

<br/>
### Summary ###

Welcome! This project attempts to achieve a user-friendly file-uploading experience over the web.
It's built as a Javascript plugin for developers looking to incorporate file-uploading into their website.

This plugin uses an XMLHttpRequest (AJAX) for uploading multiple files with a progress-bar in
FF3.6+, Safari4+, Chrome and falls back to hidden-iframe-based upload in other browsers (namely IE),
providing good user experience everywhere.

It does not use Flash, jQuery, or any external libraries.

Take a look at the new evolving [Demo](http://fineuploader.com) page.

Interested in short status/issue updates?  [Follow Fine Uploader on Twitter](https://twitter.com/fineuploader)!

Questions?  Comments?  Problems?  Post in the [forums](https://groups.google.com/forum/#!forum/fineuploader).

Looking for the [comment thread](http://fineuploader.com/discussions.html) from the valums.com website? It is still available, but please use the [forum](https://groups.google.com/forum/#!forum/fineuploader) instead.


<br/>
### Releases/Downloads ###
**You can [download released versions](https://github.com/valums/file-uploader/wiki/Releases), or, if you are more daring,
use the snapshot version on the master branch.**  


<br/>
### Upgrading from Fine Uploader 2.0 ###
You can see all bugs and features tackled in the 2.1 release [here](https://github.com/valums/file-uploader/issues?milestone=2&page=1&state=closed).
If you are only interested in a summary, here are some of the more notable changes:

<br/>
###### Features/Enhancements ######
* Added option to allow all valid files to upload, skipping only invalid files
* Added gradually filling progress bar (for browsers that support XHR upload/file API)
* The `onError` callback is now called whenever _any_ error occurs, either with the upload or file submission
* An `error` JSON property in the response is used to determine the specific failure reason, `reason` property no longer supported
* Ability to force all requests to use multipart encoding is now a bit more straightforward.  Added a `forceMultipart` option.
* Added ability to determine if dropzones are hidden or not via the `hideDropzones` options
* Added ability to hide default dropzone via the `disableDefaultDropzone` option
* Option to display dynamic custom error text next to each failed upload.  See the `failedUploadTextDisplay` option documentation for more details.

###### Bug Fixes ######
Please see the list of issues [here](https://github.com/valums/file-uploader/issues?labels=bug&milestone=2&page=1&state=closed).


<br/>
### Features ###
* Multiple file select, progress-bar in FF, Chrome, Safari
* Drag-and-drop file select in FF, Chrome
* Uploads are cancelable
* No external dependencies
* Doesn't use Flash
* Fully working with HTTPS
* Keyboard support in FF, Chrome, Safari
* Tested in IE7+ (not IE10 yet), Firefox, Safari (OS X), and Chrome.  Safari for Windows is not supported, nor is IE6 or earlier.
* Ability to upload files as soon as they are selected, or "queue" them for uploading at user's request later
* Display specific error messages from server on upload failure (hover over failed upload item)

<br/>
### License ###
This plugin is open sourced under MIT license, GNU GPL 2 or later and GNU LGPL 2 or later. Please see the license.txt file for details.

<br/>
### Getting started ###
The `fileuploader.js` contains two classes that are meant to be used directly.
If you need a complete upload widget (from demo) to quickly drop
into your current design, use `qq.FileUploader`.

If you want to customize uploader, by using a different looking file list
or change the behaviour or functionality use `qq.FileUploaderBasic`.

The difference between them is that `qq.FileUploader` provides a list of files,
drag-and-drop, but `qq.FileUploaderBasic` only creates button and handles validation.
Basic uploader is easier extendable, and doesn't limit possible customization.

`qq.FileUploader` extends `qq.FileUploaderBasic`, so that all the options present
in the basic uploader also exist in the full widget.


<br/>
### qq.FileUploader - Setting up full upload widget ###
Include `fileuploader.js` and `fileuploader.css` into your page.
Create container element.

```html
<div id="file-uploader">
<noscript>
    <p>Please enable JavaScript to use file uploader.</p>
    <!-- or put a simple form for upload here -->
</noscript>
</div>
```

Initialize uploader when the DOM is ready. Change the action option.
For example ../server/php.php for the default folder structure.
In the server folder you will find examples for different platforms.
If you can't find the one you need, check the readme.txt in the same folder.

```javascript
var uploader = new qq.FileUploader({
	// pass the dom node (ex. $(selector)[0] for jQuery users)
	element: document.getElementById('file-uploader'),
	// path to server-side upload script
	action: '/server/upload'
});
```

<br/>
### Options of both FileUploader & FileUploaderBasic ###
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Note</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>debug</td>
            <td>boolean</td>
            <td>false</td>
            <td>If enabled, this will result in log messages (such as server response) being written to the javascript console.
            If your browser does not support the [window.console object](https://developer.mozilla.org/en-US/docs/DOM/console.log),
            the value of this option is irrelevant.</td>
        </tr>
        <tr>
            <td>action</td>
            <td>string (path)</td>
            <td>/server/upload</td>
            <td>The is the endpoint used by both the form and ajax uploader.  In the case of the form uploader, it is part of the
            form's action attribute value along with all parameters.  In the case of the ajax uplaoder, it is makes up part of the URL
            of the XHR request (again, along with the parameters).</td>
        </tr>
        <tr>
            <td>params</td>
            <td>object</td>
            <td>{}</td>
            <td>These parameters are sent with the request to the endpoint specified in the action option.</td>
        </tr>
        <tr>
            <td>customHeaders</td>
            <td>object</td>
            <td>{}</td>
            <td>Additional headers sent along with the XHR POST request.  Note that is option is only relevant to the ajax/XHR uploader.</td>
        </tr>
        <tr>
            <td>button</td>
            <td>element</td>
            <td>null</td>
            <td>Specify an element to use as the "select files" button.  Note that this may <b>NOT</b> be a &lt;button&gt;,
            otherwise it will not work in Internet Explorer.  Please see issue #33 for details.</td>
        </tr>
        <tr>
            <td>multiple</td>
            <td>boolean</td>
            <td>true</td>
            <td>Set to false puts the uploader into what is best described as 'single-file upload mode'.  See the
            [demo](http://fineuploader.com) for an example.</td>
        </tr>
        <tr>
            <td>maxConnections</td>
            <td>integer</td>
            <td>3</td>
            <td>Maximum allowable concurrent uploads.</td>
        </tr>
        <tr>
            <td>disableCancelForFormUploads</td>
            <td>boolean</td>
            <td>false</td>
            <td>If true, the cancel link does not appear next to files when the form uploader is used.  This may be desired
            since it may not be possible to interrupt a form-based upload in some cases.</td>
        </tr>
        <tr>
            <td>autoUpload</td>
            <td>boolean</td>
            <td>true</td>
            <td>Set to false if you want to be able to begin uploading selected/queued files later, by calling uploadStoredFiles().</td>
        </tr>
        <tr>
            <td>allowedExtensions</td>
            <td>array of strings</td>
            <td>[]</td>
            <td>This may be helpful if you want to restrict uploaded files to specific file types.  Note that this validation
            option is only enforced by examining the extension of uploaded file names.  For a more complete verification of the
            file type, you should use, for example, magic byte file identification on the server side and return {"success": false}
            in the response if the file type is not on your whitelist.</td>
        </tr>
        <tr>
            <td>acceptFiles</td>
            <td>comma-separated strings</td>
            <td>null</td>
            <td>This option is used solely by the file selection dialog.  If you'd like to restict valid file types that appear in the
            selection dialog, you can do this here by listing valid content type specifiers.  See the [documentation on the accept
            attribute of the input element](https://developer.mozilla.org/en-US/docs/HTML/Element/Input) for more information.</td>
        </tr>
        <tr>
            <td>sizeLimit</td>
            <td>integer</td>
            <td>0 (no limit)</td>
            <td>Maximum allowable size, in bytes, for a file.</td>
        </tr>
        <tr>
            <td>minSizeLimit</td>
            <td>integer</td>
            <td>0 (no limit)</td>
            <td>Minimum allowable size, in bytes, for a file.</td>
        </tr>
        <tr>
            <td>stopOnFirstInvalidFile</td>
            <td>boolean</td>
            <td>true</td>
            <td>If true, when submitting multiple files, once a file is determined to be invalid, the upload process 
            will terminate.  If false, all valid files will be uploaded.  Note: One downside to a false value can be
            seen if the default <code>showMessage</code> implementation is not overriden.  In this case, an alert 
            dialog will appear for each invalid file in the batch, and the upload process will not continue until 
            the dialog is dismissed.  If this is bothersome, simply override <code>showMessage</code> with a 
            desirable implementation.  3.0 will likely have a <code>showMessage</code> default implementation that 
            does not use the <code>alert</code> function.</td>
        </tr>
        <tr>
            <td>inputName</td>
            <td>string</td>
            <td>qqfile</td>
            <td>This usually only useful with the ajax uploader, which sends the name of the file as a parameter, using a key name
            equal to the value of this options.  In the case of the form uploader, this is simply the value of the name attribute
            of the file's associated input element.</td>
        </tr>
        <tr>
            <td>forceMultipart</td>
            <td>boolean</td>
            <td>false</td>
            <td>While form-based uploads will always be multipart requests, this forces XHR uploads to send files using 
            multipart requests as well.</td>
        </tr>
    </tbody>
</table>


<br/>
### Options of FileUploader ###
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Note</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>element</td>
            <td>element</td>
            <td>null</td>
            <td>Container for the default drop zone (if supported by browser) and files list.  <b>Required</b></td>
        </tr>
        <tr>
            <td>listElement</td>
            <td>element</td>
            <td>null</td>
            <td>Container for the file list.  If null, the list defined in the template will be used.</td>
        </tr>
        <tr>
            <td>uploadButtonText</td>
            <td>string</td>
            <td>Upload a file</td>
            <td>Label for the file selector button</td>
        </tr>
        <tr>
            <td>cancelButtonText</td>
            <td>string</td>
            <td>cancel</td>
            <td>The cancel button text (which is more of a link than a button).</td>
        </tr>
        <tr>
            <td>failUploadText</td>
            <td>string</td>
            <td>Upload failed</td>
            <td>Text that appears next to a failed file item</td>
        </tr>
        <tr>
            <td>extraDropzones</td>
            <td>array of elements</td>
            <td>[]</td>
            <td>Useful if you'd like to to designate additional dropozones for file input.  Of course, this is not relevant if the
            form uploader is used.</td>
        </tr>
        <tr>
            <td>hideDropzones</td>
            <td>boolean</td>
            <td>true</td>
            <td>Useful if you do not want all dropzone elements to be hidden.  It is expected that some CSS would accompany setting
            this option to false.  You may set this to false if you want to wrap some visible elements, such as the listElement,
            in a drop zone.</td>
        </tr>
        <tr>
            <td>disableDefaultDropzone</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if you are contributing your own drop zone(s) and do not want to use the default one.</td>
        </tr>
        <tr>
            <td>failedUploadTextDisplay</td>
            <td>object</td>
            <td>{<code>mode</code>: 'default',<br/>
                 <code>maxChars</code>: 50,<br/>
                 <code>responseProperty</code>: 'error',<br/>
                 <code>enableTooltip</code>: true}</td>
            <td>This object contains various properties used to control the display of error responses from the server for each file.
            The styling of the error text is controlled by the <code>fail</code> class.<br/><br/><br/>
            
            <code>mode</code>: Valid values are "default" (display the text defined in <code>failUploadText</code> next to each
            failed file), "none" (don't display any text next to a failed file), and "custom" (display error response text from the
            server next to the failed file).<br/><br/>
            
            <code>maxChars</code>: The maximum amount of character of text to display next to the file.  After the limit has been reached,
            "..." will terminate the string.  This is ignored unless <code>mode</code> is "custom".<br/><br/>
            
            <code>responseProperty</code>: The property from the server response containing the error text to display next to the
            failed file.  This is ignored unless <code>mode</code> is "custom".<br/><br/>
            
            <code>enableTooltip:</code>: If set to true, a tooltip will display the full contents of the error message when the mouse pointer
            hovers over the failed file.  Note that this currently uses the title attribute of the failed file element, but there is an issue
            to improve this (see #355 for details).</td>
        </tr>
    </tbody>
</table>

<br/>
### Styling FileUploader ###
The `template` option contains default elements with default classes that make up the uploader as a whole in the DOM.  For example,
the first default element in `template` is a `div` with a class of `qq-uploader`.  This is the parent element of the uploader.
The default drop area, button, and file list elements are also, by default, contained in this option.  You can use this option to
add additional elements, modify default template elements, etc.

There is also a `fileTemplate` option which contains default elements that make up one file item in the file list.

Finally, a `classes` option allows you to change the default class names for these elements.  Be sure the values in `classes`
match the class names used in the corresponding template elements (where appropriate).

<br/>
### Callbacks (FileUploader & FileUploaderBasic) ###
* `onSubmit(String id, String fileName)` - called when the file is submitted to the uploader portion of the code.
Note that this does not mean the file upload will begin at this point.  Return `false` to prevent submission to the uploader.
* `onComplete(String id, String fileName, Object responseJSON)` - called when the file upload has finished.
* `onCancel(String id, String fileName)` - called when the file upload has been cancelled.
* `onUpload(String id, String fileName)` - called just before the file upload begins
* `onProgress(String id, String fileName, int uploadedBytes, int totalBytes)` - called during the upload, as it progresses.  Only used by the XHR/ajax uploader.
* `onError(String id, String fileName, String errorReason)` - called whenever an exceptional condition occurs (during an upload, file selection, etc).

<br/>
### Changing alert/messages to something more user friendly ###
You may want to change the default alert implementation and messages as you see fit.  This is possible by overriding the
`showMessage` function option, as well as the `messages` properties in FileUploaderBasic and the `extraMessages` properties
in FileUploader.  The default `showMessage` function simply invokes `alert` with the message text.  One instance in which t
his is used is when the user attempts to select an invalid file for upload.  There are general message
types with default text that can be overriden as well.

<br/>
### Instance methods ###
* `setParams(Object newParams)` - Set the parameters sent along with the request after initializing the uploader.  It can be nicely used in `onSubmit` callback.
* `uploadStoredFiles()` - If `!autoUpload`, this will begin uploading all queued files.
* `clearStoredFiles()` - Clears the internal list of stored files.  Only applicable when `autoUpload` is set to false.
* `getInProgress()` - Returns the number of files that are either currently uploading or files waiting in line for upload.

<br/>
### Internet Explorer Limitations ###
IE continues to lag _far_ behind all other browsers in terms of features.  IE10 is supposed to, finally, start to compete
with existing modern browsers.  For those of you with customers suffering with IE9 and older, here are some of the limitations
you may want to be aware of when using Fine Uploader:
<table>
    <thead>
        <tr>
            <th>Limitation</th>
            <th>Why?</th>
            <th>*Supported/Fixed in IE10?</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Can't parse JSON response if response code is not 200</td>
            <td>If the response code is not 200, and the size of the response is less than 512, or, apparently, sometimes, less
            than 256 bytes, IE replaces the response with a "friendly" error message.  If you insist on returning responses
            with a status code other than 200, you can work around this by instructing IE users to uncheck the "show friendly
            HTTP error messages" setting.</td>
            <td>No</td>
        </tr>
        <tr>
            <td>No progress indicator</td>
            <td>Lack of blob/File API support</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Content-Size header field value does not match the actual file size</td>
            <td>This isn't technically an IE issue, but I'm going to call it one since we are forced to use multipart request
            in IE.  The content-size for multipart data requests does not refer only to the file.  Rather, it refers to the
            the total size of all sections in the request.</td>
            <td>N/A</td>
        </tr>
        <tr>
            <td>Size restriction options are not enforced</td>
            <td>This is due to the lack of support for the File API.  Without it, we have no way to determine the size of each selected
            file.</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Can't drag & drop files</td>
            <td>Lack of File API support</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Can't select multiple files in the file selection dialog</td>
            <td>The &lt;input&gt; element does not support the <code>multiple</code> attribute</td>
            <td>Early versions still lacked this support, but I've read that the final version does support this attribute</td>
        </tr>
        <tr>
            <td>Only mulipart form request may be used to send files, via form submission</td>
            <td>Lack of File API support</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>No logging</td>
            <td>IE8 and older only: console.log is not implemented</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Cancelling an upload has no effect</td>
            <td>Not really an IE problem, but since we are forced to upload files via form submission, I thought I'd
            include it.  There may be a way to make this work, but I haven't spent time playing around with the
            available options yet.  In the meantime, you should probably set the <code>disableCancelForFormUploads</code>
            option to true.  If I can't find a way to properly allow cancel to work when using the form uploader, I'll
            probably remove the cancel link when the form uploader is in use.</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Can't use a &lt;button&gt; as the element when setting the <code>button</code> option.</td>
            <td>The button receives the click event, instead of the child &lt;input&gt; element that ultimately triggers the
            file dialog</td>
            <td>Not sure</td>
        </tr>
        <tr>
            <td>Any response content-type other than "text/plain" causes issues when trying to parse the JSON response</td>
            <td>IE does strange things with the response when the content-type is, for example, "application/json" or
            "text/html".  The latter is only a problem if you return HTML in your JSON response.</td>
            <td>Not sure</td>
        </tr>
        <tr>
            <td>Can't determine response code</td>
            <td>Not really an IE problem, but since we are forced to upload files via form submission, I thought I'd
            include it.  This is really a side-effect of using a form submission to upload files.</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Can't trigger the file selection dialog via javascript</td>
            <td>IE strictly forbids this.  It will allow you to launch the dialog, but will throw a security exception once
            the form is also submitted via javascript.</td>
            <td>Not sure</td>
        </tr>
    </tbody>
</table>
\*Allegedly 

<br/>
### Troubleshooting ###
If you can't get the uploader to work, please try the following steps
before asking for help.

If the upload doesn't complete, saying "failed":

* Set the `debug` option of the FileUploader to true.
* Open the page where you have a FileUploader.
* Open developer console in your browser.
* Try to upload the file. You should see a server response.

It should be `{"success":true}` for completed requests. If it's not,
then you have a problem with your server-side script.

<br/>
### Issue Tracker ###
Have a bug or feature request? Please [create an issue here on GitHub](https://github.com/valums/file-uploader/issues) 
that conforms with [necolas's guidelines](https://github.com/necolas/issue-guidelines).

<br/>
### Contributors ###
We would love developers to contribute any improvements and bugfixes they produce.
See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

Also, please see issues tagged as ["pull request needed"](https://github.com/valums/file-uploader/issues?labels=Pull+Request+Needed&milestone=&page=1&state=open).
I could use some help on those issues, in particular.

Thanks to everybody who contributed, either by sending bug reports or donating. The project wouldn't be possible without all this generous help. Thank you!

If you have found Fine Uploader useful, please consider [donating](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6ZMVZSC4DBRVN&lc=US&item_name=Fine%20Uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted) 
to support continued maintenance and evolution of this library.
