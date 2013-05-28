var assert = chai.assert
  , expect = chai.expect;

describe('button.js', function () {

    describe('UploadButton', function () {
        
        it('should construct, getInput, and reset', function () {
            
            var button = new qq.UploadButton({
                element: $("#fixture")[0],
                multiple: true,
                acceptFiles: "image/*,video/*,.test",
                name: "testFile"
            });
            console.log(button);

            var input = button.getInput();

            assert.isNotNull(input);
            assert.isNotNull($(input).attr('multiple'));
            assert.equal($(input).attr('accept'), "image/*,video/*,.test");
            assert.equal($(input).attr('name'), "testFile");

            button.reset();
            assert.isFalse($(input).is(button.getInput()));
        });
    });

})
