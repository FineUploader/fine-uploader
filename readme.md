[donation_link]: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=3PMY37SL9L888&lc=US&item_name=JavaScript%20file%20uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted

This plugin uses XHR for uploading multiple files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in other browsers,
providing good user experience everywhere.

### <a href="http://valums.com/files/2010/file-uploader/demo.htm">Demo</a> [Donate][donation_link] ###

### Features ###
* multiple file select, progress-bar in FF, Chrome, Safari
* drag-and-drop file select in FF, Chrome 
* uploads are cancellable
* no external dependencies
* doesn't use Flash
* fully working with https
* keyboard support in FF, Chrome, Safari
* tested in IE7,8; Firefox 3,3.6,4; Safari4,5; Chrome; Opera10.60;

### License ###
This plugin is open sourced under <a href="http://www.gnu.org/licenses/gpl-2.0.html">GNU GPL 2</a> or later.
If this license doesn't suit you mail me at andrew (at) valums.com.

Please [donate][donation_link] if you are willing to support the further development of file upload plugin.  

### Known Issues ###
Plugin breaks back button functionality in Opera.
	
### Getting started ###
The fileuploader.js contains two classes that are meant to be used directly.
If you need a complete upload widget (from demo) to quickly drop
into your current design, use qq.FileUploader.

If you want to customize uploader, by using a different looking file list
or change the behaviour or functionality use qq.FileUploaderBasic.

The difference between them is that qq.FileUploader provides a list of files,
drag-and-drop, but qq.FileUploaderBasic only creates button and handles validation.
Basic uploader is easier extendable, and doesn't limit possible customization.

qq.FileUploader extends qq.FileUploaderBasic, so that all the options present
in the basic uploader also exist in the full widget.  

### qq.FileUploader - Setting up full upload widget ###

Include fileuploader.js and fileuploader.css into your page.
Create container element.

    <div id="file-uploader">       
        <noscript>          
            <p>Please enable JavaScript to use file uploader.</p>
            <!-- or put a simple form for upload here -->
        </noscript>         
    </div>
    
Initialize uploader when the DOM is ready. Change the action option.
For example ../server/php.php for the default folder structure.
In the server folder you will find examples for different platforms.
If you can't find the one you need, check the readme.txt in the same folder. 

    var uploader = new qq.FileUploader({
        // pass the dom node (ex. $(selector)[0] for jQuery users)
        element: document.getElementById('file-uploader'),
        // path to server-side upload script
        action: '/server/upload'
    }); 

### Options of both classes ###
    
    // url of the server-side upload script, should be on the same domain
    action: '/server/upload',
    // additional data to send, name-value pairs
    params: {},
    
    // validation    
    // ex. ['jpg', 'jpeg', 'png', 'gif'] or []
    allowedExtensions: [],        
    // each file size limit in bytes
    // this option isn't supported in all browsers
    sizeLimit: 0, // max size   
    minSizeLimit: 0, // min size
    
    // set to true to output server response to console
    debug: false,
    
    // events         
    // you can return false to abort submit
    onSubmit: function(id, fileName){},
    onProgress: function(id, fileName, loaded, total){},
    onComplete: function(id, fileName, responseJSON){},
    onCancel: function(id, fileName){},
    
    messages: {
        // error messages, see qq.FileUploaderBasic for content            
    },
    showMessage: function(message){ alert(message); }        

Instance methods

* setParams(newParams)         

#### Changing alert/messages to something more user friendly ####

If you limited file types and max size, you will probably want to change the default alert and
messages as you see fit, this is possible using showMessage callback and messages option.

#### Sending additional params ####

To add a parameter that will be passed as a query string with each upload use params option. 

    var uploader = new qq.FileUploader({
        element: document.getElementById('file-uploader'),
        action: '/server-side.upload',
        // additional data to send, name-value pairs
        params: {
            param1: 'value1',
            param2: 'value2'
        }
    });

To change params based on the state of your app, use 
    
    uploader.setParams({
       anotherParam: 'value' 
    });

It can be nicely used in onSubmit callback.      

#### Troubleshooting ####

If you can't get the uploader to work, please try the following steps
before asking for help.

If the upload doesn't complete, saying failed.

* Set the debug option of the FileUploader to true.
* Open the page where you have a FileUploader.
* Open developer console in your browser.
* Try to upload the file. You should see a server serponse.

It should be {success:true} for completed requests. If it's not,
then you have a problem with your server-side script.

#### Contributors ####

Thanks to everybody who contributed, either by sending bug reports or donating. And special thanks to:

John Yeary  
Sidney Maestre  
Patrick Pfeiffer  
Sean Sandy (SeanJA)  
Andy Newby     
Ivan Valles  