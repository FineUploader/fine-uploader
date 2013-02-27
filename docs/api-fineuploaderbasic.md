## FineUploaderBasic mode API functions ##
* `log(String message)` - Outputs a message to the javascript console, if possible.
* `setParams(Object newParams, [optional] Number id)` - Set the parameters sent along with the request after initializing the uploader.
You can either change the parameters for a specific file or `Blob`, or for all files and `Blob`s.  To do the latter, simply omit the `id` parameter.
See this [blog post explaining parameters](http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html)
as well as [this one explaining how this function works in 3.1 and later versions](http://blog.fineuploader.com/2012/12/setparams-is-now-much-more-useful-in-31.html).
* `setEndpoint(String endpointPath, [optional] Number id)` - Modify the location,  after initializing the uploader, where upload requests should be directed.
You can either change the endpoint for a specific file or `Blob`, or for all files and `Blob`s.  To do the latter, simply omit the `id` parameter.
* `uploadStoredFiles()` - If `!autoUpload`, this will begin uploading all queued files and `Blob`s.
* `clearStoredFiles()` - Clears the internal list of stored files and `Blob`s.  Only applicable when `autoUpload` is set to false.
* `getInProgress()` - Returns the number of files or `Blob`s that are either currently uploading or waiting in line to be uploaded.
* `retry(String id)` - Orders the uploader to make another attempt at uploading a specific file or `Blob`.  A NO-OP if the server
prohibits retries on a failed file via the <code>preventRetryResponseProperty</code>.  Note that this operation does
respect the <code>maxConnections</code> value, so if all connections are accounted for, the retry attempt will be queued
until a connection opens up.
* `cancel(String id)` - Cancels a queued or currently uploading file or `Blob`.
* `cancelAll()` - Cancels all queued or currently uploading files or `Blob`s.
* `reset()` - While this function is most useful for FineUploader, it is also available in FineUploaderBasic.  In FineUploader,
calling this function will reset all UI elements to the state they exsited in immediately after initialization.  In FineUploaderBasic,
this resets all internal variables to the state they existed in immediately after initialization.  If you are using FineUploaderBasic,
it is up to you to "reset" any of your UI elements.
* `addFiles(filesOrInputs)` - Use this if you would like to submit files to the uploader.  This may be useful if you have
a method of gathering files that does not include Fine Uploader's input button or the drag & drop support built into FineUploader.
This function accepts the following types: `File`, `input` element, or a collection of any of these types, provided the
collection object contains an (integer) index property for each contained item.
* `addBlobs(blobDataArray)` - Allows you to submit one or more `Blob` objects to be uploaded.  This is expected to be an array
of `BlobData` objects.  A `BlobData` object is simply defined by the following convention: an object with a `name` property
(used to assoicate a name with the `Blob`) and a `blob` property (with a value equal to the `Blob` you would like to upload).
Note that you may also simply pass one `Blob` or an array of `Blob` objects.  In each of these last two cases, a default name,
defined in the `blobs` option, will be used.  Also note that your `Blob` objects must be `Blob` objects, but not `File` objects.
In other words, `Blob` subtypes are not acceptable.  If you would like to upload `File` objects via the API, do so via the `addFiles` function.
* `getResumableFilesData()` - Returns an array of objects, each describing a file that is potentially resumable by this uploader instance.
If a `resume.id` property has been set, this is taken into consideration.  Each resumable file is represented by an object with the
following properties: `name` - filename, `size` - file size, `uuid` - unique ID associated w/ the file, `partIdx` - index of the part where
the resume will start.
* `getSize(id)` - Returns the size of the `File` or `Blob` represented by the passed ID.  Undefined if the file size cannot be determined, such as
if the user agent does not support the File API.
* `getFile(id)` - Returns the `File` or `Blob` object associated with the passed ID.  Undefined if the underlying `File` or `Blob` cannot be found,
or if the user agent does not support the File API.  For more info on the `File` and `Blob` objects, please see
[the File entry in the W3C spec](http://www.w3.org/TR/FileAPI/#dfn-file) and [the Blob entry in the W3C spec](http://www.w3.org/TR/FileAPI/#dfn-Blob), respectively.
* `deleteFile(id)` - This allows you to programmatically order Fine Uploader to send a DELETE request for a specific file or `Blob`.
Fine Uploader actually uses the API call internally when a user clicks the delete link in FineUploader mode.
* `setDeleteFileEndpoint(String endpointPath, [optional] Number id)` - Same as the `setEndpoint` function except this applies only to the `deleteFile` option endpoint(s).
* `getUuid(id)` - Retrieves the UUID associated with a file or `Blob`, given a current session file or `Blob` ID.

