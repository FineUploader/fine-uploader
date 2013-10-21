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

    it('sets and removes hover class', function() {
        var hoverclass = 'qq-upload-button-hover';
        var $button = $fixture.appendTo("<div id='button'></div>");

        var button = new qq.UploadButton({
            element: $button[0],
            hoverClass: hoverclass
        });

        $button.simulate('mouseenter', function (e) {
            var classes = $(this).attr('class').split(' ');
            assert.ok($.inArray(hoverclass, classes));

            $button.simulate('mouseleave', function (e) {
                classes = $(this).attr('class').split(' ');
                assert.ok(!$.inArray(hoverClass, classes));
                done();
            });
        });

    });

    if (qq.supportedFeatures.ajaxUploading) {
        it('sets multiple attribute', function () {
            var $button = $fixture.appendTo("<div></div>");

            var input;
            var button = new qq.UploadButton({
                element: $button[0],
                multiple: false
            });

            input = button.getInput();
            assert.ok(!input.hasAttribute('multiple'));

            button.setMultiple(true);
            assert.ok(input.hasAttribute('multiple'));
        });
    }

    if (qq.supportedFeatures.ajaxUploading) {
        it('sets accept files', function () {
            var $button = $fixture.appendTo("<div></div>")

            var input;
            var button = new qq.UploadButton({
                element: $button[0]
            });

            input = button.getInput();
            assert.ok(!input.hasAttribute('accept'));

            button.setAcceptFiles("audio/*");
            assert.equal(input.getAttribute('accept'), 'audio/*');
        });
    }

});
