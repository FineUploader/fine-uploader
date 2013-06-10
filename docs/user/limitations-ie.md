## Internet Explorer Limitations ##
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
            HTTP error messages" setting or by padding the response JSON with whitespace as described
            <a href="http://blogs.msdn.com/b/ieinternals/archive/2010/08/19/http-error-pages-in-internet-explorer.aspx">here</a>.</td>
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
