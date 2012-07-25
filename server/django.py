# Create your views here.
from django.shortcuts import render_to_response
from django.http import HttpResponse
from django.middleware.csrf import get_token #required for Ajax post


def index(request):
	#show user the form
	get_token(request) #force csrf cookie generation
	return render_to_response('upload/index.html') 

def upload(request):
	#ajax response
	return HttpResponse('{success: true}')