TODO
    * add drag and drop

This plugin uses XHR for uploading files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in IE and older browsers,
providing good experience in all browsers.

<h3>Demo - See demo.htm</h3>
<h3>Features</h3>

* * progress-bar
* ability to cancel upload
* back button works properly
* keyboard access supported in FF,Chrome,Safari
* fully tested with https
	
<h3>Usage</h3>

1. Create container element.

    <div id="file-uploader">       
      <noscript>          
        <p>Please enable JavaScript to use file uploader.</p>
        <!-- or put a simple form for upload here -->
      </noscript>         
    </div>
    
2. Initialize uploader when the DOM is ready.

    var uploader = new qq.FileUploader({
      // pass dom node (ex. $(selector)[0] for jQuery users)
      element: document.getElementById('file-uploader'),      
      // path to server-side upload script 
      action: '/server-side.upload'
    });


