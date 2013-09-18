## FineUploader test suite

### What's in here?

##### Unit Tests

Unit tests are found in the `./unit/` directory here. They contain javascript files whose purpoose is to test specific, atomic units of the codebase. They are not (yet) comprehensive, but cover a lot of bases.

Before running tests you'll need to prepare the codebase by running:

`% grunt dev`

This will download test dependencies with bower and npm, concatenate the source
files, and copy everything into its proper area for testing.

You can run the unit tests on your local machine by issuing:

`% grunt test:unit`

You can pass in normal [Karma](http://karma-runner.github.io/0.10/index.html)
command line arguments:

`% grunt test:unit --browsers PhantomJS,Chrome,Firefox`

You can have saucelabs run the unit tests on all sorts of browsers with:

```
% export SAUCE_USERNAME='your saucelabs username'
% export SAUCE_ACCESSKEY='your saucelabs accesskey'
% grunt test:unit:sauce
```

_Note that these test can take 10+ minutes to run_

You have have grunt automatically re-build and re-run tests for you as changes are made with:

```
% grunt autotest
```

Other grunt commands are documented and can be viewed with:

```
% grunt --help
```
