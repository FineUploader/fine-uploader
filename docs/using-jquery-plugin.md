## Using the optional jQuery plug-in ##
A jQuery plug-in exists that wraps the native Fine Uploader code.  If you would like to reap all of the benefits that
a jQuery plug-in offers, such as use of jQuery Events, specifying elements using the jQuery object/jQuery selectors,
easy integration into your otherwise jQuery project: look no further!

To use the jQuery plug-in, ensure you include the proper Fine Uploader js file on your page, and instantiate it like so:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
});
```
**It is important to understand that the target of your plug-in should be an existing container element for your upload
component, *NOT* the button element.  Your button element must be specified separately via the `button` option.**

The above example is the simplest possible use-case.  Note that you can use any of the options available for the native
Fine Uploader and Fine Uploader Basic, with the following exceptions & additions:
* There is no need to specify the `element` option.  It will be ignored if you pass it in.  The plug-in will pass the
 `element` option for you, using the element you associated with the plug-in (the element with an id of fineUploaderElementId
 in the above example).
* If you plan on using FineUploaderBasic, include the `uploaderType` option with a value of 'basic'.  If not specified, it
is assumed that you intend to use FineUploader.

### Options that require an HTMLElement ###
For any option with an `HTMLElement` value, you can, instead, pass a jQuery object.  For example, if you specify the
`button` option, the value can be `$('#myButton')`.

If the option takes an array of `HTMLElements`, any item in the array that is a jQuery object will be evaluated and all
`HTMLElement`s associated with that jQuery object will be added to the array when it is passed to the native Fine
Uploader.  For example, if specify a value for the `extraDropzones` option, and, say, your value is
`[$('.myExtraDropzone')]`, and there are 3 elements in the DOM with this class, the plug-in will pass all 3 elements
to native Fine Uploader.

### Callbacks ###
All [callbacks defined in the native uploader](callbacks.md) are also available when using
the jQuery plug-in.  However, as is common with jQuery plug-ins, these callbacks are actually custom events.  For example,
if you want to be notified whenever an error occurs and whenever an upload has completed, your client-side code may look
something like this:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
}).on('error', function(event, id, name, reason) {
     //do something
  })
  .on('complete', function(event, id, name, responseJSON){
    //do something
  });
```

It may be important to note that the value returned from your event/callback handler may be examined by the uploader.
As the documentation states, uploads can be prevented by returning 'false' in some of your callback handlers.  This is also true
when using the jQuery plug-in.

Also, please note that the context of your event handler, by default, is the event target.  This is, in fact, true, by
default, for _all_ jQuery event handlers, not just event handlers associated with Fine Uploader.  Say you want to change
the parameters sent along with a file when handling a `submit` event.  Your code can be as simple as this:
```javascript
$('#fineUploaderElementId').fineUploader({
    request: {
        endpoint: '/upload/endpoint'
    }
}).on('submit', function(event, id, name) {
     $(this).fineUploader('setParams', {'param1': 'val1'});
  });
```

### Public API / Instance Functions ###
All public API (instance) functions defined in the native javascript uploader are accessible when
using the jQuery plug-in.  See the [FineUploaderBasic mode API functions section](api-fineuploaderbasic.md) and the
[FineUploader mode API functions section](api-fineuploader.md) for more details.  Public/instance functions on a jQuery plug-in are made accessible as recommended in the
[jQuery plug-in documentation](http://docs.jquery.com/Plugins/Authoring#Plugin_Methods).  Looking for an example?
Please see the above code fragment, where we call the `setParams` instance function and pass it an object.

For more examples using the jQuery plug-in, please have a look at [fineuploader.com](http://fineuploader.com).
