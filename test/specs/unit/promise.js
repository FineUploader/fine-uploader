// promise-test.js
//
// Tests the various functions found in promise.js

describe('promise.js', function() {

    // isPromise
    describe('isPromise', function () {
        var promise;

        it("should be return true for a new'd promise", function () {
            promise = new qq.Promise();
            assert(qq.isPromise(promise));
            promise = null;
            assert.isFalse(qq.isPromise(promise));
        });

    });

    // promise api
    describe("Promise API", function () {

        var foo = false;
        var promise;
         
        beforeEach(function(){
            promise = new qq.Promise()
        });

        afterEach(function () {
            promise = null; 
        });

        it("should expect success pass", function(done){
         
            promise.then(function(value){
                expect(value).equals(true);
                done();
            });
            promise.success(true);
        });
     
        it("should expect failure pass", function(done){
         
            promise.then(null, function(value){
                expect(value).equals(true);
                done();
            });
            promise.failure(true);
        });

        // it("should expect done to be called", function(done){
        //  
        //     promise.done(function(value){
        //         expect(value).equals(true);
        //         done();
        //     });
        //     promise.failure(true);
        // });

    });
});
