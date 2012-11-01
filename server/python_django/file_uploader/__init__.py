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
        fileSize = int(uploaded.im_self.META["CONTENT_LENGTH"])
        #get file name
        fileName = uploaded.im_self.META["HTTP_X_FILE_NAME"]
        #check first for allowed file extensions
        #read the file content, if it is not read when the request is multi part then the client get an error
        fileContent = uploaded(fileSize)
        if self._getExtensionFromFileName(fileName) in self.allowedExtensions or ".*" in self.allowedExtensions:
            #check file size
            if fileSize <= self.sizeLimit:
                #upload file
                #write file
                file = open(os.path.join(uploadDirectory, fileName), "wb+")
                file.write(fileContent)
                file.close()
                return json.dumps({"success": True})
            else:
                return json.dumps({"error": "File is too large."})
        else:
            return json.dumps({"error": "File has an invalid extension."})

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension.lower()
