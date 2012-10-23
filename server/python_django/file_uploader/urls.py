from django.conf.urls.defaults import patterns, url
from file_uploader import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'file_uploader.views.home', name='home'),
    # url(r'^file_uploader/', include('file_uploader.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    url(r'^media/(?P<path>.*)$', "django.views.static.serve", {'document_root': settings.MEDIA_ROOT, 'show_indexes': True}),  # on debugging only
    url(r'^$', 'file_uploader.views.index'),
    url(r'^upload/$', 'file_uploader.views.upload'),
)
