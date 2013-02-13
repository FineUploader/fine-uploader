## Callbacks ##

For jQuery plug-in users, adhere to the following syntax:
```javascript
$('#myUploader')
    .on('complete', function(event, id, name, response) {
        ...
    })
    .on('cancel', function(event, id, name) {
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
        onComplete: function(id, name, response) {
            ...
        },
        onCancel: function(id, name) {
            ...
        },
        ...
    }
}
```

<br/>
### List of callbacks ###

* `onSubmit(String id, String name)` - called when the file or `Blob` is submitted to the uploader portion of the code.
Note that this does not mean the file upload will begin at this point.  Return `false` to prevent submission to the uploader.
* `onComplete(String id, String name, Object responseJSON)` - called when the file or `Blob` upload has finished.
* `onCancel(String id, String name)` - called when the file or `Blob` upload has been cancelled.
* `onUpload(String id, String name)` - called just before a file or `Blob` upload begins.
* `onUploadChunk(String id, String name, Object chunkData)` - called just before a `File`/`Blob` chunk/partition request is sent.  The chunkData object has
4 properties: `partIndex` (the 0-based index of the associated partition), `startByte` (the byte offset of the current chunk in terms
of the underlying `File`/`Blob`), `endByte` (the last byte of the current chunk in terms of the underlying `File`/`Blob`), and `totalParts` (the
total number of partitions associated with the underlying `File`/`Blob`).
* `onProgress(String id, String name, int uploadedBytes, int totalBytes)` - called during the upload, as it progresses.  Only used by the XHR/ajax uploader.
* `onError(String id, String name, String errorReason)` - called whenever an exceptional condition occurs (during an upload, file selection, etc).
* `onAutoRetry(String id, String name, String attemptNumber)` - called before each automatic retry attempt for a failed file or `Blob`.
* `onManualRetry(String id, String name)` - called before each manual retry attempt.  Return false to prevent this and all future retry attempts on this file or `Blob`.
* `onResume(String id, String fileName, Object chunkData)` - Called before an attempt is made to resume a failed/stopped upload from a previous session.
If you return false, the resume will be cancelled and the uploader will start uploading the file from the first chunk.  The `chunkData` object contains the properties as
the `chunkData` parameter passed into the `onUploadChunk` callback.
* `onValidate(FileOrBlobData fileOrBlobData)` - This callback represents one of the files or `Blob`s selected for upload.  It is called once
for each selected, dropped, or `addFiles` submitted file and for each `addBlobs` submitted `Blob`, provided you do not return false in your `onValidateBatch` handler, and also provided
the `stopOnFirstInvalidFile` validation option is not set and a previous invocation of your `onValidate` callback in this batch has not returned false.
This callback is always invoked before the default Fine Uploader validators execute.  Note that a `FileOrBlobData` object has two properties: `name`
and `size`.  The `size` property will be undefined if the user agent does not support the File API.
* `onValidateBatch(Array fileOrBlobDataArray)` - This callback is invoked once for each batch of files or `Blob`s selected, dropped, or submitted
via the `addFiles` or `addBlobs`  API functions.  A FileOrBlobData array is passed in representing all files or `Blob`s selected or dropped at once.  This allows
you to prevent the entire batch from being uploaded, if desired, by returning false.  If your handler does not return false,
the `onValidate` callback will be invoked once for each individual file or `Blob` submitted.  This callback is always invoked before
the default Fine Uploader validators execute.  Note that a `FileOrBlobData` object has two properties: `name` and `size`.
The `size` property will be undefined if the user agent does not support the File API.
* `onSubmitDelete(id)` - Called before a file or `Blob` that has been marked for deletion has been submitted to the uploader.
You may return false from your handler if you want to ignore/stop the delete request.
* `onDelete(id)` - Called just before a delete request is sent for the associated file or `Blob`.  The parameter is the ID.
* `onDeleteComplete(id, xhr, isError)` - Called after receiving a response from the server for a DELETE request.  The associated
ID, along with the request's XMLHttpRequest object and a boolean indicating whether the response succeeded or not (based on the response code)
are sent along as parameters.


