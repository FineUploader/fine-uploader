The server-side code should consist of two parts.

1. For IE6-8, Opera, older versions of other browsers you get the file as
you normally do with regular form-base uploads.

2. For browsers which upload file with progress bar, you will need to get the raw
post data and write it to the file.

## Return values ##

You should return json as a text/plain, and escape all
'<' as '&lt;', '>' as '&gt;', and '&' as '&amp;'.

Return
{"success":true} when upload was successful
{"success": false} if not successful, no specific reason
{"error": "error message to display"} if not successful, with a specific reason
