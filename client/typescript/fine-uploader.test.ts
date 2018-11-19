import { FineUploader, UIOptions } from 'fine-uploader';
import * as qqAll from 'fine-uploader/lib/all';
import { s3 } from 'fine-uploader/lib/s3';
import { azure } from 'fine-uploader/lib/azure';
import { PromiseOptions, FineUploaderBasic } from 'fine-uploader/lib/core';
import * as qqCoreAll from 'fine-uploader/lib/core/all';
import { azure as azureCore } from 'fine-uploader/lib/core/azure';
import { s3 as s3Core } from 'fine-uploader/lib/core/s3';

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
 * Prepare/set options for the core Amazon S3 FineUploaderBasic
 */
let s3CoreOptions: s3Core.S3CoreOptions = {
    debug: true,
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
let s3CoreUploader = new s3Core.FineUploaderBasic(s3CoreOptions);


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
 * Prepare/set options for the Amazon S3 FineUploader
 */
let azureCoreOptions: azureCore.AzureCoreOptions = {
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
let azureCoreUploader = new azureCore.FineUploaderBasic(azureCoreOptions);

// Basic checks that fine-uploader/lib/all namespace is composed of correctly
let a1: typeof azure = qqAll.azure;
let a2: typeof s3 = qqAll.s3;
let a3: typeof FineUploader = qqAll.FineUploader;

// Basic checks that fine-uploader/lib/core/all namespaces is composed
// correctly.
let b1: typeof azureCore = qqCoreAll.azure;
let b2: typeof s3Core = qqCoreAll.s3;
let b3: typeof FineUploaderBasic = qqCoreAll.FineUploaderBasic;

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
