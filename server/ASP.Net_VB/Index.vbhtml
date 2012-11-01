@Code
    ViewData("Title") = "Index"
End Code

    <link href="/FineUploader/fileuploader.css" type="text/css"  rel="stylesheet"  />
    <script src="/FineUploader/fileuploader.js" type="text/javascript"></script>
    <script type="text/javascript">
        function createUploader() {
            var uploader = new qq.FileUploader({
                // The div to hold the uploader in.
                element: document.getElementById('file-uploader'),
                // Enabled to see the traffic in something like Firefox Web Console
                debug: true,
                // Max file size limit
                sizeLimit: 5200000,
                // This fuction is executed once uploaded.
                // This is appends the filenames to a div, but it could be anything!
                onComplete: function (id, fileName, responseJSON) {  
                    $('#uploaded_files').append('<br />Just uploaded: "' + fileName + '" ');
                },
                // The text that is shown on the upload 'button'
                uploadButtonText: "Click or drop files here to upload.",
                // The name of the controller and function that will handle the upload.
                action: '/Upload/Upload', 
                // The file types allowed to be selected.
                acceptFiles: ['image/jpeg', 'image/bmp', 'image/gif', 'image/png', 'image/tiff', 'application/msword', 'text/plain'],
                // Allowed extensions
                allowedExtensions: ['jpeg', 'jpg', 'txt', 'doc', 'docx', 'pdf', 'tiff', 'png', 'rtf', 'gif', 'tif', 'xls'],
                // Allow the user to select more than one file to up load at a time
                multiple: true,
                inputName: 'uploadFile'
            });
        }
        window.onload = createUploader;     
    </script>   

<h2>FineUploader demo.</h2>
<p> A demo of the FineUploader bein used in ASP.Net MVC written in VB.Net.</p>
<p>Thanks to Ray for the help in getting this up and running.</p>

<p>All the code is commented so you should have no problems.....maybe....</p>

<p>Ché</p>

	<div id="file-uploader">
        <noscript>
            @* Put your non javascipt uploader here. Something like: *@
                @Using (Html.BeginForm("Index", "File", FormMethod.Post, New With {.enctype = "multipart/form-data"}))
                    @:<label for="file">Upload File: </label>
                    @:<input type="file" name="file" id="file"/>
                    @:<input type="submit" value="Upload File" />
                    ViewBag.Message="File Uploaded."
                End Using
        </noscript>
    </div>

    <div id="uploaded_files"></div>
