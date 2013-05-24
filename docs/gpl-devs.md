## GPL (Open-Source) Developers ##

If you are developing an open-source project and are comfortable with the GPL v3 license, you can build your own
version-stamped copy of Fine Uploader's combined javascript/css files using [gradle](http://gradle.org).  To do this,
please perform the following tasks:

1. Clone the project/repo locally.
2. Download [gradle](http://gradle.org).
3. Ensure that you have java 1.7 or greater installed.
4. On a command-line, run `gradle createRelease` or `gradle createJqueryRelease`.  These commands will build the
no-dependency and jQuery-wrapper versions respectively.

