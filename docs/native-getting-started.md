## Getting started for non-jQuery users ##
Of course, Fine Uploader does NOT depend on jQuery, and you don't have to use the jQuery plug-in if you don't want to.
The same features are available without the jQuery plug-in.  To use Fine Uploader with "plain 'ole" javascript,
include the uploader javascript file and, optionally, the css file along with any images provided into your page.
If you are only making use of FineUploaderBasic, you can omit the css and image(s) file(s).

```html
<div id="fine-uploader">
    <noscript>
        <p>Please enable JavaScript to use Fine Uploader.</p>
        <!-- or put a simple form for upload here -->
    </noscript>
</div>
```

Initialize uploader when the DOM is ready. Change the endpoint option.
In the server folder you will find some examples for different platforms.
If you can't find the one you need, please read up on handling multipart form
requests and XHR upload requests in your server-side language of choice.

```javascript
var uploader = new qq.FineUploader({
	// pass the dom node (ex. $(selector)[0] for jQuery users)
	element: document.getElementById('fine-uploader'),

	request: {
      		// path to server-side upload script
		endpoint: '/server/upload'
	}
});
```

For more examples, please have a look at [fineuploader.com](http://fineuploader.com).


