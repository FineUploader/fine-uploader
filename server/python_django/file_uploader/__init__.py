"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
import os
import json
from django.conf import settings

class qqFileUploader(object):
    
    def __init__(self, request, allowedExtensions=None, sizeLimit=None):
        self.allowedExtensions = allowedExtensions or []
        self.sizeLimit = sizeLimit or settings.FILE_UPLOAD_MAX_MEMORY_SIZE
        self.inputName = 'qqfile'
        self.chunksFolder = os.path.join(settings.MEDIA_ROOT, "chunks/")
        self.request = request

        self.uploadName = ''

    def getName(self):
        if self.request.REQUEST.get('qqfilename', None):
            return self.request.REQUEST['qqfilename']

        if self.request.FILES.get(self.inputName, None):
            return self.request.FILES[self.inputName].name

    def getUploadName(self):
        return self.uploadName

    def handleUpload(self, uploadDirectory, name=None):

        if not os.access(uploadDirectory, os.W_OK):
            return json.dumps({"error": "Server error. Uploads directory isn't writable or executable."})

        if 'CONTENT_TYPE' not in self.request.META:
            return json.dumps({"error": "No files were uploaded."})  
            
        if not self.request.FILES:
            return json.dumps({"error": "Server error. Not a multipart request. Please set forceMultipart to default value (true)."})

        uFile = self.request.FILES[self.inputName]
        uSize = uFile.size

        if name is None:
            name = self.getName()

        if uSize == 0:
            return json.dumps({"error": "File is empty."})

        if uSize > self.sizeLimit:
            return json.dumps({"error": "File is too large."})

        if not (self._getExtensionFromFileName(name) in self.allowedExtensions or ".*" in self.allowedExtensions):
            return json.dumps({"error": "File has an invalid extension, it should be one of %s." % ",".join(self.allowedExtensions)})            

        totalParts = int(self.request.REQUEST['qqtotalparts']) if 'qqtotalparts' in self.request.REQUEST else 1

        if totalParts > 1:
            chunksFolder = self.chunksFolder
            partIndex = int(self.request.REQUEST['qqpartindex'])
            uuid = self.request.REQUEST['qquuid']

            if not os.access(chunksFolder, os.W_OK):
                return json.dumps({"error": "Server error. Chunks directory isn't writable or executable."})

            targetFolder = os.path.join(chunksFolder, uuid)  
            
            if not os.path.exists(targetFolder):
                os.mkdir(targetFolder)  

            target = os.path.join("%s/" % targetFolder, str(partIndex))

            with open(target, "wb+") as destination:
                for chunk in uFile.chunks():
                    destination.write(chunk)

            if totalParts - 1 == partIndex:
                target = os.path.join(uploadDirectory, name)
                self.uploadName = os.path.basename(target)

                target = open(target, "ab")

                for i in range(totalParts):
                    chunk = open("%s/%s" % (targetFolder, i), "rb")
                    target.write(chunk.read())
                    chunk.close()

                target.close()
                return json.dumps({"success": True})

            return json.dumps({"success": True})

        else:
            target = os.path.join(uploadDirectory, name)

            if target:
                self.uploadName = os.path.basename(target)

                with open(target, "wb+") as destination:
                    for chunk in uFile.chunks():
                        destination.write(chunk)

                return json.dumps({"success": True})

            return json.dumps({"error": "Could not save uploaded file. The upload was cancelled, or server error encountered"})                

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension.lower()