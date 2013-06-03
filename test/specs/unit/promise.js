pavlov.specify('promise.js', function() {

    // isPromise
    describe('isPromise', function () {

        var promise;

        before(function () {
            promise = new qq.Promise(); 
        });

        after(function () {
            delete promise; 
        });

        it("should be return true for a new'd promise", function () {
            assert(qq.isPromise(promise));
            ok(!qq.isPromise(promise));
        });

    });

    // promise api
    describe("Promise API", function () {

        var foo = false;
        var promise;
         
        before(function(){
            promise = new qq.Promise()
        });

        after(function () {
            promise = null; 
        });

        asyncTest("should expect success pass", function(){
         
            promise.then(function(value){
                expect(value).equals(true);
                start();
            });
            promise.success(true);
        });
     
        asyncTest("should expect failure pass", function(){
         
            promise.then(null, function(value){
                expect(value).equals(true);
                start();
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
