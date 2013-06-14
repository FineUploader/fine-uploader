describe('uploader.basic.js', function () {
    var $fixture, $Uploader;

    beforeEach(function () {
        $fixture = helpme.withTests.createFixture();
        $fixture.append("<div id='fine-uploader'></div>");
        $fineUploader = $fixture.find("#fine-uploader");
    });

    afterEach(function () {
        helpme.withTests.destroyFixture(); 
    })

    it.skip('uploads with all defaults set', function () {
        var uploader = new qq.FineUploader({
            element: $fixture[0],
            debug: true,
            request: {
                endpoint: '/uploads/'
            },
        });
    });
});
