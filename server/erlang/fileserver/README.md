fileserver
=============

Simple handling of multi-part form data from file-uploader framwork.
Uses webmachine so assumes som familiarity with that.

You probably want to do one of a couple of things at this point:

0. Get the latest build of file-uploader and place in the right
   directories under priv/www/static/.
   e.g. place file fineuploader-{VERSION}.js in priv/www/static/js/.

1. Update priv/www/static/html/index.html to reflect correct version files

2. Get dependencies and Build the application:
   $ ./rebar get-deps
   $ ./rebar compile

3. Start up the application:
   $ ./start.sh

4. Upload some files
   localhost:8000


### Notes

0. Currently all files are saved to /tmp to change this edit the
   despatch.conf file ( look for '/tmp' ).

1. You will have to edit the fineuploader-{VERSION}.css file so that
   the image paths are relative. i.e. background: url("../img/loading.gif"), etc.