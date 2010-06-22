THE COMPONENT IS NOT READY YET, PLEASE DO NOT USE.

This plugin uses XHR for uploading multiple files with progress-bar in FF3.6+, Safari4+,
Chrome and falls back to hidden iframe based upload in other browsers,
providing good experience for everyone. It is highly customizable, easily styleable,
and small. (4KB minified and gzipped)

### For demo <a href="http://github.com/valums/file-uploader/zipball/test">download</a> and open client/demo.htm ###
### Features ###

* progress-bar and keyboard support in FF,Chrome,Safari
* multiple file select in same browsers
* ability to cancel upload
* fully tested with https
* self contained (no external dependencies)

### Todos ###

* think if adding total size limit is a good idea
* merge multiple same type alerts into one (or completely rework them)
* add drag-and-drop upload functionality
* add an confirmation alert when user leaves page when the file is being uploaded
* add remove method
* fix back button functionality in Opera

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
your, in that case please send me a mail (andrew@valums.com). I will be glad to help.

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
    // return false to cancel
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
% in messages is replaced with type or size. Also this is the only thing, you need to change for
localization.

    var uploader = new qq.FileUploader({
        element: document.getElementById('file-uploader'),
        action: '/server-side.upload',
        messages: {
            serverError: "File wasn't uploaded, please contact support and/or try again.",
            typeError: "You selected invalid file, only % are allowed.",
            sizeError: "The file you selected is too large, maximum file size is %"            
        },
        showMessage: function(message){
            alert(message);
        }
    });

#### Sending additional params ####

To add a parameter that will be passed as query string with each upload use params option. 

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

You can use the onSubmit callback, to cancel upload in certain situations.     
    
    onSubmit: function(id, fileName){
        // check a name, or something in your app state
        // return false to cancel
    },
    onComplete: function(id, fileName, responseJSON){        
    }

#### Changing design ####
If you want to change markup look into template, fileTemplate, classes option in fileuploader.js
For most purposes customization of the css file should be enough. 
    
#### Further questions ####

If you need commercial support, contact andrew at valums.com     


