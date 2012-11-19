# Fine Uploader 3.0 (Released November 16) #
### 3.1 is planned for Dec. 17 ###

<br/>
Actively developed by Ray Nicholus.     
Created by by Andrew Valums.

</br>
## Please Read ##
3.0 brings some breaking changes. Your 2.x or earlier client-side code WILL require adjustments.  Please have a look
at the [upgrading](#upgrading-from-212) section AND the options documentation before requesting support.


<br/>
### Quick Links ###
* [Upgrading from 2.1.2](#upgrading-from-212)
* [Download](https://github.com/valums/file-uploader/wiki/Releases)
* [Support](https://groups.google.com/forum/#!forum/fineuploader)
* [@fineuploader](https://twitter.com/fineuploader)
* [Homepage](http://fineuploader.com)
* [Donate](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6ZMVZSC4DBRVN&lc=US&item_name=Fine%20Uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted)

<br/>
###Table of Contents###
- [Summary](#summary)
- [Features](#features)
- [License](#license)
- [Known Issues](#known-issues)
- [Getting started](#getting-started)
- [Server-side requirements](https://github.com/valums/file-uploader/blob/master/server/readme.md)
- [Using the optional jQuery plug-in](#using-the-optional-jquery-plug-in)
- [qq.FineUploader - Setting up full upload widget](#qqfineuploader---setting-up-full-upload-widget)
- [How to override options](#how-to-override-options)
- [Options of both FineUploader & FineUploaderBasic](#options-of-both-fineuploader--fineuploaderbasic)
- [Options of FineUploader](#options-of-fineuploader)
- [Styling FineUploader](#styling-fineuploader)
- [Callbacks (FineUploader & FineUploaderBasic)](#callbacks-fineuploader--fineuploaderbasic)
- [Changing alert/messages to something more user friendly](#changing-alertmessages-to-something-more-user-friendly)
- [Instance methods](#instance-methods)
- [qQuery (Utility Functions)](#qquery)
- [Internet Explorer limitations](#internet-explorer-limitations)
- [Building and using the snapshot version](#building-and-using-the-snapshot-version)
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

It does not use Flash, jQuery, or any other external libraries.

<br/>
### Features ###
* Multiple file select, progress-bar in FF, Chrome, Opera, and Safari
* Drag-and-drop file select in FF, Chrome, Opera, and Safari (OS X)
* Uploads are cancelable
* No external dependencies **at all** if using FineUploader or FineUploaderBasic.  If using the optional jQuery wrapper, jQuery is of course required.
* FineUploaderBasic only requires the associated Fine Uploader javascript file.  All Fine Uploader css and image files can be omitted.
* Doesn't use Flash
* Fully working with HTTPS
* Tested in IE7+, Firefox, Safari (OS X), Opera, Chrome, IOS6, and various versions of Android.  IE10 is now also supported!
* Ability to upload files as soon as they are selected, or "queue" them for uploading at user's request later
* Display specific error messages from server on upload failure (hover over failed upload item)
* Ability to auto-retry failed uploads
* Option to allow users to manually retry a failed upload
* Create your own file validator and/or use some default validators include with Fine Uploader
* Receive callback at various stages of the upload process
* Send any parameters server-side along with each file.
* Any many more!

<br/>
### License ###
This plugin is open sourced under MIT license, GNU GPL 2 or later and GNU LGPL 2 or later. Please see the license.txt file for details.

<br/>
### Known Issues ###
* [#474](https://github.com/valums/file-uploader/issues/474) - Sometimes the wrong callback name is reported in a caught callback error message.  Planned to be fixed in 3.1.

<br/>
### Getting started ###
The combined javascript file contains two classes that are meant to be used directly.
If you need a complete upload widget (from demo) to quickly drop
into your current design, use `qq.FineUploader`.
Note that a set of utility functions, used internally by Fine Uploader, are also publicly accessible.  See the utils.js
file for an easy reference of the utility functions present in the combined javascript file.  The QUnit tests may also
serve has helpful documentation.

If you want to customize the uploader, by using a different looking file list
or change the behaviour or functionality use `qq.FineUploaderBasic`.

The difference between them is that `qq.FineUploader` provides a list of files,
drag-and-drop, but `qq.FineUploaderBasic` only creates button and handles validation.
Basic uploader is easier extendable, and doesn't limit possible customization.

`qq.FineUploader` extends `qq.FineUploaderBasic`, so that all the options present
in the basic uploader also exist in the full widget.


<br/>
### Upgrading From 2.1.2 ###
3.0 introduces some big new features and, as a result, some minor breaking changes as well.  Some of the big new features:
* [optional jQuery plug-in](#using-the-optional-jquery-plug-in)
* [only override sub-options you want to change](#how-to-override-options)
* auto and manual retry of failed uploads
* you may now "contribute" you own custom file validators
* IE10 and Android are now officially supported
* Improved logging
* Instance function that allow you to lookup a file list item element given a file ID
* Instance function that allows you to dispose/reset the uploader
* Instance function that allows you to cancel an upload
* "Processing" indicator that appears when the last byte has been sent but a response from the server is pending
* Fixed issue in IE7 that caused button text to be invisible

Some minor breaking changes were also made.  Here are some of the changes:
* All mentions of "FileUploader" in the code were changes to the new name: FineUploader.  This includes qq.FileUploader
(now qq.FineUploader) and qq.FileUploaderBasic (now qq.FineUploaderBasic), for starters.  Note that the combined js and css file names
have changed as well.  The js and css files that appear in the released zip will contain version numbers in the filename.
* Options have been "categorized" where appropriate.  For example, all drag-and-drop related options are now sub-options
under the `dragAndDrop` option, text options are now sub-options under the new `text` option.  There are several other new
"categories"/options with sub-options.  Please see the options section of this readme for details.
* The `action` option has been renamed `endpoint`.  Notice that it is now a property under the new `request` object option as well.
* `params`, `customHeaders`, `forceMultipart`, and `inputName` are now properties under the new `request` option.
* All validation-related options have been moved under the new `validation` option.
* All callbacks have been moved under the `callbacks` option.
* `extraDropzones`, `hideDropzones`, and `disableDefaultDropzone` options were moved under the new `dragAndDrop` option.
* `extraMessages` is now `messages` (in FineUploader).  It extends FineUploaderBasic's `messages` option.  The `formatProgress` property
has been moved under the `text` option.
* All options ending in "text" have been moved under the new `text` option.  In each of these cases, the "text" suffix has been removed
  from the option.  Also, the `dragText` option has been moved under `dragAndDrop` as well and has been renamed `dragZone`.
* More logging was added.  Warning and error messages will always appear, but lower-level log messages will still only appear if `debug` is set to true.
* The giant uploader javascript file was split up into smaller files where appropriate.  This is simply to make development/maintenance
easier.  Releases will always contain all js in a single file.  The source branches though, will contain the split-up files.  Note
that you can always combine files in a snapshot branch if you want via [gradle](#building-and-using-the-snapshot-version).  Once I setup
a CI system, I may start adding snapshot builds to the downloads section.

<br/>
### Using the optional jQuery plug-in ###
A jQuery plug-in exists that wraps the native Fine Uploader code.  If you would like to reap all of the benefits that
a jQuery plug-in offers, such as use of jQuery Events, specifying elements using the jQuery object/jQuery selectors,
easy integration into your otherwise jQuery project: look no further!

To use the jQuery plug-in, ensure you include the proper Fine Uploader js file on your page, and instantiate it like so:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
});
```

The above example is the simplest possible use-case.  Note that you can use any of the options available for the native
Fine Uploader and Fine Uploader Basic, with the following exceptions & additions:
* There is no need to specify the `element` option.  It will be ignored if you pass it in.  The plug-in will pass the
 `element` option for you, using the element you associated with the plug-in (the element with an id of fineUploaderElementId
 in the above example).
* If you plan on using FineUploaderBasic, include the `uploaderType` option with a value of 'basic'.  If not specified, it
is assumed that you intend to use FineUploader.

###### Options that require an HTMLElement ######
For any option with an `HTMLElement` value, you can, instead, pass a jQuery object.  For example, if you specify the
`button` option, the value can be `$('#myButton')`.

If the option takes an array of `HTMLElements`, any item in the array that is a jQuery object will be evaluated and all
`HTMLElement`s associated with that jQuery object will be added to the array when it is passed to the native Fine
Uploader.  For example, if specify a value for the `extraDropzones` option, and, say, your value is
`[$('.myExtraDropzone')]`, and there are 3 elements in the DOM with this class, the plug-in will pass all 3 elements
to native Fine Uploader.

###### Callbacks ######
All [callbacks defined in the native uploader](#callbacks-fineuploader--fineuploaderbasic) are also available when using
the jQuery plug-in.  However, as is common with jQuery plug-ins, these callbacks are actually custom events.  For example,
if you want to be notified whenever an error occurs and whenever an upload has completed, your client-side code may look
something like this:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
}).on('error', function(event, id, filename, reason) {
     //do something
  })
  .on('complete', function(event, id, filename, responseJSON){
    //do something
  });
```

It may be important to note that The value returned from your event/callback handler may be examined by the uploader.
This is relevant for the `onSubmit`, `onValidate` and `onManualRetry` callbacks, at this point.  As the documentation states, if you
want to cancel an upload in your `onSubmit` or `onValidate` callback handlers, simply return `false`.  This is also true
when using the jQuery plug-in.

Also, please note that the context of your event handler, by default, is the event target.  This is, in fact, true, by
default, for _all_ jQuery event handlers, not just event handlers associated with Fine Uploader.  Say you want to change
the parameters sent along with a file when handling a `submit` event.  Your code can be as simple as this:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
}).on('submit', function(event, id, filename) {
     $(this).fineUploader('setParams', {'param1': 'val1'});
  });
```

###### Public API / Instance Functions ######
All [public API (instance) functions](#instance-methods) defined in the native javascript uploader are accessible when
using the jQuery plug-in.  Public/instance functions on a jQuery plug-in are made accessible as recommended in the
[jQuery plug-in documentation](http://docs.jquery.com/Plugins/Authoring#Plugin_Methods).  Looking for an example?
Please see the above code fragment, where we call the `setParams` instance function and pass it an object.


<br/>
### qq.FineUploader - Setting up full upload widget ###
Include the uploader javascript file and, optionally, `fineuploader.css` along with any images provided into your page.
Create container element.  If you are only making use of FineUploaderBasic, you can omit the css and image(s) file(s).

```html
<div id="fine-uploader">
<noscript>
    <p>Please enable JavaScript to use Fine Uploader.</p>
    <!-- or put a simple form for upload here -->
</noscript>
</div>
```

Initialize uploader when the DOM is ready. Change the endpoint option.
In the server folder you will find some examples for different platforms.
If you can't find the one you need, please read up on handling multipart form
requests and XHR upload requests in your server-side language of choice.

```javascript
var uploader = new qq.FineUploader({
	// pass the dom node (ex. $(selector)[0] for jQuery users)
	element: document.getElementById('fine-uploader'),
	
	request: {
      		// path to server-side upload script
		endpoint: '/server/upload'
	}
});
```

<br/>
### How to Override Options ###
This is mostly obvious, but you should know that it is actually much easier to override
"sub-properties" than expected.  Take the `messages` option (object) in FineUploaderBasic,
for example.  Suppose you only want to override the `typeError` default message, but want to
use the default values for the other messages properties.  Well, simply define a new value for the
`typeError` property when initializing your FineUploaderBasic (or FineUploader) instance:
```javascript
messages: {
   typeError: "This is not a valid type"
}
```
Fine Uploader will know that you only want to change the `typeError` message value and keep all of the
other default values.  This works for all options that are, themselves, objects with sub-options.



<br/>
### Options of both FineUploader & FineUploaderBasic ###
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
    </tbody>
</table>
##### `request` option properties: #####
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
            <td>endpoint</td>
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
            <td>forceMultipart</td>
            <td>boolean</td>
            <td>false</td>
            <td>While form-based uploads will always be multipart requests, this forces XHR uploads to send files using
            multipart requests as well.</td>
        </tr>
        <tr>
            <td>inputName</td>
            <td>string</td>
            <td>qqfile</td>
            <td>This usually only useful with the ajax uploader, which sends the name of the file as a parameter, using a key name
            equal to the value of this options.  In the case of the form uploader, this is simply the value of the name attribute
            of the file's associated input element.</td>
        </tr>
    </tbody>
</table>

##### `validation` option properties: #####
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
            seen when using FineUploader if the default <code>showMessage</code> implementation is not overriden.  In this
            case, an alert  dialog will appear for each invalid file in the batch, and the upload process will not continue
            until the dialog is dismissed.  If this is bothersome, simply override <code>showMessage</code> with a
            desirable implementation.  A later version may have a <code>showMessage</code> default implementation that
            does not use the <code>alert</code> function.</td>
        </tr>
    </tbody>
</table>

##### `retry` option properties: #####
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
            <td>enableAuto</td>
            <td>boolean</td>
            <td>false</td>
            <td>If set to <code>true</code>, any error or non-200 response will prompt the uploader to automatically
            attempt to upload the file again.</td>
        </tr>
        <tr>
            <td>maxAutoAttempts</td>
            <td>number</td>
            <td>3</td>
            <td>The maximum number of times the uploader will attempt to retry a failed upload.  Ignored if <code>enableAuto</code>
            is <code>false</code>.</td>
        </tr>
        <tr>
            <td>autoAttemptDelay</td>
            <td>number</td>
            <td>5</td>
            <td>The number of seconds the uploader will wait in between automatic retry attempts.  Ignored if <code>enableAuto</code>
            is <code>false</code>.</td>
        </tr>
        <tr>
            <td>preventRetryResponseProperty</td>
            <td>string</td>
            <td>preventRetry</td>
            <td>If this property is present in the server response and contains a value of <code>true</code>, the uploader
            will not allow any further retries of this file (manual or automatic).</td>
        </tr>
    </tbody>
</table>


<br/>
### Options of FineUploader ###
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
    </tbody>
</table>
##### `dragAndDrop` option properties: #####
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
    </tbody>
</table>
##### `text` option properties: #####
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
            <td>uploadButton</td>
            <td>string</td>
            <td>Upload a file</td>
            <td>Label for the file selector button</td>
        </tr>
        <tr>
            <td>cancelButton</td>
            <td>string</td>
            <td>cancel</td>
            <td>The cancel button text (which is more of a link than a button).</td>
        </tr>
        <tr>
            <td>failUpload</td>
            <td>string</td>
            <td>Upload failed</td>
            <td>Text that appears next to a failed file item</td>
        </tr>
        <tr>
            <td>dragZone</td>
            <td>string</td>
            <td>Drop files here to upload</td>
            <td>Text that appears in the drop zone when it is visible</td>
        </tr>
        <tr>
            <td>formatProgress</td>
            <td>string</td>
            <td>{percent}% of {total_size}</td>
            <td>Text that appears next to a file as it is uploading (if the browser supports the file API)</td>
        </tr>
    </tbody>
</table>
##### `failedUploadTextDisplay` option properties: #####
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
            <td>mode</td>
            <td>string</td>
            <td>default</td>
            <td>Valid values are "default" (display the text defined in <code>failUploadText</code> next to each
            failed file), "none" (don't display any text next to a failed file), and "custom" (display error response text from the
            server next to the failed file).</td>
    	</tr>
    	<tr>
            <td>maxChars</td>
            <td>integer</td>
            <td>50</td>
            <td>The maximum amount of character of text to display next to the file.  After the limit has been reached,
            "..." will terminate the string.  This is ignored unless <code>mode</code> is "custom".</td>
    	</tr>
    	<tr>
            <td>responseProperty</td>
            <td>string</td>
            <td>error</td>
            <td>The property from the server response containing the error text to display next to the
            failed file.  This is ignored unless <code>mode</code> is "custom".</td>
    	</tr>
    	<tr>
            <td>enableTooltip</td>
            <td>boolean</td>
            <td>true</td>
            <td>If set to true, a tooltip will display the full contents of the error message when the mouse pointer
            hovers over the failed file.  Note that this currently uses the title attribute of the failed file element, but there is an issue
            to improve this (see #355 for details).</td>
    	</tr>
    </tbody>
</table>

##### `retry` option properties: #####
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
            <td>showAutoRetryNote</td>
            <td>boolean</td>
            <td>true</td>
            <td>If set to <code>true</code>, a status message will appear next to the file during automatic retry attempts.</td>
        </tr>
        <tr>
            <td>autoRetryNote</td>
            <td>string</td>
            <td>Retrying {retryNum}/{maxAuto}...</td>
            <td>The text of the note that will optionally appear next to the file during automatic retry attempts.  Ignored
            if <code>showAutoRetryNote</code> is <code>false</code>.</td>
        </tr>
        <tr>
            <td>showButton</td>
            <td>boolean</td>
            <td>false</td>
            <td>If <code>true</code>, a button/link will appear next to a failed file after all retry attempts have been
            exhausted, assuming the server has not prohibited further retry attempts via the <code>preventRetryResponseProperty</code>.
            This button/link will allow the user to manually order the uploader to make another attempt at uploading the
            failed file.  Note that this operation does respect the <code>maxConnections</code> value, so if all connections
            are accounted for, the retry attempt will be queued until a connection opens up.</td>
        </tr>
    </tbody>
</table>


<br/>
### Styling FineUploader ###
The `template` option contains default elements with default classes that make up the uploader as a whole in the DOM.  For example,
the first default element in `template` is a `div` with a class of `qq-uploader`.  This is the parent element of the uploader.
The default drop area, button, and file list elements are also, by default, contained in this option.  You can use this option to
add additional elements, modify default template elements, etc.

There is also a `fileTemplate` option which contains default elements that make up one file item in the file list.

Finally, a `classes` option allows you to change the default class names for these elements.  Be sure the values in `classes`
match the class names used in the corresponding template elements (where appropriate).

<br/>
### Callbacks (FineUploader & FineUploaderBasic) ###
* `onSubmit(String id, String fileName)` - called when the file is submitted to the uploader portion of the code.
Note that this does not mean the file upload will begin at this point.  Return `false` to prevent submission to the uploader.
* `onComplete(String id, String fileName, Object responseJSON)` - called when the file upload has finished.
* `onCancel(String id, String fileName)` - called when the file upload has been cancelled.
* `onUpload(String id, String fileName)` - called just before the file upload begins
* `onProgress(String id, String fileName, int uploadedBytes, int totalBytes)` - called during the upload, as it progresses.  Only used by the XHR/ajax uploader.
* `onError(String id, String fileName, String errorReason)` - called whenever an exceptional condition occurs (during an upload, file selection, etc).
* `onAutoRetry(String id, String fileName, String attemptNumber)` - called before each automatic retry attempt for a failed file.
* `onManualRetry(String id, String fileName)` - called before each manual retry attempt.  Return false to prevent this and all future retry attempts on this file.
* `onValidate(Array fileData)` - If more than one file has been selected or dropped, this callback is invoked
with FileData objects for each of the dropped/selected files.  This allows you to prevent the entire batch from being uploaded
if desired.  To prevent any files in this batch from being uploaded, simply return false.  If your handler does not return
false, this callback will also be invoked once for each individual file submitted.  In that case, the array will contain
only one `FileData` object for each call.  If you want to only prevent specific files from  being uploaded, you can return
false here when appropriate.  This callback is always invoked before the default Fine Uploader validators execute.  Note
that a `FileData` object has two properties: `name` (the file name) and `size` (the file size).  The `size` property will
be undefined if the user agent does not support the File API.

<br/>
### Changing alert/messages to something more user friendly ###
You may want to change the default alert implementation and messages as you see fit.  This is possible by overriding the
`showMessage` function option, as well as the `messages` properties in FineUploader.  The default `showMessage` function
simply invokes `alert` with the message text.  One instance in which this is used is when the user attempts to select
an invalid file for upload.  There are general message types with default text that can be overriden as well.

<br/>
### Instance methods ###
* `log(String message)` - Outputs a message to the javascript console, if possible.
* `setParams(Object newParams)` - Set the parameters sent along with the request after initializing the uploader.  It can be nicely used in `onSubmit` callback.
* `uploadStoredFiles()` - If `!autoUpload`, this will begin uploading all queued files.
* `clearStoredFiles()` - Clears the internal list of stored files.  Only applicable when `autoUpload` is set to false.
* `getInProgress()` - Returns the number of files that are either currently uploading or files waiting in line for upload.
* `retry(String fileId)` - Orders the uploader to make another attempt at uploading a specific file.  A NO-OP if the server
prohibits retries on a failed file via the <code>preventRetryResponseProperty</code>.  Note that this operation does
respect the <code>maxConnections</code> value, so if all connections are accounted for, the retry attempt will be queued
until a connection opens up.
* `cancel(String fileId)` - Cancels a queued or currently uploading file.
* `getItemByFileId(String fileId)` - Returns the HTMLElement associated with the passed file ID.
* `reset()` - While this function is most useful for FineUploader, it is also available in FineUploaderBasic.  In FineUploader,
calling this function will reset all UI elements to the state they exsited in immediately after initialization.  In FineUploaderBasic,
this resets all internal variables to the state they existed in immediately after initialization.  If you are using FineUploaderBasic,
it is up to you to "reset" any of your UI elements.

<br/>
### qQuery ###
Fine Uploader, which lives in the `qq` namespace, also contains a number of utility functions in the same namespace.
While these functions were developed to be used by the internal Fine Uploader code, they are all public functions and many
of them may be useful to others.  If, for example, you cannot or do not want to import a 3rd-party library such as jQuery,
Fine Uploader's qQuery contains a number of useful utility functions.  I will document the ones that are most likely to be
useful outside of Fine Uploader below:

##### `qq(HTMLElement)` #####
The functions below are part of the `qq(HTMLElement)` function.  This is similar to the `jQuery` function that takes,
for one, a selector string.  `qq(...)` is a bit simpler and less advanced, though.  It only accepts one HTMLElement (for now).
For example, if you want to hide an element with an ID of "myDiv":

```javascript
var myDiv = document.getElementById('myDiv');
qq(myDiv).hide();
```

The following element-related functions are available on the `qq(...)` function.  Unless otherwise specified, the function returns the qq instance to allow chaining:
* `hide()` - Hides this element.
* `attach(String type, Function callback)` - attach an event handler to this element for a specific type of native DOM event.  Returns a `detach` function.
* `detach(String type, Function originalCallback)` - detach an already attached event handler given a specific event type and callback function.
* `contains(HTMLElement descendant)` - Returns true if this element contains the passed element.
* `insertBefore(HTMLElement elementB)` - Inserts this element directly before the passed element in the DOM.
* `remove()` - Removes this element from the DOM.
* `css(Object styles)` - Specify css styles for this element, such as `{top: 0, right: 0`}.
* `hasClass(String className)` - Returns true if this element has the passed class name.
* `addClass(String className)` - Adds the passed class to this element.
* `removeClass(String className)` - Removes the passed class from this element.
* `getByClass(String className)` -  Returns an array of all descendants of this element that contain the passed class name.
* `setText(String text)` - Sets the text for this element.
* `clearText(String text)` - Clears all text for this element.
* `children()` - Returns an array of all immediate children elements of this element.

##### The following utility functions are also available in the `qq` namespace as: #####
* `qq.isObject(somevar)` - Returns true if the parameter is a "simple" object, such as `{foo: "bar"}` or `new Object()`.
* `qq.extend(Object firstObj, Object secondObj, Boolean extendNested)` - Copies the properties of secondObj to firstObj.  If extendNested is true, sub-properties of secondObj are copied over as well.
* `qq.indexOf(Array array, String item, Number startingIndex)` - Same as [indexOf from Javascript 1.6](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf), but implemented for browsers that don't support this native function, such as IE8 and earlier.
* `qq.preventDefault(Event)` - A function used to prevent the user agent's default action.  To be used inside an event handler.
* `qq.toElement()` - Creates and returns a new DIV element.
* `qq.log(String logMessage, (optional) String logLevel)` - Log a message to the console.  No-op if console logging is not supported
by the user agent.  Will delegate to the user agent's logging function that corresponds to the passed logging level, if
it exists.  If a comparable function does not exist, but console logging is supported, the log event will be delegated
to `console.log` and the log level will be included in the message.
* `qq.ie10()` - Returns true if the current user agent is Internet Explorer 10.
* `qq.ie()` - Returns true if the current user agent is Internet Explorer.
* `qq.safari()` - Returns true if the current user agent is Safari.
* `qq.chrome()` - Returns true if the current user agent is Chrome.
* `qq.firefox()` - Returns true if the current user agent is Firefox.
* `qq.windows()` - Returns true if the current user agent is running on the Microsoft Windows platform.


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
            <th>Supported/Fixed in IE10?</th>
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
            <td>Yes</td>
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
            <td>No</td>
        </tr>
        <tr>
            <td>Any response content-type other than "text/plain" causes issues when trying to parse the JSON response</td>
            <td>IE does strange things with the response when the content-type is, for example, "application/json" or
            "text/html".  The latter is only a problem if you return HTML in your JSON response.</td>
            <td>Yes</td>
        </tr>
        <tr>
            <td>Can't determine response code</td>
            <td>Not really an IE problem, but since we are forced to upload files via form submission, I thought I'd
            include it.  This is really a side-effect of using a form submission to upload files.</td>
            <td>Yes</td>
        </tr>
    </tbody>
</table>


<br/>
### Building and using the snapshot version ###
You can use [gradle](http://www.gradle.org/) to build the snapshot version.  Simply clone this project, and run `gradlew combineJs`
on the command-line.  This will combine all of the javascript files into one file, placing it in the 
"build" directory.  If you want the minified or gzipped version of the snapshot version, simply replace
`combineJs` on the command-line with `minifyJs` or `gzipJs`, respectively.

If you would like the jQuery plug-in, simply add "jQuery" to the end of any of these tasks.  For example, to obtain the
non-minified jQuery plug-in or the minified jQuery plug-in, run `gradlew combineJsJquery` or `gradlew minifyJsJquery`
respectively.  This will build the Fine Uploader javascript file with the plug-in and everything else you need.

Remember, a snapshot build is not yet released, so it may have some lingering bugs.  The trade-off is
immediate access to new features without having to wait for a release.  

In the future, I may integrate a CI system that creates nightly snapshot builds, but that is a pretty low-priority,
especially since building your own snapshot version should be pretty easy.

Don't forget to include the css and image files in your project if you are using FineUploader.


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

<br/>
### Issue Tracker ###
Have a bug or feature request? Please [create an issue here on GitHub](https://github.com/valums/file-uploader/issues) 
that conforms with [necolas's guidelines](https://github.com/necolas/issue-guidelines/blob/master/README.md).

<br/>
### Contributors ###
We would love developers to contribute any improvements and bugfixes they produce.  Note that any pull requests MUST be against an "IP" branch!
See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

Thanks to everybody who contributed, either by sending bug reports or donating. The project wouldn't be possible without all this generous help. Thank you!

If you have found Fine Uploader useful, please consider [donating](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6ZMVZSC4DBRVN&lc=US&item_name=Fine%20Uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted) 
to support continued maintenance and evolution of this library.
