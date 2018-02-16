<a href="http://fineuploader.com">
   <img src="http://fineuploader.smartimage.com/pimg/a8680d51" width="300">
</a>

# Looking for additional maintainers - please [inquire within](https://github.com/FineUploader/fine-uploader/issues/1881).

[![Build Status](https://travis-ci.org/FineUploader/fine-uploader.svg?branch=master)](https://travis-ci.org/FineUploader/fine-uploader)
[![npm](https://img.shields.io/npm/v/fine-uploader.svg)](https://www.npmjs.com/package/fine-uploader)
[![CDNJS](https://img.shields.io/cdnjs/v/file-uploader.svg)](https://cdnjs.com/libraries/file-uploader)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Twitter URL](https://img.shields.io/twitter/url/https/twitter.com/fineuploader.svg?style=social&label=Follow%20%40FineUploader)](https://twitter.com/fineuploader)

[**Documentation**](http://docs.fineuploader.com) |
[**Examples**](http://fineuploader.com/demos) |
[**Support**](../../issues) |
[**Blog**](http://blog.fineuploader.com/) |
[**Changelog**](../../releases)

---

Fine Uploader is:

- Cross-browser
- Dependency-free
- 100% JavaScript
- 100% Free Open Source Software

FineUploader is also simple to use. In the simplest case, you only need to include one JavaScript file.
There are absolutely no other required external dependencies. For more information, please see the [**documentation**](http://docs.fineuploader.com).


## Contributing

If you'd like to help and keep this project strong and relevant, you have several options.


### Help us pay the bills

Fine Uploader is currently looking for a sponsor to pay the AWS bills (which have recently lapsed).
These add up to about $40/month. Please open an issue if you are interesting in becoming a sponsor.
We will happily list you as sponsor on the site and README.


### File a bug report

If you see something that isn't quite right, whether it be in the code, or on the docs site, or even on FineUploader.com (which is hosted on GitHub), _please_ file a bug report. Be sure to make sure the [bug hasn't already been filed][issues] by someone else. If it has, feel free to upvote the issue and/or add your comments.


### Join the team

Are you interested in working on a very popular JavaScript-based file upload library with countless users? If you're strong in JavaScript, HTML, and CSS, and have a desire to help push the FOSS movement forward, let us know! The project can always use more experts.


### Help spread the word

Are you using Fine Uploader in your library or project? If so, let us know and we may add a link to your project or application _and_ your logo to FineUploader.com. If you care to write an article about Fine Uploader, we would be open to reading and publicizing it through our site, blog, or Twitter feed.


### Develop an integration library

Are you using Fine Uploader inside of a larger framework (such as React, Angular2, Ember.js, etc)? If so, perhaps you've already written a library that wraps Fine Uploader and makes it simple to use Fine Uploader in this context. Let us know and it may make sense to either link to your library, or even move it into the FineUploader GitHub organization (with your approval, of course). We'd also love to see libraries that make it simple to pair Fine Uploader with other useful libraries, such as image editors and rich text editors.


### Contribute code

The best way to contribute code is to open up a pull request that addresses one of the open [feature requests or bugs][issues]. In order to get started developing Fine Uploader, read this entire section to get the project up and running on your local development machine. This section describes how you can build and test Fine Uploader locally. You may use these instructions to build a copy for yourself, or to contribute changes back to the library. 

#### Setup

You must have Node.js instaled locally (any version should be fine), _and_ you must have Unix-like environment to work with. Linux, FreeBSD/OS X, Cygwin, and Windows 10 bash all _should_ be acceptable environments. Please open up a new issue if you have trouble building. The build process is centered around a single Makefile, so GNU Make is required as well (though most if not all Unix-like OSes should already have this installed). Finally, you will need a git client.

To pull down the project & build dependencies:

1. Download the project repository: `git clone https://github.com/FineUploader/fine-uploader.git`.
2. Install all project development dependencies: `npm install`.

#### Generating build artifacts

- To build all build artifacts for all endpoint types: `make build`. You can speed this process up a bit by using the parallel recipes feature of Make: `make build -j`. If you would like to build only a specific endpoint type, see the Makefile for the appropriate recipe. The build output will be created in the `_build` directory. 
- To build zip files for all endpoint types: `make zip`. To build a zip for only a specific endpoint type, see the Makefile for the appropriate recipe. The zip files will be included alongside the build output in the `_build` directory.
- To rev the version number: `make rev-version target=NEW_VERSION`, where `NEW_VERSION` is the semver-compatible target version identifier.

#### Running tests

To build, run the tests & linter: `npm test` (you'll need Firefox installed locally).

#### Commiting new code and changes

- Follow the [Angular.js commit guidelines][angular-commit].
- Follow the [Git Flow][git-flow] branching strategy.


[angular-commit]: https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit
[git-flow]: http://nvie.com/posts/a-successful-git-branching-model/
[issues]: https://github.com/FineUploader/fine-uploader/issues
