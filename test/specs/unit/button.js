pavlov.specify('button.js', function () {

    describe('UploadButton', function () {
        
        it('should construct, getInput, and reset', function () {
            $fixture.append("<div id='foo'></div>");
            
            var button = new qq.UploadButton({
                element: $("#foo")[0],
                multiple: true,
                acceptFiles: "image/*,video/*,.test",
                name: "testFile"
            });

            var input = button.getInput();

            notEqual(input, null);
            notEqual($(input).attr('multiple'), null);
            equal($(input).attr('accept'), "image/*,video/*,.test");
            equal($(input).attr('name'), "testFile");

            button.reset();
            ok(!$(input).is(button.getInput()));
        });
    });

})
