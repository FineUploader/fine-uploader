# Fine Uploader 3.2 (Released January 13) #
### 3.3 is the next planned release ###

###[Download the 3.2 combined & minified javascript file (along with all other required files) here](https://github.com/valums/file-uploader/wiki/Releases)###

###I'm Considering removal of support for IE7 in a future release. [Comment here](https://github.com/valums/file-uploader/issues/637).###

<br/>
Actively developed by [Ray Nicholus](http://lnkd.in/Nkhx2C).     
Created by Andrew Valums.

<br/>
## Known Issues ##
There are several known issues in 3.2  Please check the issue tracker for [known issues that have been fixed in the 3.3-IP branch](https://github.com/valums/file-uploader/issues?labels=bug&milestone=7&page=1&state=closed),
and for those [known issues that are still pending a fix in 3.3-IP](https://github.com/valums/file-uploader/issues?labels=bug&milestone=7&page=1&state=open).

<br/>
## Notice ##
I plan on changing the default for the `paramsInBody` property of the `request` option to "true" in 3.3.  I suspect most
developers are setting this option anyway.  Please let me know if you have any problems with this change, so we can
discuss further.  The associated case is [#604](https://github.com/valums/file-uploader/issues/604).

<br/>
## Quick Links ##
* [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
* [Downloads](https://github.com/valums/file-uploader/wiki/Releases)
* [Support](https://getsatisfaction.com/fineuploader)
* [Blog](http://blog.fineuploader.com)
* [@fineuploader](https://twitter.com/fineuploader)
* [Demo](http://fineuploader.com)
* [Donate](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6ZMVZSC4DBRVN&lc=US&item_name=Fine%20Uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted)


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
* Any many more!


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
[jQuery plug-in section](#using-the-optional-jquery-plug-in).


<br/>
## Choose Your Path... ##
Once you have decided how you will use Fine Uploader, click on the appropriate link below to get started.

### jQuery plug-in for FineUploader mode users ###
Start [here](#jquery-plug-in-for-fineuploader-mode-users-1).

### jQuery plug-in for FineUploaderBasic mode users  ###
Your journey begins [here](#jquery-plug-in-for-fineuploaderbasic-mode-users).

### FineUploader mode users ###
Look no further, your plan of action is described [here](#fineuploader-mode-users-1).

### FineUploaderBasic mode users ###
I didn't forget about you!  Read on, starting [here](#fineuploaderbasic-mode-users-1).


<br/>
## jQuery plug-in for FineUploader mode users ##
1. Download the latest released jQuery plug-in from the [Downloads](https://github.com/valums/file-uploader/wiki/Releases) section.
2. Read the [using the optional jQuery plug-in](#using-the-optional-jquery-plug-in) section.
3. Start with step 3 in the [FineUploader mode users](#fineuploader-mode-users-1) section.

## jQuery plug-in for FineUploaderBasic mode users ##
1. Download the latest released jQuery plug-in from the [Downloads](https://github.com/valums/file-uploader/wiki/Releases) section.
2. Read about the [using the optional jQuery plug-in](#using-the-optional-jquery-plug-in) section.
3. Be sure to specify an `uploaderType` option with a value of "basic".
4. Start with step 3 in the [FineUploaderBasic mode users](#fineuploaderbasic-mode-users-1) section.

## FineUploader mode users ##
1. Download the latest released native javascript plug-in from the [Downloads](https://github.com/valums/file-uploader/wiki/Releases) section.
2. Read the [getting started for non-jQuery users](#getting-started-for-non-jquery-users).
3. Read about the available [FineUploaderBasic mode options](#fineuploaderbasic-mode-options).
4. Study the available [FineUploader mode options](#fineuploader-mode-options).
5. Glance at this quick blurb on [overriding options](#how-to-override-options).
6. Have a look at the available [API functions in FineUploaderBasic mode](#fineuploaderbasic-mode-api-functions).
7. Check out the available [API functions in FineUploader mode](#fineuploader-mode-api-functions).
8. Examine the [available callbacks](#callbacks-1).
9. Head on over to the [server-side readme](server/readme.md).
10. Some additional sections that may be of interested are outlined [here](#additional-reading).

## FineUploaderBasic mode users ##
1. Download the latest released native javascript plug-in from the [Downloads](https://github.com/valums/file-uploader/wiki/Releases) section.
2. Read the [getting started for non-jQuery users](#getting-started-for-non-jquery-users).
3. Read about the available [FineUploaderBasic mode options](#fineuploaderbasic-mode-options).
4. Glance at this quick blurb on [overriding options](#how-to-override-options).
5. Have a look at the available [API functions in FineUploaderBasic mode](#fineuploaderbasic-mode-api-functions).
6. Examine the [available callbacks](#callbacks-1).
7. Head on over to the [server-side readme](server/readme.md).
8. Some additional sections that may be of interested are outlined [here](#additional-reading).


<br/>
## Additional Reading ##
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)
- [Styling FineUploader](#styling-fineuploader)
- [Changing alert/messages to something more user friendly](#changing-alertmessages-to-something-more-user-friendly)
- [qQuery (Public Utility Functions)](#qquery)
- [Troubleshooting](#troubleshooting)
- [Internet Explorer Limitations](#internet-explorer-limitations)
- [Issue Tracker](#issue-tracker)
- [License](#license)
- [Contributors](#contributors)


<br/>
### Frequently Asked Questions (FAQ) ###
**Q:** Why are you charging me to download a zip containing the combined js files, along with a minified version, the
version-stamped css file, and all other required files?      
**A:** Fine Uploader is a lot of work.  I literally work on Fine Uploader, in my free time, 7 days a week.  I've kept up this
schedule since August.  As a result Fine Uploader grows at a rapid pace, bugs are addressed quickly, and the support I provide
for users is second-to-none.  Compensation provides me with an excuse to keep up the work I am doing.  The other alternative is
a project that decays and becomes unusable or out-of-date after some time.  If, for some reason, you don't want to
contribute to those that have worked so hard to provide you with this solution at a very modest price, you can certainly
make use of the source code posted in the Github repo.  The project is, after all, open-source.

**Q**: In IE, when my server returns its response to an upload request, I see a "Save As..." dialog box on the client.  What am I doing wrong?
**A**: Your server's response content-type MUST be "text/plain".  IE does not handle the "application/json" mime-type.  You have
probably read advice from others that claim "text/html" is also safe.  This is not always true.  You will run into problems with a content-type
of "text/html" if your JSON response contains HTML.

**Q:** I like FineUploader mode, but I don't want to allow my users to utilize the drag & drop feature.  How can I do this?      
**A:** Set the `disableDefaultDropzone` property of the `dragAndDrop` option to `true`.

**Q:** Using the jQuery plug-in in FineUploaderBasic mode, I can't seem to get my upload button to appear.      
**A:** It is important to understand that the target of your plug-in should be an existing container element for your upload
component, *NOT* the button element.  Your button element must be specified separately via the `button` option.

**Q:** Why am I seeing an "Access Denied" error in IE's javascript console?      
**A:** There are two common causes.  One cause is triggering the "select files" dialog via javascript.  IE does not permit this
and will throw a security error when Fine Uploader attempts to submit the underlying form.  Another cause is returning a
response code that is not 200.  The error occurs when Fine Uploader attempts to parse the response in the hidden iframe.
See the [Internet Explorer Limitations](#internet-explorer-limitations) for more details.

**Q:** Why can't I use a progress bar, drag and drop, multiple file selection, chunking, or auto-resume in some browsers?      
**A:** Some browsers (IE9 and older, along with Android 2.3.x and older) do not support the File API the `multiple` attribute on file input elements.
These are all required to give you the best possible experience.

**Q:** Why isn't Opera supported?      
**A:** Market share for Opera is incredibly low, and I have found annoying bugs in Opera that have taken up an unnecessary amount of my
time in the past.  For such a small minority of users, I have decided that it is not worth my time.  There are many better options as far
as browsers are concerned.

**Q:** Why isn't Safari for Windows supported?      
**A:** There is really no reason to use Safari for Windows.   Webkit is better represented on that platform in Chrome.
Apple doesn't appear to be interested in maintaining Safari for Windows anymore either.  Switch to Chrome.

**Q:** Why isn't IOS5 supported?      
**A:** IOS5 doesn't even support a file input element.

**Q:** Why isn't folder drag & drop uploading supported in any browser other than Chrome 21+?      
**A:** Chrome 21 was the first browser version to implement the HTML5 Filesystem API.  This is required to handle dropped folders.
Currently, no other browsers support this API.

**Q:** I have created a \<button\> element for my uploader button, but this doesn't seem to work in IE.  Why?      
**A:** In IE, the button element receives the click event, instead of the child input element.  Use a \<div\> or a \<span\> or an \<a\> instead.

**Q:** Why do I only see a "Processing..." message next to a file (in FineUploader mode) in Chrome & Safari after the last byte has been sent but the server has yet to respond?    
**A:** The implementation of the onProgress notification that tells us the status of the bytes sent to the server varies from browser to browser, unfortunately.
Webkit browsers have elected to follow the "spirit" of the W3C spec, while Firefox, and (I beleive) IE10, obey the spec in the most strict sense.  I have discussed
this in some detail [in the "processing" status message feature case](https://github.com/valums/file-uploader/issues/404#issuecomment-10124160).

**Q:** When chunking and multipart encoded are both enabled, why must I determine the original file's name by parsing the qqfilename parameter?   
**A:** The file data is stored in one of the multipart boundaries contained in the request payload.  Normally, the 
content-disposition header for this boundary contains the actual file name.  However, when the file is split up into parts
client-side, we are sending a [Blob](http://www.w3.org/TR/FileAPI/#dfn-Blob) to represent a different part of the 
[File](http://www.w3.org/TR/FileAPI/#dfn-file) in each request.  A [FormData](http://www.w3.org/TR/2010/WD-XMLHttpRequest2-20100907/#the-formdata-interface) object is used to construct these
requests.  When a Blob is added to a FormData object, the user agent sets the content-disposition header for the associated
multipart boundary in the request to "blob" (or sometimes an empty or random string).  As a result, we must
pass the original file name in a parameter.

**Q:** How can I prevent users from dropping folders into browsers that do not support folder uploading?    
**A:** There is no reliable way to prevent users from dropping folders into the drop zone of any browser other than 
Chrome 21+, currently.  This is due to the fact that there is no way to reliably detect if a folder has been dropped 
unless the user agent implements the [Filesystem API](http://www.w3.org/TR/file-system-api/). Folder dropping is only 
supported in Chrome 21+, since this is the only browser that implements the Filesystem API.  You can parse the user 
agent string to determine if folder dropping is supported, and then inform your users in your application's UI.
Theoretically, you could check for the appropriate function on the [DataTransfer](http://www.w3.org/TR/2011/WD-html5-20110113/dnd.html#the-datatransfer-interface) 
object prototype, but this would not work cross-browser, since webkit does not expose this interface, unfortunately.



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
**It is important to understand that the target of your plug-in should be an existing container element for your upload
component, *NOT* the button element.  Your button element must be specified separately via the `button` option.**

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

It may be important to note that the value returned from your event/callback handler may be examined by the uploader.
As the documentation states, uploads can be prevented by returning 'false' in some of your callback handlers.  This is also true
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


For more examples using the jQuery plug-in, please have a look at [fineuploader.com](http://fineuploader.com).


<br/>
### Getting started for non-jQuery users ###
Of course, Fine Uploader does NOT depend on jQuery, and you don't have to use the jQuery plug-in if you don't want to.
The same features are available without the jQuery plug-in.  To use Fine Uploader with "plain 'ole" javascript,
include the uploader javascript file and, optionally, the css file along with any images provided into your page.
If you are only making use of FineUploaderBasic, you can omit the css and image(s) file(s).

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

For more examples, please have a look at [fineuploader.com](http://fineuploader.com).


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
### FineUploaderBasic mode options ###
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
        <tr>
            <td>formatFileName</td>
            <td>function</td>
            <td>(see source code)</td>
            <td>By default, this function limits the filename displayed in the UI or error messages to 33 characters,
            plus 3 ellipses separating the first several and the last several characters of the file name.  Override this function
            if you want more control over the display of file names.</td>
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
            <td>These parameters are sent with the request to the endpoint specified in the action option.  An individual parameter value
            may be a number, string, another object, or a function that returns a number or string.  See the <a href="http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html">associated blog post</a>
            for more details.</td>
        </tr>
        <tr>
            <td>paramsInBody</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to <code>true</code> if you want all parameters to be sent in the request body.  Note that setting this option
            to <code>true</code> will force all requests to be multipart encoded.  If the value is <code>false</code> all params will be
            included in the query string.   See the <a href="http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html">associated blog post</a>
            for more details.</td>
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
            <td>true</td>
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
        <tr>
            <td>uuidName</td>
            <td>string</td>
            <td>qquuid</td>
            <td>The name of the parameter, sent along with each request, that uniquely identifies the associated file.  The value of
            this parameter is a version 4 UUID.</td>
        <tr>
            <td>totalFileSizeName</td>
            <td>string</td>
            <td>qqtotalfilesize</td>
            <td>Name of the parameter passed with a multipart encoded request that specifies the total size in bytes of the associated file.  Note that this is only passed
            with MPE requests that originate from the XHR uploader, since there is no way to determine file size client-side when using the form uploader.</td>
        </tr>
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

##### `chunking` option properties: #####
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
            <td>enabled</td>
            <td>boolean</td>
            <td>false</td>
            <td>If set to <code>true</code>, each file will be split up into parts.  Each part will be sent in a separate request.
            The size of the part is determined by the <code>partSize</code> option value.  See the server-side readme for more details.</td>
        </tr>
        <tr>
            <td>partSize</td>
            <td>number</td>
            <td>2000000</td>
            <td>The maximum size of each part, in bytes.</td>
        </tr>
    </tbody>
</table>

##### `chunking.paramNames` option properties: #####
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
            <td>partIndex</td>
            <td>string</td>
            <td>qqpartindex</td>
            <td>Name of the parameter passed with a chunked request that specifies the index of the associated partition.</td>
        </tr>
        <tr>
            <td>partByteOffset</td>
            <td>string</td>
            <td>qqpartbyteoffset</td>
            <td>Name of the parameter passed with a chunked request that specifies the starting byte of the associated chunk.</td>
        </tr>
        <tr>
            <td>chunkSize</td>
            <td>string</td>
            <td>qqchunksize</td>
            <td>Name of the parameter passed with a chunked request that specifies the size in bytes of the associated chunk.</td>
        </tr>
        <tr>
            <td>totalParts</td>
            <td>string</td>
            <td>qqtotalparts</td>
            <td>Name of the parameter passed with a chunked request that specifies the total number of chunks associated with the underlying file.</td>
        </tr>
        <tr>
            <td>filename</td>
            <td>string</td>
            <td>qqfilename</td>
            <td>Name of the parameter passed with a chunked request that specifies the name of the associated file.  This is useful for chunked
            requests that are multipart encoded, since the filename reported by the user agent in the content-disposition header
            will be either "blob" or an empty string.</td>
        </tr>
    </tbody>
</table>

##### `resume` option properties: #####
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
            <td>enabled</td>
            <td>boolean</td>
            <td>false</td>
            <td>If set to <code>true</code>, the ability to resume a failed/stopped chunked upload will be possible.  See the server-side readme for more details.</td>
        </tr>
        <tr>
            <td>id</td>
            <td>number, string, or boolean</td>
            <td>null</td>
            <td>If this value is defined, the cookie name used to identify a file chunk will be composed of the filename, file size,
            and max partition/chunk size.  If this value is not defined or does not fit into one of the acceptable types,
            it will be added as an additional component of the cookie name.</td>
        </tr>
        <tr>
            <td>cookiesExpireIn</td>
            <td>number</td>
            <td>7</td>
            <td>The number of days before a persistent resume cookie will expire.</td>
        </tr>
    </tbody>
</table>

##### `resume.paramNames` option properties: #####
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
            <td>resuming</td>
            <td>string</td>
            <td>qqresume</td>
            <td>Sent with the first request of the resume, with a value of true.</td>
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
            <td>sizeSymbols</td>
            <td>array of strings</td>
            <td>['kB', 'MB', 'GB', 'TB', 'PB', 'EB']</td>
            <td>Symbols used to represent file size, in ascending order.</td>
        </tr>
    </tbody>
</table>


<br/>
### FineUploader mode options ###
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
            <td>retry</td>
            <td>string</td>
            <td>Retry</td>
            <td>The retry (a failed upload) link text.</td>
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
            <td>dropProcessing</td>
            <td>string</td>
            <td>Processing dropped files...</td>
            <td>Text that appears next to the drop processing spinner while we are waiting for the upload to finish processing dropped files or directories.</td>
        </tr>
        <tr>
            <td>formatProgress</td>
            <td>string</td>
            <td>{percent}% of {total_size}</td>
            <td>Text that appears next to a file as it is uploading (if the browser supports the file API)</td>
        </tr>
        <tr>
            <td>waitingForResponse</td>
            <td>string</td>
            <td>Processing...</td>
            <td>Text that appears next to a file after last byte has been sent (according to the UA) while we are wating for a response from the server.</td>
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
### Callbacks ###

For jQuery plug-in users, adhere to the following syntax:
```javascript
$('#myUploader')
    .on('complete', function(event, id, fileName, response) {
        ...
    })
    .on('cancel', function(event, id, fileName) {
        ...
    });
```

Note that, if using the jQuery plug-in, you can also bind your callback/event handlers as part of your initialization code, since
the `fineUploader` plug-in returns your target element (`$('#myUploader')`, in this example).

Callbacks must be declared inside of a `callbacks` object for non-jQuery users, like this:
```javascript
new qq.FineUploader({
    ...
    callbacks: {
        onComplete: function(id, fileName, response) {
            ...
        },
        onCancel: function(id, fileName) {
            ...
        },
        ...
    }
}
```

Here are all available callbacks:

* `onSubmit(String id, String fileName)` - called when the file is submitted to the uploader portion of the code.
Note that this does not mean the file upload will begin at this point.  Return `false` to prevent submission to the uploader.
* `onComplete(String id, String fileName, Object responseJSON)` - called when the file upload has finished.
* `onCancel(String id, String fileName)` - called when the file upload has been cancelled.
* `onUpload(String id, String fileName)` - called just before a file upload begins.
* `onUploadChunk(String id, String fileName, Object chunkData)` - called just before a file chunk/partition request is sent.  The chunkData object has
4 properties: `partIndex` (the 0-based index of the associated partition), `startByte` (the byte offset of the current chunk in terms
of the underlying file), `endByte` (the last byte of the current chunk in terms of the underlying file), and `totalParts` (the
total number of partitions associated with the underlying file).
* `onProgress(String id, String fileName, int uploadedBytes, int totalBytes)` - called during the upload, as it progresses.  Only used by the XHR/ajax uploader.
* `onError(String id, String fileName, String errorReason)` - called whenever an exceptional condition occurs (during an upload, file selection, etc).
* `onAutoRetry(String id, String fileName, String attemptNumber)` - called before each automatic retry attempt for a failed file.
* `onManualRetry(String id, String fileName)` - called before each manual retry attempt.  Return false to prevent this and all future retry attempts on this file.
* `onResume(String id, String fileName, Object chunkData)` - Called before an attempt is made to resume a failed/stopped upload from a previous session.
If you return false, the resume will be cancelled and the uploader will start uploading the file from the first chunk.  The `chunkData` object contains the properties as
the `chunkData` parameter passed into the `onUploadChunk` callback.
* `onValidate(FileData fileData)` - This callback is invoked a FileData object, representing one of the file selected for upload.  It is called once
for each selected, dropped, or `addFiles` submitted file, provided you do not return false in your `onValidateBatch` handler, and also provided
the `stopOnFirstInvalidFile` validation option is not set and a previous invocation of your `onValidate` callback in this batch has not returned false.
This callback is always invoked before the default Fine Uploader validators execute.  Note that a `FileData` object has two properties: `name`
(the file name) and `size` (the file size).  The `size` property will be undefined if the user agent does not support the File API.
* `onValidateBatch(Array fileDataArray)` - This callback is invoked once for each batch of files selected, dropped, or submitted
via the `addFiles` API function.  A FileData array is passed in representing all files selected or dropped at once.  This allows
you to prevent the entire batch from being uploaded, if desired, by returning false.  If your handler does not return false,
the `onValidate` callback will be invoked once for each individual file submitted.  This callback is always invoked before
the default Fine Uploader validators execute.  Note that a `FileData` object has two properties: `name` (the file name) and
`size` (the file size).  The `size` property will be undefined if the user agent does not support the File API.

<br/>
### Changing alert/messages to something more user friendly ###
You may want to change the default alert implementation and messages as you see fit.  This is possible by overriding the
`showMessage` function option, as well as the `messages` properties in FineUploader.  The default `showMessage` function
simply invokes `alert` with the message text.  One instance in which this is used is when the user attempts to select
an invalid file for upload.  There are general message types with default text that can be overriden as well.

<br/>
### FineUploaderBasic mode API functions ###
* `log(String message)` - Outputs a message to the javascript console, if possible.
* `setParams(Object newParams, [optional] Number fileId)` - Set the parameters sent along with the request after initializing the uploader.
You can either change the parameters for a specific file, or for all files.  To do the latter, simply omit the `fileId` parameter.
See this [blog post explaining parameters](http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html)
as well as [this one explaining how this function works in 3.1 and later versions](http://blog.fineuploader.com/2012/12/setparams-is-now-much-more-useful-in-31.html).
* `setEndpoint(String endpointPath, [optional] Number fileId)` - Modify the location,  after initializing the uploader, where upload requests should be directed.
You can either change the endpoint for a specific file, or for all files.  To do the latter, simply omit the `fileId` parameter.
* `uploadStoredFiles()` - If `!autoUpload`, this will begin uploading all queued files.
* `clearStoredFiles()` - Clears the internal list of stored files.  Only applicable when `autoUpload` is set to false.
* `getInProgress()` - Returns the number of files that are either currently uploading or files waiting in line for upload.
* `retry(String fileId)` - Orders the uploader to make another attempt at uploading a specific file.  A NO-OP if the server
prohibits retries on a failed file via the <code>preventRetryResponseProperty</code>.  Note that this operation does
respect the <code>maxConnections</code> value, so if all connections are accounted for, the retry attempt will be queued
until a connection opens up.
* `cancel(String fileId)` - Cancels a queued or currently uploading file.
* `reset()` - While this function is most useful for FineUploader, it is also available in FineUploaderBasic.  In FineUploader,
calling this function will reset all UI elements to the state they exsited in immediately after initialization.  In FineUploaderBasic,
this resets all internal variables to the state they existed in immediately after initialization.  If you are using FineUploaderBasic,
it is up to you to "reset" any of your UI elements.
* `addFiles(filesOrInputs)` - Use this if you would like to submit files to the uploader.  This may be useful if you have
a method of gathering files that does not include Fine Uploader's input button or the drag & drop support built into FineUploader.
This function accepts the following types: `File`, `input` element, or a collection of any of these types, provided the
collection object contains an (integer) index property for each contained item.
* `getResumableFilesData()` - Returns an array of objects, each describing a file that is potentially resumable by this uploader instance.
If a `resume.id` property has been set, this is taken into consideration.  Each resumable file is represented by an object with the
following properties: `name` - filename, `size` - file size, `uuid` - unique ID associated w/ the file, `partIdx` - index of the part where
the resume will start.
* `getSize(fileId)` - Returns the size of the file represented by the passed ID.  Undefined if the file size cannot be determined, such as
if the user agent does not support the File API.
* `getFile(fileId)` - Returns the `File` object associated with the passed file ID.  Undefined if the underlying file cannot be found,
or if the user agent does not support the File API.  For more info on the `File` object, please see [the entry in the W3C spec](http://www.w3.org/TR/FileAPI/#dfn-file).
* `getUuid(fileId)` - Retrieves the UUID associated with a file, given a current session file ID.


<br/>
### FineUploader mode API functions ###
* `getItemByFileId(String fileId)` - Returns the HTMLElement associated with the passed file ID.
* `addExtraDropzone(HTMLElement element)` - Use this to mark an element as a drop zone on an already-instantiated FineUploader.
* `removeExtraDropzone(HTMLElement element)` - Use this to un-mark an extra element as a drop zone on an already-instantiated FineUploader.  An "extra"
   drop zone is one specified in the `extraDropzones` option, or one set via the `addExtraDropzone` function.


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
* `qq.each(objectOrArray, callback)` - Iterates through an object or array, passing your callback the key and value for each element in the object.  `return false;` to stop iteration.
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
* `qq.android()` - Returns true of the current user agent in running on an Android device.
* `qq.isXhrUploadSupported()` - Returns true if the current user agent is capable of sending files using an ajax request.
* `qq.isFolderDropSupported()` - Returns true if the current user agent is capable of handling dropped folders.
* `qq.isFileChunkingSupported()` - Returns true if the current user agent is capable of sending chunked file requests.
* `qq.areCookiesEnabled()` - Returns true if persistent cookies are permitted by the user agent.
* `qq.getUniqueId()` - Returns a version 4 UUID.
* `qq.getCookie(String name)` - Returns the value of the cookie associated with the passed name.
* `qq.setCookie(String name, String value, number daysTillExpiration)` - Sets or updates a cookie.
* `qq.deleteCookie(String name) - Deletes a cookie with the passed name.


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
### License ###
This plugin is open sourced under MIT license, GNU GPL 2 or later and GNU LGPL 2 or later. Please see the license.txt file for details.

<br/>
### Contributors ###
We would love developers to contribute any improvements and bugfixes they produce.  Note that any pull requests MUST be against an "IP" branch!
See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

Thanks to everybody who contributed, either by sending bug reports or donating. The project wouldn't be possible without all this generous help. Thank you!
