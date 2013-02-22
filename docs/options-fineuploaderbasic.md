## FineUploaderBasic mode options ##
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
            <td>In FineUploaderBasic mode, this will simply prevent you from simultaneously selecting or dropping more than one file or `Blob`.
            In FineUploader mode, dropping or selecting another file or `Blob` will clear the upload list.  If another is already uploading, it will
            be cancelled.  If you you want Fine Uploader to simply ignore subsequently dropped/selected items, simply return false
            in your <code>onValidate</code> or <code>onSumbit</code> callback handler for any subsequent item that has been dropped.  Note that the behavior
            described for FineUploader mode is in addition to the behavior already provided by FineUploaderBasic mode.</td>
        </tr>
        <tr>
            <td>maxConnections</td>
            <td>integer</td>
            <td>3</td>
            <td>Maximum allowable concurrent requests (per request-type).  For example, if the number is 3, you will be limited to
            3 concurrent deleteFile requests and 3 concurrent upload requests, along with 3 of whatever other request types Fine Uploader supports.</td>
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
            <td>Set to false if you want to be able to begin uploading selected/queued items later, by calling uploadStoredFiles().</td>
        </tr>
        <tr>
            <td>formatFileName</td>
            <td>function</td>
            <td>(see source code)</td>
            <td>By default, this function limits the name displayed in the UI or error messages to 33 characters,
            plus 3 ellipses separating the first several and the last several characters of the item name.  Override this function
            if you want more control over the display of item names.</td>
        </tr>
    </tbody>
</table>
### `request` option properties: ###
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
            <td>While form-based uploads will always be multipart requests, this forces XHR uploads to send files or `Blob` objects using
            multipart requests as well.</td>
        </tr>
        <tr>
            <td>inputName</td>
            <td>string</td>
            <td>qqfile</td>
            <td>This usually only useful with the ajax uploader, which sends the name of the file or `Blob` as a parameter, using a key name
            equal to the value of this options.  In the case of the form uploader, this is simply the value of the name attribute
            of the file's associated input element.</td>
        </tr>
        <tr>
            <td>uuidName</td>
            <td>string</td>
            <td>qquuid</td>
            <td>The name of the parameter, sent along with each request, that uniquely identifies the associated file or `Blob`.  The value of
            this parameter is a version 4 UUID.</td>
        <tr>
            <td>totalFileSizeName</td>
            <td>string</td>
            <td>qqtotalfilesize</td>
            <td>Name of the parameter passed with a multipart encoded request that specifies the total size in bytes of the associated file or `Blob`.
            Note that this is only passed with MPE requests that originate from the XHR uploader, since there is no way to
            determine file size client-side when using the form uploader.</td>
        </tr>
        </tr>
    </tbody>
</table>

