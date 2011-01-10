### About ###
Basic django example.

### Usage ###
* Create a django project (e.g.: 'django-admin.py startproject fileuploader')
* Drop Andrew Valums fileuploader.css and fileuploader.js into the generated directory
* Create an 'upload' directory inside this directory
* Add the views.py and urls.py files
* Run 'manage.py runserver' and point your browser to http://localhost:8000
* ! This is important: The url pattern for static is 'hackish' - don't think about using this in production, better consult this http://docs.djangoproject.com/en/dev/howto/static-files/

### ToDo ###
* Combine with django form api - http://docs.djangoproject.com/en/dev/ref/forms/api/#binding-uploaded-files
* Error handling
* Restrictions (filesize, extensions, ...)