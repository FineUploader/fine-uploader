describe('button.js', function () {
    var $input, input, button;

    it('constructor works', function () {
        $fixture.append("<div id='foo'></div>");
        
        button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            multiple: true,
            acceptFiles: "image/*,video/*,.test",
            name: "testFile"
        });

        input = button.getInput();
        $input = $(input);

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

        button = new qq.UploadButton({
            element: $fixture.find("#foo")[0]
        });

        input = button.getInput();
        $input = $(input);

        button.reset();
        assert.notEqual($input[0], button.getInput(), 
               'resetting the button should clear the element from the DOM');
    });

    
    it.skip('onChange callback', function () {
        $fixture.append("<div id='foo'></div>");

        button = new qq.UploadButton({
            element: $fixture.find("#foo")[0],
            onChange: function (input) {
                ok(true); 
            }
        });

        button.dispatch('onChange');
    });

});
