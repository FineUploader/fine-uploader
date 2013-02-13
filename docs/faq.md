## Frequently Asked Questions (FAQ) ##
**Q:** Why are you charging me to download a zip containing the combined js files, along with a minified version, the
version-stamped css file, and all other required files?
**A:** Fine Uploader is a lot of work.  I literally work on Fine Uploader, in my free time, 7 days a week.  I've kept up this
schedule since August.  As a result Fine Uploader grows at a rapid pace, bugs are addressed quickly, and the support I provide
for users is second-to-none.  Compensation provides me with an excuse to keep up the work I am doing.  The other alternative is
a project that decays and becomes unusable or out-of-date after some time.  If, for some reason, you don't want to
contribute to those that have worked so hard to provide you with this solution at a very modest price, you can certainly
make use of the source code posted in the Github repo.  The project is, after all, open-source.

**Q**: In IE, when my server returns its response to an upload request, I see a "Save As..." dialog box on the client.  What am I doing wrong?
**A**: Your server's response content-type MUST be "text/plain".  IE does not handle the "application/json" mime-type.  You have
probably read advice from others that claim "text/html" is also safe.  This is not always true.  You will run into problems with a content-type
of "text/html" if your JSON response contains HTML.

**Q:** I like FineUploader mode, but I don't want to allow my users to utilize the drag & drop feature.  How can I do this?
**A:** Set the `disableDefaultDropzone` property of the `dragAndDrop` option to `true`.

**Q:** Using the jQuery plug-in in FineUploaderBasic mode, I can't seem to get my upload button to appear.
**A:** It is important to understand that the target of your plug-in should be an existing container element for your upload
component, *NOT* the button element.  Your button element must be specified separately via the `button` option.

**Q:** Why am I seeing an "Access Denied" error in IE's javascript console?
**A:** There are two common causes.  One cause is triggering the "select files" dialog via javascript.  IE does not permit this
and will throw a security error when Fine Uploader attempts to submit the underlying form.  Another cause is returning a
response code that is not 200.  The error occurs when Fine Uploader attempts to parse the response in the hidden iframe.
See the [Internet Explorer Limitations](limitations-ie.md) for more details.

**Q:** Why can't I use a progress bar, drag and drop, multiple file selection, chunking, or auto-resume in some browsers?
**A:** Some browsers (IE9 and older, along with Android 2.3.x and older) do not support the File API the `multiple` attribute on file input elements.
These are all required to give you the best possible experience.

**Q:** Why isn't Opera supported?
**A:** Market share for Opera is incredibly low, and I have found annoying bugs in Opera that have taken up an unnecessary amount of my
time in the past.  For such a small minority of users, I have decided that it is not worth my time.  There are many better options as far
as browsers are concerned.

**Q:** Why isn't Safari for Windows supported?
**A:** There is really no reason to use Safari for Windows.   Webkit is better represented on that platform in Chrome.
Apple doesn't appear to be interested in maintaining Safari for Windows anymore either.  Switch to Chrome.

**Q:** Why isn't IOS5 supported?
**A:** IOS5 doesn't even support a file input element.

**Q:** Why isn't folder drag & drop uploading supported in any browser other than Chrome 21+?
**A:** Chrome 21 was the first browser version to implement the HTML5 Filesystem API.  This is required to handle dropped folders.
Currently, no other browsers support this API.

**Q:** I have created a \<button\> element for my uploader button, but this doesn't seem to work in IE.  Why?
**A:** In IE, the button element receives the click event, instead of the child input element.  Use a \<div\> or a \<span\> or an \<a\> instead.

**Q:** Why do I only see a "Processing..." message next to a file (in FineUploader mode) in Chrome & Safari after the last byte has been sent but the server has yet to respond?
**A:** The implementation of the onProgress notification that tells us the status of the bytes sent to the server varies from browser to browser, unfortunately.
Webkit browsers have elected to follow the "spirit" of the W3C spec, while Firefox, and (I beleive) IE10, obey the spec in the most strict sense.  I have discussed
this in some detail [in the "processing" status message feature case](https://github.com/valums/file-uploader/issues/404#issuecomment-10124160).

**Q:** When chunking and multipart encoded are both enabled, why must I determine the original file's name by parsing the qqfilename parameter?
**A:** The file data is stored in one of the multipart boundaries contained in the request payload.  Normally, the
content-disposition header for this boundary contains the actual file name.  However, when the file is split up into parts
client-side, we are sending a [Blob](http://www.w3.org/TR/FileAPI/#dfn-Blob) to represent a different part of the
[File](http://www.w3.org/TR/FileAPI/#dfn-file) in each request.  A [FormData](http://www.w3.org/TR/2010/WD-XMLHttpRequest2-20100907/#the-formdata-interface) object is used to construct these
requests.  When a Blob is added to a FormData object, the user agent sets the content-disposition header for the associated
multipart boundary in the request to "blob" (or sometimes an empty or random string).  As a result, we must
pass the original file name in a parameter.

**Q:** How can I prevent users from dropping folders into browsers that do not support folder uploading?
**A:** There is no reliable way to prevent users from dropping folders into the drop zone of any browser other than
Chrome 21+, currently.  This is due to the fact that there is no way to reliably detect if a folder has been dropped
unless the user agent implements the [Filesystem API](http://www.w3.org/TR/file-system-api/). Folder dropping is only
supported in Chrome 21+, since this is the only browser that implements the Filesystem API.  You can parse the user
agent string to determine if folder dropping is supported, and then inform your users in your application's UI.
Theoretically, you could check for the appropriate function on the [DataTransfer](http://www.w3.org/TR/2011/WD-html5-20110113/dnd.html#the-datatransfer-interface)
object prototype, but this would not work cross-browser, since webkit does not expose this interface, unfortunately.
