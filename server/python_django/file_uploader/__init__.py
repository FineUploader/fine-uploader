"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
import os
import json
from io import FileIO, BufferedWriter
from hashlib import md5
from django.conf import settings


class qqFileUploader(object):
    BUFFER_SIZE = 10485760  # 10MB

    def __init__(self, allowedExtensions=None, sizeLimit=None):
        self.allowedExtensions = allowedExtensions or []
        self.sizeLimit = sizeLimit or settings.FILE_UPLOAD_MAX_MEMORY_SIZE

    def max_size(self):
        # In upload process checking file max size
        if int(self._destination.tell()) > self.sizeLimit:
            self._destination.close()
            os.remove(self._path)
            return True

    def setup(self, filename):
        # Make random name for uploaded file ( protect from duplicated file names )
        self._filename = md5(filename.encode('utf8')).hexdigest() + self._getExtensionFromFileName(filename)
        # Full path for file
        self._path = os.path.join(self._upload_dir, self._filename)
        # Make directory for store file if this not exist
        try:
            os.makedirs(os.path.realpath(os.path.dirname(self._path)))
        except:
            pass
        # Using buffered writer for store file (may check size data on-the-fly)
        self._destination = BufferedWriter(FileIO(self._path, "w"))

    def handleUpload(self, request, uploadDirectory):
        self._upload_dir = uploadDirectory
        if request.FILES:
            is_raw = False
            if len(request.FILES) == 1:
                upload = request.FILES.values()[0]
            else:
                return json.dumps({"error": "Bad upload."})
            filename = upload.name
        else:
            is_raw = True
            # the file is stored raw in the request
            upload = request
            #get file name
            try:
                filename = request.GET['qqfile']
            except KeyError:
                return json.dumps({"error": "Can't read file name."})
        # Check valid extensions 
        if self._getExtensionFromFileName(filename) not in self.allowedExtensions or ".*" not in self.allowedExtensions:
            return json.dumps({"error": "File has an invalid extension."})
        # Prepare destination buffered file
        self.setup(filename)
        # Store data in file
        try:
            if is_raw:
                # File is streaming.
                chunk = upload.read(self.BUFFER_SIZE)
                while len(chunk) > 0:
                    self._destination.write(chunk)
                    if self.max_size():
                        raise
                    chunk = upload.read(self.BUFFER_SIZE)
            else:
                # File was uploaded via a POST, and is here.
                for chunk in upload.chunks():
                    self._destination.write(chunk)
                    if self.max_size():
                        raise
            self._destination.close()
        except:
            json.dumps({"error": "Upload error."})
        return json.dumps({"success": True})

    def _getExtensionFromFileName(self, fileName):
        filename, extension = os.path.splitext(fileName)
        return extension.lower()
