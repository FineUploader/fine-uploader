## FineUploader test suite

### What's in here?

##### Unit Tests

Unit tests are found in the `./unit/` directory here. They contain javascript files whose purpoose is to test specific, atomic units of the codebase. They are not (yet) comprehensive, but cover a lot of bases.

You can run the unit tests on your local machine by issuing:
    
    % grunt test

You can have saucelabs run the unit tests on all sorts of browsers with:

    % grunt test-sauce

You have have grunt automatically re-build and re-run tests for you as changes are made with:

    % grunt test-watch

Other grunt commands are documented and can be viewed with:
    
    % grunt --help
