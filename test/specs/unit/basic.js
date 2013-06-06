$(function () {
    
    module('Fine Uploader Basic', {
        setup: function () {
            $("#fixture").append("<div id='fine-uploader'></div>");
        }
    });

    test('uploads with all defaults set', function () {
            var uploader = new qq.FineUploader({
                element: $("#fine-uploader")[0],
                debug: true,
                request: {
                    endpoint: '/uploads/'
                },
            });
    });

});
