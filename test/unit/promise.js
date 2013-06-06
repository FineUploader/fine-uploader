$(function() {

    // isPromise
    module('Promise')

        test("isPromise - should be return true for a new'd promise", function () {
            var promise = new qq.Promise(); 
            ok(qq.isPromise(promise));
        });

        asyncTest("promise - should expect success pass", function(){
            var promise = new qq.Promise(); 
            promise.then(function(value){
                ok(value);
                start();
            });

            promise.success(true);
        });
     
        asyncTest("promise - should expect failure pass", function(){
            var promise = new qq.Promise(); 
            promise.then(null, function(value){
                ok(value);
                start();
            });

            promise.failure(true);
        });

        asyncTest("promise - should expect done to be called", function () {
            var promise = new qq.Promise();
            promise.done(function (value) {
                ok(true);
                start();
            });

            promise.success();
        });

      // asyncTest("should expect done to be called", function(){
      //     var promise = new qq.Promise(); 
      //     promise.done(function(value){
      //         ok(true);
      //     });
      //     start();
      // });
});
