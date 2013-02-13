## How to Override Options ##
This is mostly obvious, but you should know that it is actually much easier to override
"sub-properties" than expected.  Take the `messages` option (object) in FineUploaderBasic,
for example.  Suppose you only want to override the `typeError` default message, but want to
use the default values for the other messages properties.  Well, simply define a new value for the
`typeError` property when initializing your FineUploaderBasic (or FineUploader) instance:
```javascript
messages: {
   typeError: "This is not a valid type"
}
```
Fine Uploader will know that you only want to change the `typeError` message value and keep all of the
other default values.  This works for all options that are, themselves, objects with sub-options.


