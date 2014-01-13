/* globals describe, beforeEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("promise.js", function () {
    "use strict";

    describe("isPromise", function () {
        it("returns true for a new'd promise", function () {
            var promise = new qq.Promise();
            assert.ok(promise instanceof qq.Promise,
               "a `new qq.Promise()` should be a promise");
        });
    });

    describe("Promise API", function () {

        it("expects `success` callback", function(finish){
            var promise = new qq.Promise();
            promise.then(function(value){
                assert.ok(value);
                finish();
            });

            promise.success(true);
        });
     
        it("expects `failure` callback", function(finish){
            var promise = new qq.Promise();
            promise.then(null, function(value){
                assert.ok(value);
                finish();
            });

            promise.failure(true);
        });

        it("success: expects `done` to be callback", function (finish) {
            var promise = new qq.Promise();
            promise.done(function (value) {
                assert.ok(value);
                finish();
            });

            promise.success(true);
        });

        it("failure: expects `done` to be callback", function (finish) {
            var promise = new qq.Promise();
            promise.done(function (value) {
                assert.ok(value);
                finish();
            });

            promise.failure(true);
        });

        it("ensures success callback is not called if promise fails before then is invoked", function() {
            var promise = new qq.Promise().failure();

            promise.then(function() {
                assert.ok(false, "Success callback was unexpectedly invoked");
            });
        });
    });
});
