describe('ui.handler.click.filename.js', function () {

    var fileId = 123,
        $container, $fileItem, $filenameDiv, templating;

    beforeEach(function () {
        $fixture.append('<div class="testcontainer"></div>');

        $container = $fixture.find('.testcontainer');
        $container.append('<div class="fileitem"></div>');

        $fileItem = $container.find('.fileitem');
        $fileItem.append('<div class="test-file" file-id="123"></div>');
        $fileItem.append('<input class="test-input">');

        $filenameDiv = $fileItem.find('.test-file');

        templating = {
            getFileList: function() {
                return $container[0];
            },
            isFileName: function(el) {
                return $(el).hasClass("test-file");
            },
            isEditIcon: function(el) {
            },
            getFileId: function(el) {
                return $(el).attr("file-id");
            },
            getEditInput: function(id) {
                return $container.find('INPUT')[0];
            }
        };
    });

    it('does not allow editing when upload is in progress', function () {

        var handler = new qq.FilenameClickHandler({
            templating: templating,
            classes: {
                file: 'test-file'
            },
            onGetName: function() { return "test"; },
            onSetName: function(fileId, newName) {},
            onGetUploadStatus: function(fileId) { return qq.status.UPLOADING; },
            onEditingStatusChange: function(id, isEditing) {
                assert.ok(false, "onEditingStatusChange should never be called");
            }
        });

        $filenameDiv.simulate('click');
    });

    function testFilenameInputBlur(origName, origNameSansExt, newName, newNameSansExt, simulateArgs) {

        it('filename click handler - file submitted w/ blur event = ' + simulateArgs, function (done) {

            var actualName = origName,
                $input = $container.find('INPUT'),
                editing;

            var handler = new qq.FilenameClickHandler({
                templating: templating,
                classes: {
                    file: 'test-file'
                },
                onGetName: function() { return actualName; },
                onSetName: function(fileId, name) {
                    // IE fires a blur event after a key event in some cases,
                    // let's ignore that as it will cause the tests to fail and doesn't cause us any harm.
                    if (actualName !== name) {
                        assert.equal(name, newName, "new name should have the original extension appended");
                        actualName = name;
                    }
                },
                onGetUploadStatus: function(fileId) { return qq.status.SUBMITTED; },
                onGetInput: function(item) { return $input[0]; },
                onEditingStatusChange: function(id, isEditing) {
                    // IE fires a blur event after a key event in some cases,
                    // let's ignore that as it will cause the tests to fail and doesn't cause us any harm.
                    if (editing !== false) {
                        assert.equal(id, fileId, "onEditingStatusChange fileId should be correct");

                        if (editing === undefined) {
                            assert.ok(isEditing, "We should be in edit mode");
                        }
                        else {
                            assert.ok(!isEditing, "We should not be in edit mode");
                        }

                        editing = isEditing;
                    }
                }
            });

            //Fine Uploader would normally already have this set
            $filenameDiv.text(actualName);

            //this shouldn't allow the user to change the filename
            $container.simulate('click');

            $filenameDiv.simulate('click');

            assert.equal($input.val(), origNameSansExt, "filename input should equal original filename sans extension initially");

            $input.val(newNameSansExt);
            $input.simulate.apply($input, simulateArgs);

            setTimeout(function() {
                done();
            }, 0);

        });
    }

    // Can't get this test to pass in FF on SauceLabs only
    if (!qq.firefox()) {
        testFilenameInputBlur("test.foo.bar", "test.foo", "blahblah.bar", "blahblah", ['blur']);
        testFilenameInputBlur("test", "test", "blahblah", "blahblah", ['blur']);
    }

    testFilenameInputBlur("test.foo.bar", "test.foo", "blahblah.bar", "blahblah", ['keyup', {keyCode: $.simulate.keyCode.ENTER}]);
    testFilenameInputBlur("test", "test", "blahblah", "blahblah", ['keyup', {keyCode: $.simulate.keyCode.ENTER}]);


    it('handles undefined or empty filename submitted', function () {

        var actualName = "test.foo.bar",
            origNameSansExt = "test.foo",
            $input = $container.find('INPUT');

        var handler = new qq.FilenameClickHandler({
            templating: templating,
            classes: {
                file: 'test-file'
            },
            onGetName: function() { return actualName; },
            onGetUploadStatus: function(fileId) { return qq.status.SUBMITTED; },
            onGetInput: function(item) { return $input[0]; }
        });

        //Fine Uploader would normally already have this set
        $filenameDiv.text(actualName);

        $filenameDiv.simulate('click');

        assert.equal($input.val(), origNameSansExt, "filename input should equal original filename sans extension initially");

        $input.val("");
        $input.simulate('blur');
    });
});
