## Development

### Build status
**Master**:    
[![Build Status](https://www.travis-ci.org/Widen/fine-uploader.png)](https://www.travis-ci.org/Widen/fine-uploader?branch=master)

**Develop**:    
[![Build Status](https://www.travis-ci.org/Widen/fine-uploader.png)](https://www.travis-ci.org/Widen/fine-uploader?branch=develop)

_FineUploader is continuously integrated with [Travis-CI](https://www.travis-ci.org/)._

### Coding

Oh, you think you can code? Great!

If you are developing an open-source project and are comfortable with the GPL v3 license, you can build your own
version-stamped copy of Fine Uploader's combined javascript/css files using the provided Makefile. To do this just

1. Clone the "develop" branch
2. Run `make build`
3. A release built from the latest source will be built in the `dist/` directory in the root source directory.

To contribute to development [fork it](https://github.com/Widen/fine-uploader/fork), and make sure to submit any pull requests against the "develop" branch.  See [How do I contribute to other's code in GitHub?](http://stackoverflow.com/questions/4384776/how-do-i-contribute-to-others-code-in-github).

Pull requests **MUST** be against the "develop" branch!


### Testing

If you're reading this, then good for you! 

You can run the test suite by forking or cloning the repo and running `make test` on your development machine. The included Makefile should automagically download dependencies and run the tests against phantom.js. There is also a test node.js server in the `test/` directory which allows running the QUnit tests against various browsers.

### Writing

Like to write for people rather than computers?

FineUploader could always use better documentation, examples, tutorials, and demos. Feel free to answer questions on the support forum, discuss issues on GitHub, write tutorials on your blog, posts screencasts on YouTube, … anything that can help the developers spend more time creating new features always helps!

