describe('promise.js', function () {

    describe('isPromise', function () {
        it("returns true for a new'd promise", function () {
            var promise = new qq.Promise(); 
            assert.ok(qq.isPromise(promise), 
               'a `new qq.Promise()` should be a promise');
        });
    });

    describe('Promise API', function () {

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
    });
});
