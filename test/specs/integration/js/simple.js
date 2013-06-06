
var uploader;
uploader = new qq.FineUploader({
    element: $("#fixture")[0],
    debug: true,
    request: {
        endpoint: '/uploads/'
    },
    callbacks: {
        onError: errorHandler
    },
    deleteFile: {
            enabled: true,
            endpoint: '/uploads'
    }
});
