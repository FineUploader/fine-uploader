/*globals qq, assert*/
var qqtest = qqtest || {};
$.extend(qqtest, {
    canDownloadFileAsBlob: !qq.android() && qq.supportedFeatures.ajaxUploading && Boolean(window.FileReader),

    _downloadedFiles: {},

    downloadFileAsBlob: function(key, type) {
        "use strict";

        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                             window.MozBlobBuilder || window.MSBlobBuilder,
            xhr = new XMLHttpRequest(),
            downloadAsync = new qq.Promise(),
            blobBuilder = BlobBuilder && new BlobBuilder(),
            self = this;

        if (self._downloadedFiles[key]) {
            downloadAsync.success(self._downloadedFiles[key]);
        }
        else {
            xhr.open("GET", "http://" + window.location.hostname + ":3000/" + key, true);
            xhr.responseType = "arraybuffer";

            xhr.onerror = function() {
                assert.fail(null, null, "Failed to download test file!");
                downloadAsync.failure();
            };

            xhr.onload = function() {
                if (this.status === 200) {
                    if (blobBuilder) {
                        blobBuilder.append(this.response);
                        self._downloadedFiles[key] = blobBuilder.getBlob(type);
                    }
                    else {
                        self._downloadedFiles[key] = new Blob([this.response], {type: type});
                    }

                    downloadAsync.success(self._downloadedFiles[key]);
                }
                else {
                    assert.fail(null, null, "Failed to download test file! Status: " + this.status);
                    downloadAsync.failure();
                }
            };

            xhr.send();
        }

        return downloadAsync;
    }
}, true);
