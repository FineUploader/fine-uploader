var qqtest = qqtest || {};
$.extend(qqtest, {
    canDownloadFileAsBlob: !qq.android() && qq.supportedFeatures.ajaxUploading && Boolean(window.FileReader),

    downloadFileAsBlob: function(key, type) {
        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                             window.MozBlobBuilder || window.MSBlobBuilder,
            xhr = new XMLHttpRequest(),
            downloadAsync = new qq.Promise(),
            blobBuilder = BlobBuilder && new BlobBuilder();

        xhr.open("GET", "https://fineuploader_unittests.s3.amazonaws.com/" + key, true);
        xhr.responseType = "arraybuffer";

        xhr.onerror = downloadAsync.failure;
        xhr.onload = function() {
            if (this.status === 200) {
                if (blobBuilder) {
                    blobBuilder.append(this.response);
                    downloadAsync.success(blobBuilder.getBlob(type));
                }
                else {
                    downloadAsync.success(new Blob([this.response], {type: type}));
                }
            }
            else {
                downloadAsync.failure();
            }
        };

        xhr.send();

        return downloadAsync;
    }
}, true);
