# -*- encoding: utf-8 -*-
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

def handle_uploaded_file(file, name):
    destination = open('upload/' + name, 'w')
    if file.__class__ is str:
        destination.write(file)
    else:
        if file.multiple_chunks():
            for chunk in file.chunks():
                destination.write(chunk)
        else:
            destination.write(file.read())
    destination.close()
        
@csrf_exempt
def upload(request):
    if request.method == 'GET':
        response = ("""
            <!DOCTYPE html>
            <html> 
            <head> 
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> 
                <link href="static/fileuploader.css" rel="stylesheet" type="text/css">    
                <style>        
                    body {font-size:13px; font-family:arial, sans-serif; width:700px; margin:100px auto;}
                </style>    
            </head> 
            <body>        
                <p><a href="http://github.com/valums/file-uploader">Back to project page</a></p> 
                
                <p>To upload a file, click on the button below. Drag-and-drop is supported in FF, Chrome.</p> 
                <p>Progress-bar is supported in FF3.6+, Chrome6+, Safari4+</p> 
                
                <div id="file-uploader-demo1">        
                    <noscript>            
                        <p>Please enable JavaScript to use file uploader.</p>
                        <!-- or put a simple form for upload here -->
                    </noscript>         
                </div> 
                
                <script src="static/fileuploader.js" type="text/javascript"></script> 
                <script>        
                    function createUploader(){            
                        var uploader = new qq.FileUploader({
                            element: document.getElementById('file-uploader-demo1'),
                            action: '/'
                        });           
                    }
                    
                    // in your app create uploader as soon as the DOM is ready
                    // don't wait for the window to load  
                    window.onload = createUploader;     
                </script>    
            </body> 
            </html>
        """)
    elif request.method == 'POST':
        if request.is_ajax():
            handle_uploaded_file(request.raw_post_data, request.META["HTTP_X_FILE_NAME"])
        else:
            handle_uploaded_file(request.FILES['qqfile'], request.FILES['qqfile'].name)
        response = '{"success":true}'
    return HttpResponse(response)