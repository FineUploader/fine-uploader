qq.Preview = function() {
    "use strict";

    function draw(fileOrBlob, img) {
        var promise = new qq.Promise(),
            fileReader = new FileReader();

        fileReader.onload = function(event) {
            img.onload = function() {
                promise.success();
            };

            img.onerror = function() {
                //TODO img.src = placeholder based on MIME type

                promise.failure();
            };

            img.src = event.target.result;
        };

        fileReader.readAsDataURL(fileOrBlob);

        return promise;
    }


    return {
        generate: function(fileOrBlob, img) {
            return draw(fileOrBlob, img);
        }
    }
};
