"""
@author: Ferdinand E. Silva
@email: ferdinandsilva@ferdinandsilva.com
@website: http://ferdinandsilva.com
"""
from django.shortcuts import render_to_response, HttpResponse
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt

from file_uploader import settings
from file_uploader import qqFileUploader
import os


def index(request):
    return render_to_response('demo.htm', context_instance=RequestContext(request))


@csrf_exempt
def upload(request):
	uploader = qqFileUploader(request, os.path.join(settings.MEDIA_ROOT ,"upload/"), [".jpg", ".png", ".ico", ".*", ".avi"], 2147483648)
	return HttpResponse(uploader.handleUpload())

@csrf_exempt
def upload_delete(request, need_to_delete):

	qqFileUploader.deleteFile(need_to_delete)

	return HttpResponse("ok")