#!/usr/bin/env python

import os.path
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", UploadHandler),
        ]
        settings = dict(
            # DO NOT USE THIS FOR PRODUCTION !!!
            static_path=os.path.join(os.path.dirname(__file__), "."),
            # This is for demonstration purposes ONLY - it exposes your project root!
        )
        tornado.web.Application.__init__(self, handlers, **settings)

class UploadHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("""
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
        
    def post(self):
        if len(self.request.files) > 0: # this dirty - i'd rather use some decorator // @is_xhr f.ex.
            
            filename = self.request.files["qqfile"][0]["filename"]
            targetFile = open('upload/' + filename, 'w')
            targetFile.write(self.request.files["qqfile"][0]["body"])
            targetFile.close()
            
            self.write('{"success":true, fileSize:0}')
        else:
            
            filename = self.request.arguments["qqfile"][0]
            targetFile = open('upload/' + filename, 'w')
            targetFile.write(self.request.body)
            targetFile.close()
            
            self.set_header("Content-Type", "application/json")
            self.write('{"success":true}')

def main():
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()