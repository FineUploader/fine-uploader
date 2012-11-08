module("upload button");

test("getInput & construction & reset", function() {
    var button = new qq.UploadButton({
        element: $('#qunit-fixture')[0],
        multiple: true,
        acceptFiles: "image/*,video/*,.test",
        name: "testfile"
    });

    var input = button.getInput();

    ok(input, "ensure input element is not null");
    ok($(input).attr('multiple'), "ensure multiple attribute has been set correctly");
    equal($(input).attr('accept'), "image/*,video/*,.test", "ensure accept attribute has been set correctly");
    equal($(input).attr('name'), 'testfile', "ensure name has been set correctly");

    button.reset();
    ok(!$(input).is(button.getInput()), "ensure input element has been reset");
});
