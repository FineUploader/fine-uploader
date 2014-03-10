/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("templating.js", function() {
    "use strict";

    var $template, templating,
        PAUSED_TEXT = "Testing - Paused",
        HIDE_CSS = "test-hide",
        EDITABLE_CSS = "test-editable",
        /* jshint quotmark:false */
        emptyTemplate = '<div class="qq-uploader-selector qq-uploader">' +
                            '<ul class="qq-upload-list-selector qq-upload-list">' +
                                '<li></li>' +
                            '</ul>' +
                        '</div>',
        defaultTemplate = '<div class="qq-uploader-selector qq-uploader">' +
                            '<div class="qq-upload-drop-area-selector qq-upload-drop-area" qq-hide-dropzone>' +
                                '<span>Drop files here to upload</span>' +
                            '</div>' +
                            '<div class="qq-upload-button-selector qq-upload-button">' +
                                '<div>Upload a file</div>' +
                            '</div>' +
                            '<span class="qq-drop-processing-selector qq-drop-processing">' +
                                '<span>Processing dropped files...</span>' +
                                '<span class="qq-drop-processing-spinner-selector qq-drop-processing-spinner"></span>' +
                            '</span>' +
                            '<ul class="qq-upload-list-selector qq-upload-list">' +
                                '<li>' +
                                    '<div class="qq-progress-bar-container-selector">' +
                                        '<div class="qq-progress-bar-selector qq-progress-bar"></div>' +
                                    '</div>' +
                                    '<span class="qq-upload-spinner-selector qq-upload-spinner"></span>' +
                                    '<span class="qq-edit-filename-icon-selector qq-edit-filename-icon"></span>' +
                                    '<span class="qq-upload-file-selector qq-upload-file"></span>' +
                                    '<input class="qq-edit-filename-selector qq-edit-filename" tabindex="0" type="text">' +
                                    '<span class="qq-upload-size-selector qq-upload-size"></span>' +
                                    '<a class="qq-upload-cancel-selector qq-upload-cancel" href="#">Cancel</a>' +
                                    '<a class="qq-upload-retry-selector qq-upload-retry" href="#">Retry</a>' +
                                    '<a class="qq-upload-delete-selector qq-upload-delete" href="#">Delete</a>' +
                                    '<a class="qq-upload-pause-selector" href="#">Pause</a>' +
                                    '<a class="qq-upload-continue-selector" href="#">Continue</a>' +
                                    '<span class="qq-upload-status-text-selector qq-upload-status-text"></span>' +
                                '</li>' +
                            '</ul>' +
                        '</div>',
        simpleTwoLevelFilesTemplate = '<div class="qq-uploader-selector qq-uploader">' +
                            '<ul class="qq-upload-list-selector qq-upload-list">' +
                                '<li>' +
                                    '<a class="qq-upload-delete-selector qq-upload-delete" href="#">Delete</a>' +
                                    '<div>' +
                                        '<span class="qq-edit-filename-icon-selector qq-edit-filename-icon"></span>' +
                                        '<span class="qq-upload-file-selector qq-upload-file"></span>' +
                                        '<input class="qq-edit-filename-selector qq-edit-filename" tabindex="0" type="text">' +
                                        '<span class="qq-upload-size-selector qq-upload-size"></span>' +
                                        '<a class="qq-upload-cancel-selector qq-upload-cancel" href="#">Cancel</a>' +
                                        '<div>' +
                                            '<a class="qq-upload-retry-selector qq-upload-retry" href="#">Retry</a>' +
                                        '</div>' +
                                        '<span class="qq-upload-status-text-selector qq-upload-status-text"></span>' +
                                    '</div>' +
                                '</li>' +
                            '</ul>' +
                        '</div>';

    function renderTemplate(content) {
        $template = $('<script id="qq-template" type="text/template"></script>');
        $template[0].text = content;
        $fixture.append($template);
        templating = new qq.Templating({
            log: function() {},
            containerEl: $fixture[0],
            classes: {
                hide: HIDE_CSS,
                editable: EDITABLE_CSS
            },
            text: {
                paused: PAUSED_TEXT
            }
        });
        templating.render();
    }

    afterEach(function() {
        $("#qq-template").remove();
    });

    describe("test with empty template", function() {
        it("ensure missing elements do not cause exceptions", function() {
            renderTemplate(emptyTemplate);

            templating.clearFiles();
            templating.addFile(0, "foobar");
            /* jshint eqnull:true */
            assert.ok(templating.getFileList() != null);
            templating.markFilenameEditable(0);
            templating.updateFilename(0, "test");
            templating.hideFilename(0);
            templating.showFilename(0);
            assert.ok(templating.getButton() == null);
            templating.hideDropProcessing();
            templating.showDropProcessing();
            assert.ok(templating.getDropZone() !== null);
            assert.ok(!templating.isEditFilenamePossible());
            assert.ok(!templating.isRetryPossible());
            assert.ok(templating.getFileContainer(0) != null);
            templating.showEditIcon(0);
            templating.hideEditIcon(0);
            assert.ok(templating.getEditInput(0) == null);
            templating.updateProgress(0, 50, 100);
            templating.hideProgress(0);
            templating.resetProgress(0);
            templating.showCancel(0);
            templating.hideCancel(0);
            templating.showDeleteButton(0);
            templating.hideDeleteButton(0);
            templating.updateSize(0, "100MB");
            templating.setStatusText(0, "test");
            templating.hideSpinner(0);
            templating.showSpinner(0);
            templating.allowPause(0);
            templating.allowContinueButton(0);
            templating.hidePause(0);
            templating.uploadContinued(0);
            templating.uploadPaused(0);
            templating.removeFile(0);
        });
    });

    describe("test with default template", function() {
        var fileContainer0;


        beforeEach(function() {
            renderTemplate(defaultTemplate);
            templating.addFile(0, "foobar");
            fileContainer0 = templating.getFileContainer(0);
        });

        afterEach(function() {
            templating.clearFiles();
        });

        it("only displays relevant elements initially", function() {
            assert.ok($(fileContainer0).find(".qq-upload-delete-selector").hasClass(HIDE_CSS));
            assert.ok($(fileContainer0).find(".qq-progress-bar-container-selector").hasClass(HIDE_CSS));
            assert.ok($(fileContainer0).find(".qq-upload-size-selector").hasClass(HIDE_CSS));
            assert.ok($(fileContainer0).find(".qq-upload-retry-selector").hasClass(HIDE_CSS));

            qq.supportedFeatures.fileDrop && assert.ok($fixture.find(".qq-drop-processing-selector").hasClass(HIDE_CSS));
        });

        it("has edit filename & retry features enabled, also button present if applicable", function() {
            assert.ok(templating.isEditFilenamePossible());
            assert.ok(templating.isRetryPossible());
            /* jshint eqnull:true */
            assert.ok(templating.getButton() != null);
        });

        it("adds & removes file entries", function() {
            /* jshint eqnull:true */
            assert.ok(templating.getFileContainer(0) != null);
            templating.removeFile(0);
            assert.ok(templating.getFileContainer(0) == null);
            templating.addFile(0, "test");
            templating.clearFiles();
            assert.ok(templating.getFileContainer(0) == null);
        });

        it("embeds the file ID correctly", function() {
            assert.ok(templating.getFileId(fileContainer0) === 0);
        });

        it("hides and shows spinner", function() {
            templating.hideSpinner(0);
            assert.ok($(fileContainer0).find(".qq-upload-spinner-selector").hasClass(HIDE_CSS));

            templating.showSpinner(0);
            assert.ok(!$(fileContainer0).find(".qq-upload-spinner-selector").hasClass(HIDE_CSS));
        });

        it("updates status text", function() {
            templating.setStatusText(0, "foobar");
            assert.equal($(fileContainer0).find(".qq-upload-status-text-selector").text(), "foobar");
        });

        it("updates file name", function() {
            templating.updateFilename(0, "123abc");
            assert.equal($(fileContainer0).find(".qq-upload-file-selector").text(), "123abc");
        });

        it("updates size text", function() {
            templating.updateSize(0, "123MB");
            assert.equal($(fileContainer0).find(".qq-upload-size-selector").text(), "123MB");
        });

        it("hides and shows delete link", function() {
            templating.hideDeleteButton(0);
            assert.ok($(fileContainer0).find(".qq-upload-delete-selector").hasClass(HIDE_CSS));

            templating.showDeleteButton(0);
            assert.ok(!$(fileContainer0).find(".qq-upload-delete-selector").hasClass(HIDE_CSS));
        });

        it("hides and shows cancel link", function() {
            templating.hideCancel(0);
            assert.ok($(fileContainer0).find(".qq-upload-cancel-selector").hasClass(HIDE_CSS));

            templating.showCancel(0);
            assert.ok(!$(fileContainer0).find(".qq-upload-cancel-selector").hasClass(HIDE_CSS));
        });

        it("hides and shows edit icon", function() {
            templating.hideEditIcon(0);
            assert.ok(!$(fileContainer0).find(".qq-edit-filename-icon-selector").hasClass(EDITABLE_CSS));

            templating.showEditIcon(0);
            assert.ok($(fileContainer0).find(".qq-edit-filename-icon-selector").hasClass(EDITABLE_CSS));
        });

        if (qq.supportedFeatures.fileDrop) {
            it("hides and shows drop processing spinner", function() {
                templating.hideDropProcessing(0);
                assert.ok($fixture.find(".qq-drop-processing-selector").hasClass(HIDE_CSS));

                templating.showDropProcessing(0);
                assert.ok(!$fixture.find(".qq-drop-processing-selector").hasClass(HIDE_CSS));
            });
        }

        it("toggles visibility of pause/continue buttons correctly", function() {
            templating.allowPause(0);
            assert.ok(!$fixture.find(".qq-upload-pause-selector").hasClass(HIDE_CSS));
            assert.ok($fixture.find(".qq-upload-continue-selector").hasClass(HIDE_CSS));

            templating.allowContinueButton(0);
            assert.ok($fixture.find(".qq-upload-pause-selector").hasClass(HIDE_CSS));
            assert.ok(!$fixture.find(".qq-upload-continue-selector").hasClass(HIDE_CSS));
        });

        it("Updates status text, buttons, & spinner on pause & continue correctly", function() {
            var $status = $fixture.find(".qq-upload-status-text-selector");

            templating.uploadPaused(0);
            assert.equal($status.text(), PAUSED_TEXT);
            assert.ok($fixture.find(".qq-upload-pause-selector").hasClass(HIDE_CSS));
            assert.ok(!$fixture.find(".qq-upload-continue-selector").hasClass(HIDE_CSS));
            assert.ok($fixture.find(".qq-upload-spinner-selector").hasClass(HIDE_CSS));


            templating.uploadContinued(0);
            assert.equal($status.text(), "");
            assert.ok($fixture.find(".qq-upload-continue-selector").hasClass(HIDE_CSS));
            assert.ok(!$fixture.find(".qq-upload-pause-selector").hasClass(HIDE_CSS));
            assert.ok(!$fixture.find(".qq-upload-spinner-selector").hasClass(HIDE_CSS));
        });
    });

    describe("file elements are two levels below the file container", function() {
        var fileContainer, deleteButtonEl, cancelButtonEl, retryButtonEl;

        it("is able to find the file ID given a button elememnt", function() {
            renderTemplate(simpleTwoLevelFilesTemplate);
            templating.addFile(0, "foobar");
            fileContainer = templating.getFileContainer(0);
            deleteButtonEl = $(fileContainer).find(".qq-upload-delete-selector")[0];
            cancelButtonEl = $(fileContainer).find(".qq-upload-cancel-selector")[0];
            retryButtonEl = $(fileContainer).find(".qq-upload-retry-selector")[0];

            assert.equal(templating.getFileId(deleteButtonEl), 0, "Button 1 level deep");
            assert.equal(templating.getFileId(cancelButtonEl), 0, "Button 2 levels deep");
            assert.equal(templating.getFileId(retryButtonEl), 0, "Button 3 levels deep");
        });
    });

    if (qqtest.canDownloadFileAsBlob) {
        it("updates the name in the UI after a call to setName API method", function(done) {
            assert.expect(2, done);

            helpme.setupFileTests();

            var uploader;

            var template = $('<script id="qq-template" type="text/template">' + defaultTemplate + '</script>');
            $fixture.append(template);

            uploader = new qq.FineUploader({
                element: $fixture[0],
                autoUpload: false,

                callbacks: {
                    onSubmitted: function(id) {
                        assert.equal($(".qq-upload-file-selector").text(), "up.jpg");

                        uploader.setName(id, "newname.test");
                        setTimeout(function() {
                            assert.equal($(".qq-upload-file-selector").text(), "newname.test");
                        }, 0);
                    }
                }
            });

            qqtest.downloadFileAsBlob("up.jpg", "image/jpeg").then(function(blob) {
                uploader.addBlobs({blob: blob, name: "up.jpg"});
            });
        });
    }
});
