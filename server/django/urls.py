from django.conf.urls.defaults import patterns
import os

urlpatterns = patterns('',
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': os.path.join(os.path.dirname(__file__), ".") }),
    (r'^$', 'views.upload'),
)