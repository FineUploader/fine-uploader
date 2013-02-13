## Styling FineUploader ##
The `template` option contains default elements with default classes that make up the uploader as a whole in the DOM.  For example,
the first default element in `template` is a `div` with a class of `qq-uploader`.  This is the parent element of the uploader.
The default drop area, button, and file list elements are also, by default, contained in this option.  You can use this option to
add additional elements, modify default template elements, etc.  There is also a `fileTemplate` option which contains
default elements that make up one file item in the file list.

Here is the default `template` option:
```html
template: '<div class="qq-uploader">' +
    ((!this._options.dragAndDrop || !this._options.dragAndDrop.disableDefaultDropzone) ? '<div class="qq-upload-drop-area"><span>{dragZoneText}</span></div>' : '') +
    (!this._options.button ? '<div class="qq-upload-button"><div>{uploadButtonText}</div></div>' : '') +
    '<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
    (!this._options.listElement ? '<ul class="qq-upload-list"></ul>' : '') +
    '</div>'
```

...and the default `fileTemplate` options:
```html
fileTemplate: '<li>' +
    '<div class="qq-progress-bar"></div>' +
    '<span class="qq-upload-spinner"></span>' +
    '<span class="qq-upload-finished"></span>' +
    '<span class="qq-upload-file"></span>' +
    '<span class="qq-upload-size"></span>' +
    '<a class="qq-upload-cancel" href="#">{cancelButtonText}</a>' +
    '<a class="qq-upload-retry" href="#">{retryButtonText}</a>' +
    '<a class="qq-upload-delete" href="#">{deleteButtonText}</a>' +
    '<span class="qq-upload-status-text">{statusText}</span>' +
    '</li>'
```

Finally, a `classes` option allows you to change the default class names for these elements.  Be sure the values in `classes`
match the class names used in the corresponding template elements (where appropriate).  The following `classes` option properties
exist in FineUploader mode (with default values in parentheses):

* `button` (qq-upload-button)
* `drop` (qq-upload-drop-area)
* `dropActive` (qq-upload-drop-area-active)
* `dropDisabled` (qq-upload-drop-area-disable)
* `list` (qq-upload-list)
* `progressBar` (qq-progress-bar)
* `file` (qq-upload-file)
* `spinner` (qq-upload-spinner)
* `finished` (qq-upload-finished)
* `retrying` (qq-upload-retrying)
* `retryable` (qq-upload-retryable)
* `size` (qq-upload-size)
* `cancel` (qq-upload-cancel)
* `deleteButton` (qq-upload-delete)
* `retry` (qq-upload-retry)
* `statusText` (qq-upload-status-text)
* `success` (qq-upload-success)
* `fail` (qq-upload-fail)
* `successIcon` (`null`)
* `failIcon` (`null`)
* `dropProcessing` (qq-drop-processing)
* `dropProcessingSpinner` (qq-drop-processing-spinner)

**Note:** If you change any of these class names _be sure_ that you also adjust the associated class name in the template.


<br/>
### Changing dialogs to something more user friendly ###
* `showMessage: function(message) {...}` - You may want to change the default alert dialog implementation and messages
as you see fit.  This is possible by overriding the `showMessage` function option.  The default `showMessage` function
simply invokes `alert` with the message text.  One instance in which this is used is when the user attempts to select an
invalid file for upload.  There are general message types with default text that can be overriden as well.
* `showConfirm: function(message, okCallback, cancelCallback) {...}` - This function is used to display a confirm dialog.  One
such feature that optionally uses this is the `deleteFile` feature.  The default implementation uses `window.confirm`, but you
may override this with something a bit nicer, if you choose.  The okCallback will be executed if the user clicks "ok" and the
`cancelCallback` if the user clicks "cancel".  The `cancelCallback` is optional, but the `okCallback` is required.
