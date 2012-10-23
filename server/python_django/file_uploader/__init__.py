"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
import os


class qqFileUploader(object):

    def __init__(self, allowedExtensions=None, sizeLimit=1024):
        self.allowedExtensions = allowedExtensions or []
        self.sizeLimit = sizeLimit

    def handleUpload(self, request, uploadDirectory):
        #read file info from stream
        uploaded = request.read
        #get file size
        fileSize = int(uploaded.im_self.META["CONTENT_LENGTH"])
        #get file name
        fileName = uploaded.im_self.META["HTTP_X_FILE_NAME"]
        #check first for allowed file extensions
        if self._getExtensionFromFileName(fileName) in self.allowedExtensions or ".*" in self.allowedExtensions:
            #check file size
            if fileSize <= self.sizeLimit:
                #upload file
                #write file
                file = open(os.path.join(uploadDirectory, fileName), "wb+")
                file.write(request.read(fileSize))
                file.close()
                return "{success: true}"
            else:
                return '{"error": "File is too large."}'
        else:
            return '{"error": "File has an invalid extension."}'

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension
