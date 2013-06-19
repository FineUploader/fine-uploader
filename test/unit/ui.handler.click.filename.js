$(function () {
    var $fixture = $("#qunit-fixture"),
        fileId = 123,
        $container, $fileItem, $filenameDiv;

    module('Filename Click Handler', {
        setup: function() {
            $fixture = $("#qunit-fixture");

            $fixture.append('<div class="testcontainer"></div>');

            $container = $fixture.find('.testcontainer');
            $container.append('<div class="fileitem"></div>');

            $fileItem = $container.find('.fileitem');
            $fileItem.append('<div class="test-file"></div>')
            $fileItem.append('<input class="test-input">');

            $filenameDiv = $fileItem.find('.test-file');

            $fileItem[0].qqFileId = fileId;
        }
    });

        test('filename click handler - upload in progress', function () {
            expect(0);

            new qq.FilenameClickHandler({
                listElement: $container[0],
                classes: {
                    file: 'test-file'
                },
                onGetName: function() {return "test"},
                onSetName: function(fileId, newName) {},
                onGetUploadStatus: function(fileId) { return qq.status.UPLOADING; },
                onEditingStatusChange: function(id, isEditing) {
                    ok(false, "onEditingStatusChange should never be called");
                }
            });


            $filenameDiv.simulate('click');
        });

    function testFilenameInputBlur(simulateArgs) {
        test('filename click handler - file submitted w/ blur event = ' + simulateArgs, function () {
            expect(6);

            var actualName = "test.foo.bar",
                origNameSansExt = "test.foo",
                newName = "blahblah.bar",
                newNameSansExt = "blahblah",
                $input = $container.find('INPUT'),
                editing;

            new qq.FilenameClickHandler({
                listElement: $container[0],
                classes: {
                    file: 'test-file'
                },
                onGetName: function() { return actualName; },
                onSetName: function(fileId, name) {
                    // IE fires a blur event after a key event in some cases,
                    // let's ignore that as it will cause the tests to fail and doesn't cause us any harm.
                    if (actualName !== name) {
                        equal(name, newName, "new name should have the original extension appended");
                        actualName = name;
                    }
                },
                onGetUploadStatus: function(fileId) { return qq.status.SUBMITTED; },
                onGetInput: function(item) { return $input[0]; },
                onEditingStatusChange: function(id, isEditing) {
                    // IE fires a blur event after a key event in some cases,
                    // let's ignore that as it will cause the tests to fail and doesn't cause us any harm.
                    if (editing !== false) {
                        equal(id, fileId, "onEditingStatusChange fileId should be correct");

                        if (editing === undefined) {
                            ok(isEditing, "We should be in edit mode");
                        }
                        else {
                            ok(!isEditing, "We should not be in edit mode");
                        }

                        editing = isEditing
                    }
                }
            });

            //Fine Uploader would normally already have this set
            $filenameDiv.text(actualName);

            //this shouldn't allow the user to change the filename
            $container.simulate('click');

            $filenameDiv.simulate('click');

            equal($input.val(), origNameSansExt, "filename input should equal original filename sans extension initially");

            $input.val(newNameSansExt);
            $input.simulate.apply($input, simulateArgs);

            setTimeout(function() {
                start();
            }, 0);

            stop();
        });
    }

    // Can't get this test to pass in FF on SauceLabs only
    if (!qq.firefox()) {
        testFilenameInputBlur(['blur']);
    }

    testFilenameInputBlur(['keyup', {keyCode: $.simulate.keyCode.ENTER}]);


    test('filename click handler - undefined or empty filename submitted', function () {
        expect(1);

        var actualName = "test.foo.bar",
            origNameSansExt = "test.foo",
            $input = $container.find('INPUT');

        new qq.FilenameClickHandler({
            listElement: $container[0],
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

        equal($input.val(), origNameSansExt, "filename input should equal original filename sans extension initially");

        $input.val("");
        $input.simulate('blur');
    });
});
