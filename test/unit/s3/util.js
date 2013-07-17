
describe('s3/util.js', function () {
    describe('getBucket', function () {
        it('extract bucket from an accepted S3 endpoint', function () {
            var endpointsAndBuckets = {
                "http://foo.s3.amazonaws.com": "foo",
                "https://foo.s3.amazonaws.com": "foo",
                "http://foo-bar.s3.amazonaws.com": "foo-bar",
                "http://foo.bar.s3.amazonaws.com": "foo.bar"
            };

            $.each(endpointsAndBuckets, function(endpoint, bucket) {
                var extractedBucket = qq.s3.util.getBucket(endpoint);
                assert.equal(bucket, extractedBucket);
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

});