### `validation` option properties: ###
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
            <td>This option is used solely by the file selection dialog.  If you'd like to restrict valid file types that appear in the
            selection dialog, you can do this here by listing valid content type specifiers.  See the [documentation on the accept
            attribute of the input element](https://developer.mozilla.org/en-US/docs/HTML/Element/Input) for more information.</td>
        </tr>
        <tr>
            <td>sizeLimit</td>
            <td>integer</td>
            <td>0 (no limit)</td>
            <td>Maximum allowable size, in bytes, for a file or `Blob`.</td>
        </tr>
        <tr>
            <td>minSizeLimit</td>
            <td>integer</td>
            <td>0 (no limit)</td>
            <td>Minimum allowable size, in bytes, for a file or `Blob`.</td>
        </tr>
        <tr>
            <td>stopOnFirstInvalidFile</td>
            <td>boolean</td>
            <td>true</td>
            <td>If true, when submitting multiple files or `Blob` objects, once an item is determined to be invalid, the upload process
            will terminate.  If false, all valid items will be uploaded.  Note: One downside to a false value can be
            seen when using FineUploader if the default <code>showMessage</code> implementation is not overriden.  In this
            case, an alert  dialog will appear for each invalid item in the batch, and the upload process will not continue
            until the dialog is dismissed.  If this is bothersome, simply override <code>showMessage</code> with a
            desirable implementation.
        </tr>
    </tbody>
</table>

### `messages` option properties: ###
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
            <td>typeError</td>
            <td>string</td>
            <td>{file} has an invalid extension. Valid extension(s): {extensions}.</td>
            <td>Text sent to the `onError` callback (and `showMessage` if running in FineUploader mode) if an invalid file type
            is submitted, according to the validation settings.</td>
    	</tr>
        <tr>
            <td>sizeError</td>
            <td>string</td>
            <td>{file} is too large, maximum file size is {sizeLimit}.</td>
            <td>Text sent to the `onError` callback (and `showMessage` if running in FineUploader mode) if a file or `Blob` that is
            too large, according to the validation settings, is submitted.</td>
    	</tr>
        <tr>
            <td>minSizeError</td>
            <td>string</td>
            <td>{file} is too small, minimum file size is {minSizeLimit}.</td>
            <td>Text sent to the `onError` callback (and `showMessage` if running in FineUploader mode) if a file or `Blob` that is
            too small, according to the validation settings, is submitted.</td>
    	</tr>
        <tr>
            <td>emptyError</td>
            <td>string</td>
            <td>{file} is empty, please select files again without it.</td>
            <td>Text sent to the `onError` callback (and `showMessage` if running in FineUploader mode) if a zero-sized
            file or `Blob` is submitted.</td>
    	</tr>
        <tr>
            <td>noFilesError</td>
            <td>string</td>
            <td>No files to upload.</td>
            <td>Text sent to the `onError` callback (and `showMessage` if running in FineUploader mode) if a an empty
            array of files or `Blob` objects is submitted.</td>
    	</tr>
        <tr>
            <td>onLeave</td>
            <td>string</td>
            <td>The files are being uploaded, if you leave now the upload will be cancelled.</td>
            <td>Message display to the user (by the browser) if the user attempts to leave the page while uploads are still
            in progress.</td>
    	</tr>
    </tbody>
</table>

### `retry` option properties: ###
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
            attempt to upload the file or `Blob` again.</td>
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
            will not allow any further retries of this file or `Blob` (manual or automatic).</td>
        </tr>
    </tbody>
</table>

### `chunking` option properties: ###
For more complete details regarding the file chunking feature, along with code examples, please see [this blog post](http://blog.fineuploader.com/2012/12/file-chunkingpartitioning-is-now.html).
on the topic.
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
            <td>If set to <code>true</code>, each file or `Blob` will be split up into parts.  Each part will be sent in a separate request.
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

### `chunking.paramNames` option properties: ###
For more complete details regarding the file chunking feature, along with code examples, please see [this blog post](http://blog.fineuploader.com/2012/12/file-chunkingpartitioning-is-now.html).
on the topic.
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
            <td>Name of the parameter passed with a chunked request that specifies the total number of chunks associated with the underlying file or `Blob`.</td>
        </tr>
        <tr>
            <td>filename</td>
            <td>string</td>
            <td>qqfilename</td>
            <td>Name of the parameter passed with a chunked request that specifies the name of the associated file or `Blob`.  This is useful for chunked
            requests that are multipart encoded, since the filename reported by the user agent in the content-disposition header
            will be either "blob" or an empty string.</td>
        </tr>
    </tbody>
</table>

### `resume` option properties: ###
For more details, please read the [blog post on the file resume feature](http://blog.fineuploader.com/2013/01/resume-failed-uploads-from-previous.html).
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

### `resume.paramNames` option properties: ###
For more details, please read the [blog post on the file resume feature](http://blog.fineuploader.com/2013/01/resume-failed-uploads-from-previous.html).
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

### `text` option properties: ###
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

### `deleteFile` option properties: ###
For more information on the Delete File feature, please read the [associated blog post](http://blog.fineuploader.com/2013/01/delete-uploaded-file-in-33.html) and
check out the server-side readme.
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
            <td>Set this to true if you would like to allow users to delete uploaded files.  In FineUploader mode,
            this will also render a "delete" link next to each successfully uploaded file or `Blob`.</td>
        </tr>
        <tr>
            <td>endpoint</td>
            <td>string</td>
            <td>/server/upload</td>
            <td>This should be the endpoint to where any DELETE (file) request should be sent.  Note that this is a DELETE
            request, and the UUID of the associated file is sent as the last part of the URI path.</td>
        </tr>
        <tr>
            <td>customHeaders</td>
            <td>object</td>
            <td>{}</td>
            <td>Any additional headers to attach to all DELETE (file) requests.</td>
        </tr>
        <tr>
            <td>params</td>
            <td>object</td>
            <td>{}</td>
            <td>Any additional parameters to attach to DELETE (file) requests.  This works the exact same way as the
            <code>params</code> property of the <code>request</code> option.  Note that all parameters are sent in the
            query string.</td>
        </tr>
    </tbody>
</table>

### `cors` option properties: ###
For more information on CORS support, please read the [associated blog post](http://blog.fineuploader.com/2013/01/cors-support-in-33.html) and
check out the server-side readme.
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
            <td>expected</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if all requests will be cross-domain requests.  If this is set to true, all iframe-initiated requests
            must include responses that follow the convention described in the CORS support blog post.</td>
        </tr>
        <tr>
            <td>sendCredentials</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if you would like credentials (i.e. cookies) sent along with each CORS request.  Your response must,
            as a result, include the appropriate headers.</td>
        </tr>
    </tbody>
</table>

### `blobs` option properties: ###
Options used when `Blob` objects are to be uploaded.
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
            <td>defaultName</td>
            <td>string</td>
            <td>Misc data</td>
            <td>If you do not include a name along with the `Blob` submitted to the uploader (via a `BlobData` object) this
            default name will be used.</td>
        </tr>
    </tbody>
</table>

### `blobs.paramNames` option properties: ###
Options used when `Blob` objects are to be uploaded.
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
            <td>name</td>
            <td>string</td>
            <td>qqblobname</td>
            <td>A request parameter used to specify the associated name with any uploaded `Blob`.</td>
        </tr>
    </tbody>
</table>

