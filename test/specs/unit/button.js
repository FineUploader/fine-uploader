$(function () {
    module('button')

        test('should construct, getInput, and reset', function () {
            var button, input;
            var $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            button = new qq.UploadButton({
                element: $fixture.find("#foo")[0],
                multiple: true,
                acceptFiles: "image/*,video/*,.test",
                name: "testFile"
            });

            input = button.getInput();

            notEqual(input, null);
            notEqual($(input).attr('multiple'), null);
            equal($(input).attr('accept'), "image/*,video/*,.test");
            equal($(input).attr('name'), "testFile");

            button.reset();
            notDeepEqual($(input), button.getInput());
        });
});
