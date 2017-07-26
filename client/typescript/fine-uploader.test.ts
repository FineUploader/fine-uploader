import { FineUploader, UIOptions } from 'fine-uploader';
import { s3 } from 'fine-uploader/lib/s3';
import { azure } from 'fine-uploader/lib/azure';
import { PromiseOptions } from 'fine-uploader/lib/core';

/**
 * Prepare/set options for the core + UI FineUploader
 */
let uiOptions: UIOptions = {
    debug: false,
    autoUpload: false,
    element: document.getElementById('fine-uploader-manual-trigger'),
    template: "qq-template-manual-trigger",
    request: {
        endpoint: "/server/upload"
    },
    deleteFile: {
        enabled: true,
        endpoint: '/uploads'
    },
    retry: {
        enableAuto: true
    }
};

/**
 * Instantiate the FineUploader and pass in the uiOptions
 */
let uploader = new FineUploader(uiOptions);


/**
 * Prepare/set options for the Amazon S3 FineUploader
 */
let s3UIOptions: s3.S3UIOptions = {
    debug: true,
    element: document.getElementById('fine-uploader'),
    request: {
        endpoint: '{ YOUR_BUCKET_NAME }.s3.amazonaws.com',
        accessKey: '{ YOUR_ACCESS_KEY }'
    },
    signature: {
        endpoint: '/s3/signature'
    },
    uploadSuccess: {
        endpoint: '/s3/success'
    },
    iframeSupport: {
        localBlankPagePath: '/success.html'
    },
    retry: {
        enableAuto: true // defaults to false
    },
    deleteFile: {
        enabled: true,
        endpoint: '/s3handler'
    }
}
let s3Uploader = new s3.FineUploader(s3UIOptions);



/**
 * Prepare/set options for the Amazon S3 FineUploader
 */
let azureUIOptions: azure.AzureUIOptions = {
    element: document.getElementById('fine-uploader'),
    request: {
        endpoint: 'https://{ YOUR_STORAGE_ACCOUNT_NAME }.blob.core.windows.net/{ YOUR_CONTAINER_NAME }'
    },
    signature: {
        endpoint: '/signature'
    },
    uploadSuccess: {
        endpoint: '/success'
    },
    retry: {
        enableAuto: true
    },
    deleteFile: {
        enabled: true
    }
}
let azureUploader = new azure.FineUploader(azureUIOptions);

/**
 * Manually upload files to the server. This method should be called on some button click event
 */
uploader.uploadStoredFiles();
s3Uploader.uploadStoredFiles();
azureUploader.uploadStoredFiles();

//FineUploader's Promise Implementation
let promise: PromiseOptions = new uploader.Promise();
let result = {};
promise.failure(result);
promise.success(result);
promise.then(() => {
    //promise is successfully fulfilled, do something here
}, () => {
    //promise is un-successfully fulfilled, do something here
});
promise.done(() => {
    //promise is fulfilled whether successful or not, do something here
});