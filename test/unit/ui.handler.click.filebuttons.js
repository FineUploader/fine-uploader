/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("ui.handler.click.filebuttons.js", function () {
    "use strict";

    describe("click handlers", function () {
    
        it("delete, retry, and cancel click handlers", function (done) {
            var fileId = 123,
                $container, $fileItem, $cancelLink, $deleteLink, $retryLink, $pauseLink, $continueLink, templating;

            $fixture.append("<div class='testcontainer'></div>");

            $container = $fixture.find(".testcontainer");
            $container.append("<div class='fileitem'></div>");

            $fileItem = $container.find(".fileitem");

            $fileItem.append("<a class='test-cancel'></a>");
            $cancelLink = $fileItem.find(".test-cancel");

            $fileItem.append("<a class='test-delete'></a>");
            $deleteLink = $fileItem.find(".test-delete");

            $fileItem.append("<a class='test-retry'></a>");
            $retryLink = $fileItem.find(".test-retry");

            $fileItem.append("<a class='test-pause'></a>");
            $pauseLink = $fileItem.find(".test-pause");

            $fileItem.append("<a class='test-continue'></a>");
            $continueLink = $fileItem.find(".test-continue");

            $fileItem[0].qqFileId = fileId;

            templating = {
                getFileList: function() {
                    return $container[0];
                },
                isCancel: function(el) {

                },
                isRetry: function(el) {

                },
                isDeleteButton: function(el) {

                },
                isPause: function(el) {

                },
                isContinueButton: function(el) {

                }
            };

            var handler = new qq.FileButtonsClickHandler({
                templating: templating,
                classes: {
                    cancel: "test-cancel",
                    deleteButton: "test-delete",
                    retry: "test-retry"
                },
                onGetName: function() { return "test"; },
                onDeleteFile: function(id) {
                    assert.equal(id, fileId, "deleted file");
                },
                onCancel: function(id) {
                    assert.equal(id, fileId, "canceled upload");
                },
                onRetry: function(id) {
                    assert.equal(id, fileId, "retried upload");
                },
                onPause: function(id) {
                    assert.equal(id, fileId, "paused upload");
                },
                onContinue: function(id) {
                    assert.equal(id, fileId, "continued upload");
                }
            });


            //these should result in callbacks
            $cancelLink.simulate("click");
            $deleteLink.simulate("click");
            $retryLink.simulate("click");

            //these should not result in callbacks
            $container.simulate("click");
            $fileItem.simulate("click");
            done();
        });
    });
});
