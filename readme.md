[donation_link]: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=3PMY37SL9L888&lc=US&item_name=JavaScript%20file%20uploader&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted

This plugin uses XHR for uploading multiple files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in other browsers,
providing good user experience everywhere.

### <a href="http://valums.com/files/2010/file-uploader/demo.htm">Demo</a> [Donate][donation_link] ###

### Features ###
* multiple file select in FF, Chrome, Safari
* progress-bar in FF, Chrome6+, Safari
* drag-and-drop file select in FF, Chrome 
* stylable via CSS
* uploads are cancellable
* no external dependencies
* doesn't use Flash
* fully working with https
* keyboard support in FF, Chrome, Safari
* tested in IE7,8; Firefox 3,3.5,3.6; Safari4,5; Chrome5,6; Opera10.60;

### License ###
This plugin is open sourced under <a href="http://www.gnu.org/licenses/gpl-2.0.html">GNU GPL 2</a> or later.
If this license doesn't suit you contact andrew (at) valums.com for another options.

Please [donate][donation_link] if you are willing to support the further development of file upload plugin.  

### Known Issues ###
Plugin breaks back button functionality in Opera.
	
### Setting up ###

Include fileuploader.js and fileuploader.css into your page.

Create container element.

    <div id="file-uploader">       
        <noscript>          
            <p>Please enable JavaScript to use file uploader.</p>
            <!-- or put a simple form for upload here -->
        </noscript>         
    </div>
    
Initialize uploader when the DOM is ready.

    var uploader = new qq.FileUploader({
        // pass the dom node (ex. $(selector)[0] for jQuery users)
        element: document.getElementById('file-uploader'),
        // path to server-side upload script
        action: '/server/upload'
    });

Don't forget to setup the server side script, some examples can be found in the "server" folder.
If you can't find an example for your server platform, send me a mail to andrew (at) valums.com.
I will be glad to help.

### Configuring ###

Below is the list of important options, more details are given below. 

    // container element DOM node (ex. $(selector)[0] for jQuery users)
    element: null,
    // url of the server-side upload script, should be on the same domain
    action: '/server/upload',
    // additional data to send, name-value pairs
    params: {},
    // ex. ['jpg', 'jpeg', 'png', 'gif'] or []
    allowedExtensions: [],        
    // size limit in bytes, 0 - no limit
    // this option isn't supported in all browsers
    sizeLimit: 0,
    onSubmit: function(id, fileName){},
    onComplete: function(id, fileName, responseJSON){},
    messages: {
        // error messages, see fileuploader.js for details            
    },
    showMessage: function(message){
        alert(message);
    }        

Instance methods

* setParams(newParams)        
* isUploading() Returns true if some files are being uploaded, false otherwise 

#### Limiting file type and size ####

Pass them as the options to constructor, the uploader will show a message if the 
user selects a file that doesn't match the criteria. The sizeLimit option only works
in most modern browsers at the moment. And you must add the same checks in your server-side
script.

    var uploader = new qq.FileUploader({
        element: document.getElementById('file-uploader'),
        action: '/server-side.upload',
        // ex. ['jpg', 'jpeg', 'png', 'gif'] or []
        allowedExtensions: [],        
        // size limit in bytes, 0 - no limit
        // this option isn't supported in all browsers
        sizeLimit: 0        
    });

#### Changing alert/messages to something more user friendly ####

If you limited file types and max size, you will probably want to change the default alert and
messages as you see fit, this is possible using showMessage callback and messages option.
Localization also meant to be done using this option. Look into qq.FileUploader for default values.

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

#### Callbacks ####

You can use the onSubmit callback, to set parameters based on the state of your app.     
    
    onSubmit: function(id, fileName){},
    onComplete: function(id, fileName, responseJSON){}

#### Changing design ####

If you want to change markup, look into template, fileTemplate, classes option in fileuploader.js
But for most purposes customization of the css file should be enough.
    
#### Further questions ####

If you have a short question, leave comment on my blog. For commercial support, contact andrew (at) valums.com    

#### Contributors ####

Thanks to everybody who cotributed, either by sending bug reports or donating. 
And also thanks to Andy Newby for his perl code, Ivan Valles, SeanJA, Patrick Pfeiffer, and others.