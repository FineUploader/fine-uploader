$(function () {
    module('Delete, Retry, and Cancel Click Handlers')

        test('delete, retry, and cancel click handler', function () {
            expect(3);

            var $fixture = $("#qunit-fixture"),
                fileId = 123,
                $container, $fileItem, $cancelLink, $deleteLink, $retryLink;

            $fixture.append('<div class="testcontainer"></div>');

            $container = $fixture.find('.testcontainer');
            $container.append('<div class="fileitem"></div>');

            $fileItem = $container.find('.fileitem');
            $fileItem.append('<a class="test-cancel"></a>');
            $cancelLink = $fileItem.find('.test-cancel');
            $fileItem.append('<a class="test-delete"></a>');
            $deleteLink = $fileItem.find('.test-delete');
            $fileItem.append('<a class="test-retry"></a>');
            $retryLink = $fileItem.find('.test-retry');

            $fileItem[0].qqFileId = fileId;

            new qq.DeleteRetryOrCancelClickHandler({
                listElement: $container[0],
                classes: {
                    cancel: 'test-cancel',
                    deleteButton: 'test-delete',
                    retry: 'test-retry'
                },
                onGetName: function() {return "test"},
                onDeleteFile: function(id) {
                    equal(id, fileId, "deleted file");
                },
                onCancel: function(id) {
                    equal(id, fileId, "cancelled upload");
                },
                onRetry: function(id) {
                    equal(id, fileId, "retried upload");
                }
            });

            //these should result in callbacks
            helpme.createAndTriggerMouseEvent('click', $cancelLink[0]);
            helpme.createAndTriggerMouseEvent('click', $deleteLink[0]);
            helpme.createAndTriggerMouseEvent('click', $retryLink[0]);

            //these should not
            helpme.createAndTriggerMouseEvent('click', $container[0]);
            helpme.createAndTriggerMouseEvent('click', $fileItem[0]);
        });
});
