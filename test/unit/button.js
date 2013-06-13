$(function () {
    module('Button')

        test('constructor', function () {
            var button, input, $input;
            var $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            button = new qq.UploadButton({
                element: $fixture.find("#foo")[0],
                multiple: true,
                acceptFiles: "image/*,video/*,.test",
                name: "testFile"
            });

            input = button.getInput();
            $input = $(input);

            notEqual(input, null);
            equal($input.attr('type'), 'file')
            equal($input.attr('accept'), "image/*,video/*,.test");
            equal($input.attr('name'), "testFile");
        });

        test('reset', function () {
            var button, input, $input, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");

            button = new qq.UploadButton({
                element: $fixture.find("#foo")[0]
            });

            input = button.getInput();
            $input = $(input);

            button.reset();
            notEqual($input[0], button.getInput());
        });

        
        // test('onChange callback', function () {
        //     var button, input, $input;
        //     var $fixture = $("#qunit-fixture");
        //     $fixture.append("<div id='foo'></div>");

        //     button = new qq.UploadButton({
        //         element: $fixture.find("#foo")[0],
        //         onChange: function (input) {
        //             ok(true); 
        //         },
        //     });

        //     button.dispatch('onChange');
        //     
        // });

});
