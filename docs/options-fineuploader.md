## FineUploader mode options ##
Note that all [FineUploaderBasic mode options](options-fineuploaderbasic.md) are also available in FineUploader mode.

<br/>
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
            <td>element</td>
            <td>element</td>
            <td>null</td>
            <td>Container for the default drop zone (if supported by browser) and files/`Blob` objects list.  <b>Required</b></td>
        </tr>
        <tr>
            <td>listElement</td>
            <td>element</td>
            <td>null</td>
            <td>Container for the file or `Blob` list.  If null, the list defined in the template will be used.</td>
        </tr>
    </tbody>
</table>

### `dragAndDrop` option properties: ###
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
            <td>extraDropzones</td>
            <td>array of elements</td>
            <td>[]</td>
            <td>Useful if you'd like to to designate additional dropozones for file input.  Of course, this is not relevant if the
            form uploader is used.</td>
        </tr>
        <tr>
            <td>hideDropzones</td>
            <td>boolean</td>
            <td>true</td>
            <td>Useful if you do not want all dropzone elements to be hidden.  It is expected that some CSS would accompany setting
            this option to false.  You may set this to false if you want to wrap some visible elements, such as the listElement,
            in a drop zone.</td>
        </tr>
        <tr>
            <td>disableDefaultDropzone</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if you are contributing your own drop zone(s) and do not want to use the default one.</td>
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
            <td>uploadButton</td>
            <td>string</td>
            <td>Upload a file</td>
            <td>Label for the file selector button</td>
        </tr>
        <tr>
            <td>cancelButton</td>
            <td>string</td>
            <td>cancel</td>
            <td>The cancel button text (which is more of a link than a button).</td>
        </tr>
        <tr>
            <td>retry</td>
            <td>string</td>
            <td>Retry</td>
            <td>The retry (a failed upload) link text.</td>
        </tr>
        <tr>
            <td>failUpload</td>
            <td>string</td>
            <td>Upload failed</td>
            <td>Text that appears next to a failed file or `Blob` item</td>
        </tr>
        <tr>
            <td>dragZone</td>
            <td>string</td>
            <td>Drop files here to upload</td>
            <td>Text that appears in the drop zone when it is visible</td>
        </tr>
        <tr>
            <td>dropProcessing</td>
            <td>string</td>
            <td>Processing dropped files...</td>
            <td>Text that appears next to the drop processing spinner while we are waiting for the upload to finish processing dropped files or directories.</td>
        </tr>
        <tr>
            <td>formatProgress</td>
            <td>string</td>
            <td>{percent}% of {total_size}</td>
            <td>Text that appears next to a file or `Blob` as it is uploading (if the browser supports the file API)</td>
        </tr>
        <tr>
            <td>waitingForResponse</td>
            <td>string</td>
            <td>Processing...</td>
            <td>Text that appears next to a file or `Blob` after last byte has been sent (according to the UA) while we are wating for a response from the server.</td>
        </tr>
    </tbody>
</table>

### `failedUploadTextDisplay` option properties: ###
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
            <td>mode</td>
            <td>string</td>
            <td>default</td>
            <td>Valid values are "default" (display the text defined in <code>failUploadText</code> next to each
            failed file), "none" (don't display any text next to a failed file), and "custom" (display error response text from the
            server next to the failed file or `Blob`).</td>
    	</tr>
    	<tr>
            <td>maxChars</td>
            <td>integer</td>
            <td>50</td>
            <td>The maximum amount of character of text to display next to the file or `Blob`.  After the limit has been reached,
            "..." will terminate the string.  This is ignored unless <code>mode</code> is "custom".</td>
    	</tr>
    	<tr>
            <td>responseProperty</td>
            <td>string</td>
            <td>error</td>
            <td>The property from the server response containing the error text to display next to the
            failed file or `Blob`.  This is ignored unless <code>mode</code> is "custom".</td>
    	</tr>
    	<tr>
            <td>enableTooltip</td>
            <td>boolean</td>
            <td>true</td>
            <td>If set to true, a tooltip will display the full contents of the error message when the mouse pointer
            hovers over the failed file or `Blob`.  Note that this currently uses the title attribute of the failed item element.</td>
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
            <td>tooManyFilesError</td>
            <td>string</td>
            <td>You may only drop one file</td>
            <td>Text sent to `showMessage` and the `onError` callback when `multiple` is `false` and more the one file is dropped at once.</td>
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
            <td>showAutoRetryNote</td>
            <td>boolean</td>
            <td>true</td>
            <td>If set to <code>true</code>, a status message will appear next to the file or `Blob` during automatic retry attempts.</td>
        </tr>
        <tr>
            <td>autoRetryNote</td>
            <td>string</td>
            <td>Retrying {retryNum}/{maxAuto}...</td>
            <td>The text of the note that will optionally appear next to the file or `Blob` during automatic retry attempts.  Ignored
            if <code>showAutoRetryNote</code> is <code>false</code>.</td>
        </tr>
        <tr>
            <td>showButton</td>
            <td>boolean</td>
            <td>false</td>
            <td>If <code>true</code>, a button/link will appear next to a failed file or `Blob` after all retry attempts have been
            exhausted, assuming the server has not prohibited further retry attempts via the <code>preventRetryResponseProperty</code>.
            This button/link will allow the user to manually order the uploader to make another attempt at uploading the
            failed file or `Blob`.  Note that this operation does respect the <code>maxConnections</code> value, so if all connections
            are accounted for, the retry attempt will be queued until a connection opens up.</td>
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
            <td>forceConfirm</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if you want to force users to confirm their choice to delete a file.
            This uses the <code>showConfirm</code> function, which is overridable.</td>
        </tr>
        <tr>
            <td>confirmMessage</td>
            <td>string</td>
            <td>Are you sure you want to delete {filename}?</td>
            <td>The message displayed in the confirm delete dialog (if enabled).  Note that the {filename} string is important,
            as Fine Uploader replaces this with the associated file name in the confirm dialog.</td>
        </tr>
        <tr>
            <td>deletingStatusText</td>
            <td>string</td>
            <td>Deleting...</td>
            <td>Status message to appear next to a file that is pending deletion.  Note that a spinner, by default, will also appear.</td>
        </tr>
        <tr>
            <td>deletingFailedText</td>
            <td>string</td>
            <td>Delete failed</td>
            <td>Status message to appear next to a file that has failed to delete.</td>
        </tr>
    </tbody>
</table>

### `display` option properties: ###
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
            <td>fileSizeOnSubmit</td>
            <td>boolean</td>
            <td>false</td>
            <td>If set to true, the file or `Blob` size (if available) will be displayed next to the file immediately after the file has been submitted/selected.
            Otherwise, it will only appear once the actual upload starts.</td>
    	</tr>
    </tbody>
</table>
