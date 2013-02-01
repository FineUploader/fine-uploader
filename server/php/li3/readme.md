# Integration with the Lithium PHP framework #

Ajai Khattri <ajai@bitblit.net>

Here is an example Lithium controller implementing a basic upload action. 

This is really just a very basic uploader using mostly defaults so there are no features such as handling parameters (in the form or as query strings), no chunking or resume, etc. The code does the basic streaming upload for HTML5 browsers if its an AJAX call (I used the jQuery wrapper) or if its a regular request then the upload is handled as the usual HTTP POST way. Any developer using the Lithium framework should find it pretty easy to extend this example to add extra features (feel free to fork and improve upon this :-)

NB: This has only been tested in the last few releases of Firefox (up to Firefox 18), Chrome (23.0) and Safari 6. I do not have a means of testing with any versions of IE or older versions of the above browsers.


