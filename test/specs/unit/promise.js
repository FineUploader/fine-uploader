$(function() {

    // isPromise
    module('isPromise')

        test("should be return true for a new'd promise", function () {
            var promise = new qq.Promise(); 
            ok(qq.isPromise(promise));
        });
  
    // promise api
    module("Promise API")

        asyncTest("should expect success pass", function(){
            var promise = new qq.Promise(); 
            promise.then(function(value){
                ok(value);
                start();
            });

            promise.success(true);
        });
     
        asyncTest("should expect failure pass", function(){
            var promise = new qq.Promise(); 
            promise.then(null, function(value){
                ok(value);
                start();
            });
            promise.failure(true);
        });

      // asyncTest("should expect done to be called", function(){
      //     var promise = new qq.Promise(); 
      //     promise.done(function(value){
      //         ok(true);
      //     });
      //     start();
      // });
});
