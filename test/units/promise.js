// promise-test.js
//
// Tests the various functions found in promise.js

var expect = chai.expect
  , assert = chai.assert;

describe('promise.js', function() {
    // isPromise
    describe('isPromise', function () {
        it("should be return true for a new'd promise", function () {
            assert(qq.isPromise(new qq.Promise()));
        });
    });

    // promise api
    describe("Promise API", function () {

        var foo = false;
        var promise;
         
        beforeEach(function(){
            promise = new qq.Promise()
        });
     
        it("should expect success pass", function(done){
         
            promise.then(function(value){
                expect(value).equals(true);
                done();
            }).done(done);

            var timer = setTimeout(function () {
                promise.success(true);
            }, 50);
        });
     
        it("should expect failure pass", function(done){
         
            promise.then(null, function(value){
                expect(value).equals(true);
                done();
            }).done(done);

            var timer = setTimeout(function () {
                promise.failure(true);
            });
        });

    });
});
