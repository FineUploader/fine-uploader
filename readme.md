This plugin uses XHR for uploading files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in IE and older browsers,
providing good experience in all browsers.

<h2>Demo - See demo.htm</h2>

<h2>TODO</h2>
    * add drag and drop

<h2>Improvements over AJAX Upload</h2>
    * progress-bar
	* ability to cancel upload
	* back button works properly
	* keyboard access supported in FF,Chrome,Safari
	* fully tested with https
	
<h2>Usage</h2>

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


