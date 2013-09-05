describe('button.js', function () {
    it('constructor works', function () {
        $fixture.append("<div id='foo'></div>");
        
        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            multiple: true,
            acceptFiles: "image/*,video/*,.test",
            name: "testFile"
        });

        var input = button.getInput();
        var $input = $(input);

        assert.notEqual(input, null, 
            'a newed up upload button should have a non-null input element');
        assert.equal($input.attr('type'), 'file', 
                     'the input type should be `file`')
        assert.equal($input.attr('accept'), "image/*,video/*,.test", 
                    'uploader should valid which files are accepted');
        assert.equal($input.attr('name'), "testFile", 
                    'the name of the upload button should be set');
    });

    it('reset works', function () {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0]
        });

        var input = button.getInput();
        var $input = $(input);

        button.reset();
        assert.notEqual($input[0], button.getInput(), 
               'resetting the button should clear the element from the DOM');
    });

    it("does add an internal tracker ID to the input button, and re-adds it on reset", function() {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0]
        }),
            buttonId = button.getButtonId();

        assert.ok(buttonId != null);
        assert.equal(button.getInput().getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME), buttonId);

        button.reset();
        buttonId = button.getButtonId();
        assert.ok(buttonId != null);
        assert.equal(button.getInput().getAttribute(qq.UploadButton.BUTTON_ID_ATTR_NAME), buttonId);
    });

    it.skip('onChange callback', function () {
        $fixture.append("<div id='foo'></div>");

        var button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            onChange: function (input) {
                ok(true); 
            }
        });

        button.dispatch('onChange');
    });

});
