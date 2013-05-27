// promise-test.js
//
// Tests the various functions found in promise.js

// isPromise
describe('isPromise', function () {
    it("should be return true for a new'd promise", function () {
        assert(qq.isPromise(new qq.Promise()));
    });
});

// promise api
describe("Promise API", function () {

    it("should ensure `done()` callsback after both success and failure", function (done) {
        var promise = new qq.Promise();
        done();
        promise.done(function () { assert(true); });
        promise.success();
        promise.failure();
    });

    it("// should work for chained promises", function () {
        var promise = new qq.Promise();
        promise.then(function() { return "success1"; }, 
                     function() { return "fail1"; })
               .then(function() { return "succes2"; }, 
                     function() { return "failure2"; });
        assert.equal(promise.success(), "success1");
        assert.equal(promise.failure(), "failure2");
    });

    it("// async test", function () {
        var promise = new qq.Promise();
        promise.then(function (val) { assert(val); },
                     function (val) { assert(!val); });

        var f = function (diditwork) {
            setTimeout(function () {
                if (diditwork) {
                    promise.success(true);
                }
                else {
                    promise.fail(false);
                }
            }, 100)();
        };
        return promise;
    });
});
