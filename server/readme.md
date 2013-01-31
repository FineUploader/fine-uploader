# Server-Side Notes & Requirements #

## Handling the request (defaults) ##
By default Fine Uploader will send the file in the body of a multipart encoded POST request.  The filename will be encoded in
the request, but the parameters will be available in the query string only.  Note that, if chunking is enabled, the filename in the
content-disposition header of the file boundary will have a value of "blob" so you will need to parse the value of the "qqfilename"
parameter in this case to determine the name of the associated file.

<br/>
## Request Format Options ##
* If you would like to ensure all parameters are sent in the request body (instead of the query string), you
must set the `paramsInBody` request option (which will also force all requests to be multipart encoded as well).
* For more information about request parameters, see the main project readme and [this blog post about setting your own custom parameters](http://blog.fineuploader.com/2012/12/setparams-is-now-much-more-useful-in-31.html)
along with [this post about how parameters are specified in the request](http://blog.fineuploader.com/2012/11/include-params-in-request-body-or-query.html).

<br/>
## Response ##
Your server should return a [valid JSON](http://jsonlint.com/) response.  The content-type must be "text/plain".

#### Values ####
* `{"success":true}` when upload was successful.
* `{"success": false}` if not successful, no specific reason.
* `{"error": "error message to display"}` if not successful, with a specific reason.
* `{"success": false, "error": "error message to display", "preventRetry": true}` to prevent Fine Uploader from making
any further attempts to retry uploading the file
* `{"success": false, "error": "error message to display", "reset": true}` to fail this attempt and restart with the first chunk on the next attempt.  Only applies if chunking is enabled.
Note that, if resume is also enabled, and this is the first chunk of a resume attempt, this will result in the upload starting with the first chunk immediately.

Note: You can have additional custom properties in the response, but ensure that you include the "success": true property for a successful response, or it will trigger the onError callback.

<br/>
## File Chunking/Partitioning ##
If you have file chunking turned on, each file will be split up into chunks that are sent, in order, in separate requests.

On the server-side, you must acknowledge each chunked request just as you would a non-chunked request.  If your response does
not indicate success, Fine Uploader will declare the entire file a failure.  If you have auto and/or manual retry enabled,
Fine Uploader will retry beginning with the last failed partition.

You must temporarily store each partition server-side and then concatenate all parts (to arrive at the complete file) after
the last part is sent.  See the `paramNames` chunking sub-option to see what specific parameters are sent by Fine Uploader
along with each chunked request.  These parameters will be necessary to ensure you properly parse each chunked request.  You may
order Fine Uploader to restart with the first chunk on a failed attempt by returning a `reset` property in your server response
(with a value of `true`).  This is only applicable if `autoRetry` or `manualRetry` is enabled.

You should make use of the UUID parameter, passed with reach request, that uniquely identifies each file.  This may make it easier for you
to avoid collisions during accumulation of chunks between files with the same name.

Some server-side examples have been updated to handle file chunking.

For more complete details regarding the file chunking feature, along with code examples, please see [this blog post](http://blog.fineuploader.com/2012/12/file-chunkingpartitioning-is-now.html).
on the topic.

<br/>
## File Resume ##
There isn't much you need to do, server-side, to support file resume, other than what has been discussed in the file chunking
section above.  You can determine if a resume has been ordered by looking for a "qqresume" param with a value of true.  This
parameter will be sent with the first request of the resume.

It is important that you keep chunks around on the server until either the entire file has been uploaded
and all chunks have been merged, or until the number of days specified in the `cookiesExpireIn` property of the resume option have
passed.  If, for some reason, you receive a request that indicates a resume has been ordered, and one or more of the previously uploaded
chunks is missing or invalid, you can return a valid JSON response containing a "reset" property with a value of "true".  This will
let Fine Uploader know that it should start the file upload from the first chunk instead of the last failed chunk.

For more details, please read the [blog post on the file resume feature](http://blog.fineuploader.com/2013/01/resume-failed-uploads-from-previous.html).

<br/>
## Deleting Files ##
If you have enabled the `deleteFile` feature, you will need to handle `DELETE` requests server-side.  The UUID of the file
to delete will be specified as the last element of the URI path.  Any parameters specified will be added to the query string.  Success
of the request will depend solely on the response code.  Acceptable response codes that indicate success are 200, 202, and 204.
Please see [the associated blog post](http://blog.fineuploader.com/2013/01/delete-uploaded-file-in-33.html) for more information on this feature.

<br/>
## CORS Support ##
As of version 3.3, CORS is supported.  For more details on how this works, limitations, and how to properly configure your server,
please see the [blog post on CORS support](http://blog.fineuploader.com/2013/01/cors-support-in-33.html).  Also, please see the
cors option documentation in the main readme.

<br/>
###### WARNING ######
The examples in the server directory, with the exception of the Java & PHP examples, were not provided by the those associated
with Fine Uploader.  Use the examples at your own risk.  They may or may not work correctly and are NOT supported!  If
you have a problem with one of these examples, please post in the [forum](https://groups.google.com/forum/#!forum/fineuploader).
