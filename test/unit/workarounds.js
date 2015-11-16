/* globals describe, beforeEach, afterEach, qq, assert, it, $fixture */
describe("browser-specific workarounds", function() {
    "use strict";

    var $fineUploader, $button, $extraButton, $extraButton2, $extraButton3;

    function getFileInput($containerEl) {
        return $containerEl.find("INPUT")[0];
    }

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $fineUploader = $fixture.find("#fine-uploader");

        $fixture.append("<div id='test-button'></div>");
        $button = $fixture.find("#test-button");
    });

    describe("iOS8 WebView & Chrome browser crash", function() {
        var origIos8 = qq.ios8,
            origIosChrome = qq.iosChrome,
            origSafariWebView = qq.iosSafariWebView;

        beforeEach(function() {
            qq.ios8 = function() {return true;};
        });

        afterEach(function() {
            qq.ios8 = origIos8;
            qq.iosChrome = origIosChrome;
            qq.iosSafariWebView = origSafariWebView;
        });

        it("ensures the file input always contains a multiple attr in iOS8 Chrome", function() {
            qq.iosChrome = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });

        it("ensures the file input does not have a multiple attr if the multiple option is not set in iOS8 Chrome & the workaround is disabled", function() {
            qq.iosChrome = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), false);
        });

        it("ensures the file input always contains a multiple attr in iOS8 UIWebView", function() {
            qq.iosSafariWebView = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });

        it("ensures the file input does not have a multiple attr if the multiple option is not set in iOS8 UIWebView & the workaround is disabled", function() {
            qq.iosSafariWebView = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), false);
        });
    });

    describe("iOS7+ 0-sized videos", function() {
        var origIos = qq.ios,
            origIos6 = qq.ios6;

        beforeEach(function() {
            qq.ios = function() {return true;};
        });

        afterEach(function() {
            qq.ios = origIos;
            qq.ios6 = origIos6;
        });

        it("ensures the file input never contains a multiple attr in iOS7 or 8", function() {
            qq.ios6 = function() {return false;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: true
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), false);
        });

        qq.supportedFeatures.ajaxUploading && it("ensures the file input does have a multiple attr if the multiple option is set in iOS6", function() {
            qq.ios6 = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });

        qq.supportedFeatures.ajaxUploading && it("ensures the file input does have a multiple attr if the multiple option is set in iOS8 & the workaround is disabled", function() {
            qq.ios6 = function() {return false;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8BrowserCrash: false,
                    iosEmptyVideos: false
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });
    });

    describe("iOS7+ 0-sized videos & Chrome browser crash", function() {
        var origIos8 = qq.ios8,
            origIosChrome = qq.iosChrome,
            origSafariWebView = qq.iosSafariWebView,
            origIos = qq.ios,
            origIosSafari = qq.iosSafari,
            origIos7 = qq.ios7;

        beforeEach(function() {
            qq.ios = function() {return true;};
            qq.ios8 = function() {return true;};
        });

        afterEach(function() {
            qq.ios8 = origIos8;
            qq.ios7 = origIos7;
            qq.iosChrome = origIosChrome;
            qq.iosSafari = origIosSafari;
            qq.iosSafariWebView = origSafariWebView;
            qq.ios = origIos;
        });

        it("ensures the file input always contains a multiple attr in iOS8 Chrome", function() {
            qq.iosChrome = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: true
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });

        it("ensures the file input always contains a multiple attr in iOS8 UIWebView", function() {
            qq.iosSafariWebView = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: false,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: true
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), true);
        });

        it("ensures the file input never contains a multiple attr in iOS7", function() {
            qq.ios8 = function() {return false;};
            qq.ios7 = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: true
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), false);
        });

        it("ensures the file input never contains a multiple attr in iOS8 Safari", function() {
            qq.iosSafari = function() {return true;};

            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8BrowserCrash: true,
                    iosEmptyVideos: true
                }
            });

            assert.equal(qq(getFileInput($button)).hasAttribute("multiple"), false);
        });
    });

    describe("iOS 8.0.0 Safari uploads impossible", function() {
        var origIos800 = qq.ios800,
            origIosSafari = qq.iosSafari,
            origWindowAlert = window.alert;

        beforeEach(function() {
            qq.ios800 = function() {return true;};
            qq.iosSafari = function() {return true;};
        });

        afterEach(function() {
            qq.ios800 = origIos800;
            qq.iosSafari = origIosSafari;
            window.alert = origWindowAlert;
        });

        it("throws an error and pops up an alert if addFiles is called in iOS 8.0.0 Safari", function(done) {
            var uploader = new qq.FineUploaderBasic({
                element: $fixture[0],
                button: $button[0],
                multiple: true,
                workarounds: {
                    ios8SafariUploads: true
                }
            });

            window.alert = function() {
                done();
            };

            assert.throws(
                function() {
                    uploader.addFiles();
                }, qq.Error
            );
        });
    });
});
