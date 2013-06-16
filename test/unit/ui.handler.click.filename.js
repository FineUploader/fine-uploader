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
            $fileItem.append('<div class="test-file"></div>');

            $filenameDiv = $fileItem.find('.test-file');

            $fileItem[0].qqFileId = fileId;
        }
    });

        test('filename click handler - upload in progress', function () {
            new qq.FilenameClickHandler({
                listElement: $container[0],
                classes: {
                    file: 'test-file'
                },
                onGetName: function() {return "test"},
                onSetName: function(fileId, newName) {},
                onGetUploadStatus: function(fileId) { return qq.status.UPLOADING; }
            });


            helpme.createAndTriggerMouseEvent('click', $filenameDiv[0]);
            equal($container.find('INPUT').length, 0, "should not create input element to change filename, upload already in progress");
        });

    test('filename click handler - file submitted', function () {
        // can't get some of these tests to pass in FF on SauceLabs, even though code
        // being tested seems to work fine during manual testing and auto-testing in FF locally
        expect(qq.firefox() ? 4 : 7);

        var origName = "test.foo.bar",
            origNameSansExt = "test.foo",
            newNameSansExt = "blahblah",
            newName = "blahblah.bar",
            $input;

        new qq.FilenameClickHandler({
            listElement: $container[0],
            classes: {
                file: 'test-file'
            },
            onGetName: function() { return origName; },
            onSetName: function(fileId, name) {
                // can't get this test to pass in FF on SauceLabs, even though code being tested
                // seems to work fine during manual testing and auto-testing in FF locally
                if (!qq.firefox()) {
                    equal(name, newName, "new name should have the original extension appended");
                }
            },
            onGetUploadStatus: function(fileId) { return qq.status.SUBMITTED; }
        });


        //this shouldn't allow the user to change the filename
        helpme.createAndTriggerMouseEvent('click', $container[0]);

        helpme.createAndTriggerMouseEvent('click', $filenameDiv[0]);

        $input = $container.find('INPUT');

        equal($input.length, 1, "should have created input for changing filename");
        ok($input.is(':visible'), "filename input should be visible");
        ok(!$filenameDiv.is(":visible"), "filename display should not be visible");
        equal($input.val(), origNameSansExt, "filename input should equal original filename sans extension initially");

        // can't get these tests to pass in FF on SauceLabs, even though code being tested
        // seems to work fine during manual testing and auto-testing in FF locally
        if (!qq.firefox()) {
            $input.val(newNameSansExt);
            $input.blur();

            stop();

            setTimeout(function() {
                ok($filenameDiv.is(":visible"), "filename display should be visible again");
                equal($filenameDiv.text(), newName, "filename display should equal new name with original extension");
                start();
            }, 0);
        }
    });
});
