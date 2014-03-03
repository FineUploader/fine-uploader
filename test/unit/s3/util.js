/* globals describe, beforeEach, qq, assert, it, purl */
describe("s3/util.js", function () {
    "use strict";

    describe("getBucket", function () {
        it("extract bucket from an accepted S3 endpoint", function () {
            var endpointsAndBuckets = {
                "http://foo.s3.amazonaws.com": "foo",
                "foo.s3.amazonaws.com": "foo",

                "http://foo_bar.s3.amazonaws.com": "foo_bar",
                "https://foo_bar.s3.amazonaws.com": "foo_bar",
                "foo_bar.s3.amazonaws.com": "foo_bar",

                "http://foo.s3-ap-northeast-1.amazonaws.com": "foo",
                "foo.s3-ap-northeast-1.amazonaws.com": "foo",

                "https://foo.s3.amazonaws.com": "foo",
                "https://foo.s3-ap-northeast-1.amazonaws.com": "foo",

                "http://foo-bar.s3.amazonaws.com": "foo-bar",
                "foo-bar.s3.amazonaws.com": "foo-bar",

                "http://foo-bar.s3-northeast-1.amazonaws.com": "foo-bar",
                "foo-bar.s3-northeast-1.amazonaws.com": "foo-bar",

                "http://foo.bar.s3.amazonaws.com": "foo.bar",
                "foo.bar.s3.amazonaws.com": "foo.bar",

                "http://foo.bar.s3-northeast-1.amazonaws.com": "foo.bar",
                "foo.bar.s3-northeast-1.amazonaws.com": "foo.bar",

                "http://s3.amazonaws.com/foo": "foo",
                "https://s3.amazonaws.com/foo": "foo",
                "s3.amazonaws.com/foo": "foo",

                "http://s3.amazonaws.com/foo-bar": "foo-bar",
                "https://s3.amazonaws.com/foo-bar": "foo-bar",
                "s3.amazonaws.com/foo-bar": "foo-bar",

                "http://s3.amazonaws.com/foo.bar.com": "foo.bar.com",
                "https://s3.amazonaws.com/foo.bar.com": "foo.bar.com",
                "s3.amazonaws.com/foo.bar.com": "foo.bar.com",

                "http://s3.amazonaws.com/foo_bar_com": "foo_bar_com",
                "https://s3.amazonaws.com/foo_bar_com": "foo_bar_com",
                "s3.amazonaws.com/foo_bar_com": "foo_bar_com",

                "http://foo.bar.com": "foo.bar.com",
                "https://foo.bar.com": "foo.bar.com",
                "foo.bar.com": "foo.bar.com",

                "http://foo.bar.com/": "foo.bar.com",
                "https://foo.bar.com/": "foo.bar.com",
                "foo.bar.com/": "foo.bar.com",

                "http://foo_bar.example.com/": "foo_bar.example.com",
                "https://foo_bar.example.com/": "foo_bar.example.com",
                "foo_bar.example.com/": "foo_bar.example.com"

            };

            $.each(endpointsAndBuckets, function(endpoint, bucket) {
                var extractedBucket = qq.s3.util.getBucket(endpoint);
                assert.equal(extractedBucket, bucket, "Failed to extract bucket from " + endpoint);
            });
        });
    });

    describe("enforceSizeLimits", function () {
        var policy;

        beforeEach(function () {
            policy = {conditions: []};
        });

        it("Only add content-length-range param if necessary", function () {
            qq.s3.util.enforceSizeLimits(policy, 0, 0);
            assert.ok(policy.conditions[0] === undefined);
        });

        it("non-zero min and max", function () {
            qq.s3.util.enforceSizeLimits(policy, 100, 102);
            assert.equal(policy.conditions[0][1], "100");
            assert.equal(policy.conditions[0][2], "102");
        });

        it("zero min, non-zero max", function () {
            qq.s3.util.enforceSizeLimits(policy, 0, 100);
            assert.equal(policy.conditions[0][1], "0");
            assert.equal(policy.conditions[0][2], "100");
        });

        it("non-zero min, zero max", function () {
            qq.s3.util.enforceSizeLimits(policy, 100, 0);
            assert.equal(policy.conditions[0][1], "100");
            assert.equal(policy.conditions[0][2], "9007199254740992");
        });
    });

    describe("getSuccessRedirectAbsoluteUrl", function() {
        var purlUrl, protocol, host, dir;

        beforeEach(function() {
            purlUrl = purl(window.location.href);
            protocol = purlUrl.attr("protocol");
            host = purlUrl.attr("host") + ":" + purlUrl.attr("port");
            dir = purlUrl.attr("directory");
        });

        it("relative url input", function() {
            var derivedAbsoluteUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl("server/upload");
            assert.equal(derivedAbsoluteUrl, protocol + "://" + host + dir + "server/upload");
        });

        it("relative url input - root", function() {
            var derivedAbsoluteUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl("/server/upload");
            assert.equal(derivedAbsoluteUrl, protocol + "://" + host + "/server/upload");
        });

        it ("absolute url input", function() {
            assert.equal(qq.s3.util.getSuccessRedirectAbsoluteUrl("http://1.2.3.4:8080/foo/bar"), "http://1.2.3.4:8080/foo/bar");
        });
    });

    describe("parseIframeResponse", function() {
        it("invalid iframe location", function() {
            var fakeIframe = {
                contentDocument: {
                    location: {
                        search: "foo=bar"
                    }
                }
            };

            assert.ok(qq.s3.util.parseIframeResponse(fakeIframe) === undefined);
        });

        it("valid iframe location", function() {
            var fakeIframe = {
                    contentDocument: {
                        location: {
                            search: "bucket=123&key=456&etag=%22789%22"
                        }
                    }
                },
                response;

            response = qq.s3.util.parseIframeResponse(fakeIframe);

            assert.equal(response.bucket, "123");
            assert.equal(response.key, "456");
            assert.equal(response.etag, "789");
        });
    });

    describe("encodeQueryStringParam", function() {
        it("handles params with spaces correctly", function() {
            assert.equal(qq.s3.util.encodeQueryStringParam("one two three"), "one+two+three");
            assert.equal(qq.s3.util.encodeQueryStringParam("&hi, how are you?"), "%26hi%2C+how+are+you%3F");
        });

        it("handles params without spaces correctly", function() {
            assert.equal(qq.s3.util.encodeQueryStringParam("onetwothree"), "onetwothree");
            assert.equal(qq.s3.util.encodeQueryStringParam("&hi,howareyou?"), "%26hi%2Chowareyou%3F");
        });

        it("follows RFC 3986 exactly", function() {
            assert.equal(qq.s3.util.encodeQueryStringParam("Are you 'Ray'?  If so, back to work (*now*)!"),
            "Are+you+%27Ray%27%3F++If+so%2C+back+to+work+%28%2Anow%2A%29%21");
        });
    });
});

