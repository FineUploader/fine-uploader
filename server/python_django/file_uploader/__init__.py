"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
import os
from django.conf import settings
from django.utils import simplejson as json

class qqFileUploader(object):

    def __init__(self, allowedExtensions=None, sizeLimit=None):
        self.allowedExtensions = allowedExtensions or []
        self.sizeLimit = sizeLimit or settings.FILE_UPLOAD_MAX_MEMORY_SIZE

    def handleUpload(self, request, uploadDirectory):
        #read file info from stream
        uploaded = request.read
        #get file size
        try:
            #check if there's a CONTENT_LENGTH
            fileSize = int(uploaded.im_self.META["CONTENT_LENGTH"])
        except ValueError:
            #Direct access to the browser address bar
            return json.dumps({"error": "Can't read file size."})
        #get file name
        try: 
            fileName = uploaded.im_self.META["HTTP_X_FILE_NAME"]
        except KeyError:
            #we can't get HTTP_X_FILE_NAME because the xhr didn't set the X-File-Name header
            #xhr.setRequestHeader("X-File-Name", "filename.ext") //setting it up in javascript
            #get the filename from GET
            fileName = request.GET.get('qqfile')
        #check first for allowed file extensions

        if self._getExtensionFromFileName(fileName) in self.allowedExtensions or ".*" in self.allowedExtensions:
            #check file size
            if fileSize <= self.sizeLimit:

                if request.FILES:
                    #use request.FILES for multipart
                    #and loop over chunks instead of using just read()
                    fileContent = request.FILES['qqfile']
                    with open(os.path.join(uploadDirectory, fileName), "wb+") as destination:
                        for chunk in fileContent.chunks():
                            destination.write(chunk)
                else:
                    #read the file content
                    fileContent = uploaded(fileSize)
                    #upload file
                    #write file
                    fileData = open(os.path.join(uploadDirectory, fileName), "wb+")
                    fileData.write(fileContent)
                    fileData.close()

                return json.dumps({"success": True})
            else:
                return json.dumps({"error": "File is too large."})
        else:
            return json.dumps({"error": "File has an invalid extension."})

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension.lower()
