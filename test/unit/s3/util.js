
describe('s3/util.js', function () {
    describe('getBucket', function () {
        it('extract bucket from an accepted S3 endpoint', function () {
            var endpointsAndBuckets = {
                "http://foo.s3.amazonaws.com": "foo",
                "foo.s3.amazonaws.com": "foo",

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

                "http://foo.bar.com": "foo.bar.com",
                "https://foo.bar.com": "foo.bar.com",
                "foo.bar.com": "foo.bar.com",

                "http://foo.bar.com/": "foo.bar.com",
                "https://foo.bar.com/": "foo.bar.com",
                "foo.bar.com/": "foo.bar.com"
            };

            $.each(endpointsAndBuckets, function(endpoint, bucket) {
                var extractedBucket = qq.s3.util.getBucket(endpoint);
                assert.equal(bucket, extractedBucket, "Failed to extract bucket from " + endpoint);
            });
        });
    });

    describe('enforceSizeLimits', function () {
        var policy;

        beforeEach(function () {
            policy = {conditions: []};
        });

        it('Only add content-length-range param if necessary', function () {
            qq.s3.util.enforceSizeLimits(policy, 0, 0);
            assert.ok(policy.conditions[0] === undefined);
        });

        it('non-zero min and max', function () {
            qq.s3.util.enforceSizeLimits(policy, 100, 102);
            assert.equal("100", policy.conditions[0][1]);
            assert.equal("102", policy.conditions[0][2]);
        });

        it('zero min, non-zero max', function () {
            qq.s3.util.enforceSizeLimits(policy, 0, 100);
            assert.equal("0", policy.conditions[0][1]);
            assert.equal("100", policy.conditions[0][2]);
        });

        it('non-zero min, zero max', function () {
            qq.s3.util.enforceSizeLimits(policy, 100, 0);
            assert.equal("100", policy.conditions[0][1]);
            assert.equal("9007199254740992", policy.conditions[0][2]);
        });
    });

    describe('getSuccessRedirectAbsoluteUrl', function() {
        var purlUrl, protocol, host, dir;

        beforeEach(function() {
            purlUrl = purl(window.location.href);
            protocol = purlUrl.attr('protocol');
            host = purlUrl.attr('host') + ':' + purlUrl.attr('port');
            dir = purlUrl.attr('directory');
        });

        it('relative url input', function() {
            var derivedAbsoluteUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl("server/upload");
            assert.equal(protocol + "://" + host + dir + "server/upload", derivedAbsoluteUrl);
        });

        it('relative url input - root', function() {
            var derivedAbsoluteUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl("/server/upload");
            assert.equal(protocol + "://" + host + "/server/upload", derivedAbsoluteUrl);
        });

        it ('absolute url input', function() {
            assert.equal("http://1.2.3.4:8080/foo/bar", qq.s3.util.getSuccessRedirectAbsoluteUrl("http://1.2.3.4:8080/foo/bar"));
        })
    });

    describe('parseIframeResponse', function() {
        it('invalid iframe location', function() {
            var fakeIframe = {
                contentDocument: {
                    location: {
                        search: "foo=bar"
                    }
                }
            };

            assert.ok(qq.s3.util.parseIframeResponse(fakeIframe) === undefined);
        });

        it('valid iframe location', function() {
            var fakeIframe = {
                    contentDocument: {
                        location: {
                            search: "bucket=123&key=456&etag=789"
                        }
                    }
                },
                response;

            response = qq.s3.util.parseIframeResponse(fakeIframe);

            assert.equal("123", response.bucket);
            assert.equal("456", response.key);
            assert.equal("789", response.etag);
        });
    });

});

