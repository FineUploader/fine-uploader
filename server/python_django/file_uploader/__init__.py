"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
import os
import json
import glob
from django.http import Http404
from django.conf import settings
import hashlib
import uuid
from io import FileIO, BufferedWriter

class qqFileUploader(object):

    BUFFER_SIZE = 10485760  # 10MB
    UPLOAD_DIRECTORY = os.path.join(settings.MEDIA_ROOT ,"upload/")

    def __init__(self, request, uploadDirectory=None, allowedExtensions=None, sizeLimit=None):
        self.allowedExtensions = allowedExtensions or []
        self.sizeLimit = sizeLimit or settings.FILE_UPLOAD_MAX_MEMORY_SIZE
        self.inputName = 'qqfile'
        self.chunksFolder = os.path.join(settings.MEDIA_ROOT, "chunks/")
        self.request = request
        self.uploadDirectory = uploadDirectory if uploadDirectory else self.UPLOAD_DIRECTORY
        self.uploadName = ''

    def getName(self):
        retName = None
        if self.request.REQUEST.get('qqfilename', None):
            if retName:
                return self.request.REQUEST['qqfilename']
            else:

                if self.request.FILES.get(self.inputName, None):
                    retName = self.request.FILES[self.inputName].name
                    
                    if retName == "blob":
                        return self.request.POST.get('qqfilename')
                    else:
                        return retName
        
        if self.request.GET.get(self.inputName, None):
            return self.request.GET.get(self.inputName)
        else:
            return self.request.FILES[self.inputName].name

    def isRaw(self):
        return False if self.request.FILES else True

    def getUploadName(self):
        return self.uploadName


    def handleUpload(self, name=None):

        if not os.access(self.uploadDirectory, os.W_OK):
            return json.dumps({"error": "Server error. Uploads directory isn't writable or executable."})


        if 'CONTENT_TYPE' not in self.request.META:
            return json.dumps({"error": "No files were uploaded."})  
        """    
        if not self.request.FILES:
            return json.dumps({"error": "Server error. Not a multipart request. Please set forceMultipart to default value (true)."})
        """

        if not self.isRaw():
            uFile = self.request.FILES[self.inputName]
            uSize = uFile.size
        else:
            uFile = self.request.REQUEST[self.inputName]
            uSize = int(self.request.META['CONTENT_LENGTH'])

        uuid_f = ''
        try:
            uuid_f = self.request.REQUEST['qquuid']
        except KeyError:
            uuid_f = hashlib.md5(str(uuid.uuid4())).hexdigest()

        if name is None:
            name = self.getName()

        name = "%s_%s" % (uuid_f, name)

        if uSize == 0:
            return json.dumps({"error": "File is empty."})

        if uSize > self.sizeLimit:
            return json.dumps({"error": "File is too large."})

        if not (self._getExtensionFromFileName(name) in self.allowedExtensions or ".*" not in self.allowedExtensions):
            return json.dumps({"error": "File has an invalid extension, it should be one of %s." % ",".join(self.allowedExtensions)})            

        totalParts = int(self.request.REQUEST['qqtotalparts']) if 'qqtotalparts' in self.request.REQUEST else 1

        if totalParts > 1:
            chunksFolder = self.chunksFolder
            partIndex = int(self.request.REQUEST['qqpartindex'])

            if not os.access(chunksFolder, os.W_OK):
                return json.dumps({"error": "Server error. Chunks directory isn't writable or executable."})

            targetFolder = os.path.join(chunksFolder, uuid_f)  
            
            if not os.path.exists(targetFolder):
                os.mkdir(targetFolder)  

            target = os.path.join("%s/" % targetFolder, str(partIndex))

            with open(target, "wb+") as destination:
                for chunk in uFile.chunks():
                    destination.write(chunk)

            if totalParts - 1 == partIndex:
                target = os.path.join(self.uploadDirectory, name)
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
            target = os.path.join(self.uploadDirectory, name)

            if target:
                self.uploadName = os.path.basename(target)

                try:
                    if self.isRaw():
                        chunk = self.request.read(self.BUFFER_SIZE)
                        with open(target, "wb+") as destination:
                            while len(chunk) > 0:
                                destination.write(chunk)

                                if int(destination.tell()) > self.sizeLimit:
                                    destination.close()
                                    os.unlink(target)
                                    raise

                                chunk = self.request.read(self.BUFFER_SIZE)
                    else:
                        with open(target, "wb+") as destination:
                            for chunk in uFile.chunks():
                                destination.write(chunk)

                    destination.close()
                    
                    return json.dumps({"success": True})
                except:
                    pass

            return json.dumps({"error": "Could not save uploaded file. The upload was cancelled, or server error encountered"})                

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension.lower()

    @staticmethod
    def deleteFile(uuid_f):
        """
        Please add security here.....
        """
        fileToDelete = os.path.join(qqFileUploader.UPLOAD_DIRECTORY, "%s_*.*" % uuid_f.replace("?",""))

        try:
            os.unlink(glob.glob(fileToDelete)[0])
        except Exception as e:
            raise Http404

        return True
