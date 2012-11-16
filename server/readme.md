# Server-Side Notes & Requirements #

## Handling the request ##
For user agents that do not support the File API (IE9 and older, Android 2.3.x and older, and very old versions of other
browsers), Fine Uploader will send the file in the body of a multipart encoded POST request.  The filename will be encoded in
the request, but the parameters will be available in the query string only.

For user agents that do support the File API, Fine Uploader will send an XHR POST request.  The file will be streamed, and
the filename, along with all parameters, will be available in the query string.

<br/>
## Response ##
Your server should return a [valid JSON](http://jsonlint.com/) response.  The content-type must be "text/plain".

#### Values ####
* `{"success":true}` when upload was successful.
* `{"success": false}` if not successful, no specific reason.
* `{"error": "error message to display"}` if not successful, with a specific reason.
* `{"success": false, "error": "error message to display", "preventRetry": true}` to prevent Fine Uploader from making
any further attempts to retry uploading the file

<br/>
###### WARNING ######
The examples in the server directory, with the exception of the Java example, were not provided by the those associated
with Fine Uploader.  Use the examples at your own risk.  They may or may not work correctly and are NOT supported!  If
you have a problem with one of these examples, please post in the [forum](https://groups.google.com/forum/#!forum/fineuploader).
