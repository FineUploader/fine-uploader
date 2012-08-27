### Valums' Fine Uploader v2.0 beta ###

Originally developed/designed by Andrew Valums.<br/>
Currently maintained by Ray Nicholus.

Welcome! This project attempts to achieve a user-friendly file-uploading experience over the web.
It's built as a Javascript plugin for developers looking to incorporate file-uploading into their website.

Looking for the comment thread from valums.com website? It's located at the bottom of the new evolving [Demo](http://fineuploader.com) page.

Questions?  Comments?  Problems?  Post in the [forums](https://groups.google.com/forum/#!forum/fineuploader).

We would love developers to contribute any improvements and bugfixes they produce.
See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

### Summary ###

This plugin uses an XMLHttpRequest (AJAX) for uploading multiple files with a progress-bar in
FF3.6+, Safari4+, Chrome and falls back to hidden-iframe-based upload in other browsers (namely IE),
providing good user experience everywhere.

It does not use Flash, jQuery, or any external libraries.

### Features ###
* Multiple file select, progress-bar in FF, Chrome, Safari
* Drag-and-drop file select in FF, Chrome
* Uploads are cancelable
* No external dependencies
* Doesn't use Flash
* Fully working with HTTPS
* Keyboard support in FF, Chrome, Safari
* Tested in IE7/8, Firefox 3/3.6/4, Safari 4/5, Chrome, and Opera 10.60
* Ability to upload files as soon as they are selected, or "queue" them for uploading at user's request later
* Display specific error messages from server on upload failure (hover over failed upload item)
* Automatic uploads (as files are selected) or queue files to me manually triggered when ready

### License ###
This plugin is open sourced under MIT license, GNU GPL 2 or later and GNU LGPL 2 or later. Please see the license.txt file for details.

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
            <td>`debug`</td>
            <td>boolean</td>
            <td>`false`</td>
            <td>If enabled, this will result in log messages (such as server response) being written to the javascript console.
            If your browser does not support the [`window.console` object](https://developer.mozilla.org/en-US/docs/DOM/console.log),
            the value of this option is irrelevant.</td>
        </tr>
        <tr>
            <td>`action`</td>
            <td>string (path)</td>
            <td>`/server/upload`</td>
            <td>The is the endpoint used by both the form and ajax uploader.  In the case of the form uploader, it is part of the
            form's `action` attribute value along with all parameters.  In the case of the ajax uplaoder, it is makes up part of the URL
            of the XHR request (again, along with the parameters).</td>
        </tr>
        <tr>
            <td>`params`</td>
            <td>object</td>
            <td>`{}`</td>
            <td>These parameters are sent with the request to the endpoint specified in the `action` option.</td>
        </tr>
        <tr>
            <td>`customHeaders`</td>
            <td>object</td>
            <td>`{}`</td>
            <td>Additional headers sent along with the XHR POST request.  Note that is option is only relevant to the ajax/XHR uploader.</td>
        </tr>
        <tr>
            <td>`multiple`</td>
            <td>boolean</td>
            <td>`true`</td>
            <td>Set to `false` puts the uploader into what is best described as 'single-file upload mode'.  See the
            [demo](http://fineuploader.com) for an example.</td>
        </tr>
        <tr>
            <td>`maxConnections`</td>
            <td>integer</td>
            <td>`3`</td>
            <td>Maximum allowable concurrent uploads.</td>
        </tr>
        <tr>
            <td>`disableCancelForFormUploads`</td>
            <td>boolean</td>
            <td>`false`</td>
            <td>If `true`, the cancel link does not appear next to files when the form uploader is used.  This may be desired
            since it may not be possible to interrupt a form-based upload in some cases.</td>
        </tr>
        <tr>
            <td>`autoUpload`</td>
            <td>boolean</td>
            <td>`true`</td>
            <td>Set to `false` if you want to be able to begin uploading selected/queued files later, by calling `uploadStoredFiles()`.</td>
        </tr>
        <tr>
            <td>`allowedExtensions`</td>
            <td>array of strings</td>
            <td>`[]`</td>
            <td>This may be helpful if you want to restrict uploaded files to specific file types.  Note that this validation
            option is only enforced by examining the extension of uploaded file names.  For a more complete verification of the
            file type, you should use, for example, magic byte file identification on the server side and return `{success: false}`
            in the response if the file type is not on your whitelist.</td>
        </tr>
        <tr>
            <td>`acceptFiles`</td>
            <td>comma-separated strings</td>
            <td>`null`</td>
            <td>This option is used solely by the file selection dialog.  If you'd like to restict valid file types that appear in the
            selection dialog, you can do this here by listing valid content type specifiers.  See the [documentation on the `accept`
            attribute of the `input` element](https://developer.mozilla.org/en-US/docs/HTML/Element/Input) for more information.</td>
        </tr>
        <tr>
            <td>`sizeLimit`</td>
            <td>integer</td>
            <td>`0` (no limit)</td>
            <td>Maximum allowable size, in bytes, for a file.</td>
        </tr>
        <tr>
            <td>`minSizeLimit`</td>
            <td>integer</td>
            <td>`0` (no limit)</td>
            <td>Minimum allowable size, in bytes, for a file.</td>
        </tr>
        <tr>
            <td>`inputName`</td>
            <td>string</td>
            <td>`qqfile`</td>
            <td>This usually only useful with the ajax uploader, which sends the name of the file as a parameter, using a key name
            equal to the value of this options.  In the case of the form uploader, this is simply the value of the `name` attribute
            of the file's associated `input` element.</td>
        </tr>
            <td>`extraDropzones`</td>
            <td>array of elements</td>
            <td>`[]`</td>
            <td>Useful if you'd like to to designate additional dropozones for file input.  Of course, this is not relevant if the
            form uploader is used.</td>
        </tr>
    </tbody>
<table>


Instance methods

* `setParams(newParams)`

#### Changing alert/messages to something more user friendly ####

If you limited file types and max size, you will probably want to change the default alert and
messages as you see fit, this is possible using showMessage callback and messages option.

#### Sending additional params ####

To add a parameter that will be passed as a query string with each upload use params option.

```javascript
    var uploader = new qq.FileUploader({
        element: document.getElementById('file-uploader'),
        action: '/server-side.upload',
        // additional data to send, name-value pairs
        params: {
            param1: 'value1',
            param2: 'value2'
        }
    });
```

To change params based on the state of your app, use

```javascript
    uploader.setParams({
       anotherParam: 'value'
    });
```

It can be nicely used in `onSubmit` callback.

#### Troubleshooting ####

If you can't get the uploader to work, please try the following steps
before asking for help.

If the upload doesn't complete, saying "failed":

* Set the `debug` option of the FileUploader to true.
* Open the page where you have a FileUploader.
* Open developer console in your browser.
* Try to upload the file. You should see a server response.

It should be `{success:true}` for completed requests. If it's not,
then you have a problem with your server-side script.

#### Contributors ####

Thanks to everybody who contributed, either by sending bug reports or donating. The project wouldn't be possible without all this generous help. Thank you!
