The server-side code should consist of two parts.

1. For IE6-8, Opera, older versions of other browsers you get the file as
you normally do with regular form-base uploads.

2. For browsers which upload file with progress bar, you will need to get the raw
post data and write it to the file.

## Return values ##

You should return json as a text/html, and escape all
'<' as '&lt;', '>' as '&gt;', and '&' as '&amp;'.

Return
{"success":true} when upload was successful
{"error":"error message to display"} in case of error

Send me a mail to andrew (at) valums.com, if you will have any questions.