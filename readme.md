THE COMPONENT IS NOT READY YET, DO NOT USE.

This plugin uses XHR for uploading multiple files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in other browsers,
providing good experience for everyone. It is highly customizable, easily styleable,
and small. (4KB minified and gzipped)

### For demo <a href="http://github.com/valums/file-uploader/zipball/test">download</a> and open client/demo.htm ###
### Features ###
In FF,Chrome,Safari

* progress-bar and keyboard support
* multiple file select
* drag-and-drop file select

In all browsers

* stylable via CSS
* uploads are cancellable
* self contained (no external dependencies)
* tested with https
* doesn't use Flash

### Known Issues ###
Plugin breaks back button functionality in Opera.

### License ###
Not selected yet. Product not ready, do not use.
	
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
Due to diversity of server platforms, it's quite probable, that I don't have an example for
yours, in that case please send me a mail andrew(at)valums.com. I will be glad to help.

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
        // contains test string, see fileuploade.js for details            
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
This also makes localization much easier. Look into options in qq.FileUploader for default values.

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

If you want to change markup look into template, fileTemplate, classes option in fileuploader.js
But for most purposes customization of the css file should be enough.
    
#### Further questions ####

If you have a simple question, leave comment on my blog. For commercial support, contact andrew(at)valums.com    