<!--- Code provided by Pegasus Web Productions LLC - www.pegweb.com --->
<!--- get stuck use the forums http://github.com/valums/file-uploader --->
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<link href="fileuploader.css" rel="stylesheet" type="text/css">
	<script src="fileuploader.js" type="text/javascript"></script>
	<script type="text/javascript">
    $().ready(function() {
        var running = 0; // create an increment counter
        var uploader = new qq.FileUploader({
            element: document.getElementById('file-uploader'),
            action: 'image-uploader.cfc',
            params: {
                method: 'Upload', 
                allowedExtensions: ['jpg', 'jpeg', 'gif'],
                sizeLimit: 5000,
                debug: true},
                onSubmit: function(id, fileName){
                    running++; //increment the counter for each image submission
                },
                onComplete: function (id, filename, responseJSON) {
                    running--;
                    if(running == 0){
                      window.location = "upload-page.cfm";  // I send them to this page once all images complete uploading                               
                }
            }
        });
    });
    </script> 
</head>
<body >		
	<h1>ColdFusion File Uploader Demo</h1>
    <p><a href="http://github.com/valums/file-uploader">Back to project page</a></p>
    
    <div id="file-uploader">
    <noscript>
        <p>Please enable JavaScript to use the file uploader.</p>
        <!-- or put a simple form for upload here -->
    </noscript>
    </div>   
 
</body>
</html>