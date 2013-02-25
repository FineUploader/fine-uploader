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
	uploader = qqFileUploader(request, [".jpg", ".png", ".ico", ".*"], 2147483648)
	return HttpResponse(uploader.handleUpload(os.path.join(settings.MEDIA_ROOT ,"upload/")))