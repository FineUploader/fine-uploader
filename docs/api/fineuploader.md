## FineUploader mode API functions ##
Note that all [FineUploaderBasic mode API functions](api-fineuploaderbasic.md) are all available when running in FineUploader mode.

* `getItemByFileId(String id)` - Returns the HTMLElement associated with the passed file or `Blob` ID.
* `addExtraDropzone(HTMLElement element)` - Use this to mark an element as a drop zone on an already-instantiated FineUploader.
* `removeExtraDropzone(HTMLElement element)` - Use this to un-mark an extra element as a drop zone on an already-instantiated FineUploader.  An "extra"
   drop zone is one specified in the `extraDropzones` option, or one set via the `addExtraDropzone` function.
