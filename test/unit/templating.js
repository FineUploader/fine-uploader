describe.skip("templating.js", function() {
    var templating;

    beforeEach(function() {
        var $template = $('<script id="qq-template"></script>');
        $template.text('<div class="qq-uploader-selector qq-uploader"><ul class="qq-upload-list-selector qq-upload-list"></ul></div>');
        $("body").append($template);
        templating = new qq.Templating({});
    });

    afterEach(function() {
        $("#qq-template").remove();
    });

    describe("hasAttr", function() {
        it("detects presence of an attr", function() {
            var div = document.createElement("div");

            div.setAttribute("foobar", "true");
            div.setAttribute("foobar1", "false");

            assert.ok(templating._testing.hasAttr(div, "foobar"));
            assert.ok(!templating._testing.hasAttr(div, "foobar1"));
            assert.ok(!templating._testing.hasAttr(div, "foobar2"));
        });
    });
});
