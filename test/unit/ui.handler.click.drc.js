describe('ui.handler.click.drc.js', function () {

    describe('click handlers', function () {
    
        it('delete, retry, and cancel click handlers', function (done) {
            var fileId = 123,
                $container, $fileItem, $cancelLink, $deleteLink, $retryLink, templating;
            //expect(3);

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

            templating = {
                getFileList: function() {
                    return $container[0];
                },
                isCancel: function(el) {

                },
                isRetry: function(el) {

                },
                isDelete: function(el) {

                }
            };

            var handler = new qq.DeleteRetryOrCancelClickHandler({
                templating: templating,
                classes: {
                    cancel: 'test-cancel',
                    deleteButton: 'test-delete',
                    retry: 'test-retry'
                },
                onGetName: function() { return "test"; },
                onDeleteFile: function(id) {
                    assert.equal(id, fileId, "deleted file");
                },
                onCancel: function(id) {
                    assert.equal(id, fileId, "cancelled upload");
                },
                onRetry: function(id) {
                    assert.equal(id, fileId, "retried upload");
                }
            });


            //these should result in callbacks
            $cancelLink.simulate('click');
            $deleteLink.simulate('click');
            $retryLink.simulate('click');

            //these should not result in callbacks
            $container.simulate('click');
            $fileItem.simulate('click');
            done();
        });
    });
});
