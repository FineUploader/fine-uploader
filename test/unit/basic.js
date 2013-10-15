describe('uploader.basic.js', function () {
    var $fixture, $fineUploader;

    beforeEach(function () {
        $fixture.append("<div id='fine-uploader'></div>");
        $fineUploader = $fixture.find("#fine-uploader");
    });

    it.skip('uploads with all defaults set', function () {
        var uploader = new qq.FineUploader({
            element: $fixture[0],
            debug: true,
            request: {
                endpoint: '/uploads/'
            }
        });
    });
});
