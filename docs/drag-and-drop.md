## File Drag and Drop Module ##

#### Note: This module is aimed at FineUploaderBasic mode integrators only.  If you are running the library in FineUploader mode,
have a look at the [dragAndDrop options](options-fineuploader.md#draganddrop-option-properties) instead. ####

If you are integrating Fine Uploader and utilizing FineUploaderBasic mode, you are likely building you own UI entirely.
In case you want to support drag and drop of folders and files, you probably don't want to re-invent the wheel, since
Fine Uploader already has code to handle this in FineUploader mode.  Fine Uploader's drag & drop code has been moved into
a standalone module, so it can be easily integrated into your FineUploaderBasic mode app (or even any non-Fine Uploader app).
This document will explain how to utilize this module.


### Example ###

```javascript
var dragAndDropModule = new qq.DragAndDrop({
        dropZoneElements: [document.getElementById('myDropZone')],
        classes: {
          dropActive: "cssClassToAddToDropZoneOnEnter"
        },
        callbacks: {
          processingDroppedFiles: function() {
            //TODO: display some sort of a "processing" or spinner graphic
          },
          processingDroppedFilesComplete: function(files) {
            //TODO: hide spinner/processing graphic

            fineUploaderInstance.addFiles(files); //this submits the dropped files to Fine Uploader
          }
        }
      }),

  fineUploaderInstance = new qq.FineUploaderBasic({
    request: {
        endpoint: "server/uploadHandler"
    }
  });
```

### Options ###
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
            <td>dropZoneElemenets</td>
            <td>array of HTML elements</td>
            <td>[]</td>
            <td>Use this option to specify all container elements that should be treated as drop zones by the module.</td>
        </tr>
        <tr>
            <td>hideDropZonesBeforeEnter</td>
            <td>boolean</td>
            <td>false</td>
            <td>Set this to true if you would like to ensure that the contents of all drop zones are only revealed when
            a file has entered the drop zone.</td>
        </tr>
        <tr>
            <td>allowMultipleItems</td>
            <td>boolean</td>
            <td>true</td>
            <td>Set this to false if you would like to prevent a user from dropping more than one item at once.</td>
        </tr>
    </tbody>
</table>

#### `classes` option ###
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
            <td>dropActive</td>
            <td>string</td>
            <td>null</td>
            <td>Specify a CSS class you would like the module to assign to the drop zone when a file has entered the drop zone.</td>
        </tr>
    </tbody>
</table>

#### `callbacks` option ####
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>arguments</th>
            <th>Note</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>processingDroppedFiles</td>
            <td>none</td>
            <td>Invoked when the module has started processing the set of dropped files.</td>
        </tr>
        <tr>
            <td>processingDroppedFilesComplete</td>
            <td>array of <code>File</code> objects</td>
            <td>Invoked when the module has finished processing the set of dropped files.  The parameter passed to this
            callback represents all files parsed by the module from the associated drop event.</td>
        </tr>
    </tbody>
</table>



