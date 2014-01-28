/*globals qq*/
/**
 * Ajax requester used to send an ["Initiate Multipart Upload"](http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadInitiate.html)
 * request to S3 via the REST API.
 *
 * @param o Options from the caller - will override the defaults.
 * @constructor
 */
qq.s3.InitiateMultipartAjaxRequester = function(o) {
    "use strict";

    var requester,
        pendingInitiateRequests = {},
        options = {
            filenameParam: "qqfilename",
            method: "POST",
            endpointStore: null,
            paramsStore: null,
            signatureSpec: null,
            aclStore: null,
            reducedRedundancy: false,
            serverSideEncryption: false,
            maxConnections: 3,
            getContentType: function(id) {},
            getKey: function(id) {},
            getName: function(id) {},
            log: function(str, level) {}
        },
        getSignatureAjaxRequester;

    qq.extend(options, o);

    getSignatureAjaxRequester = new qq.s3.RequestSigner({
        signatureSpec: options.signatureSpec,
        cors: options.cors,
        log: options.log
    });


    /**
     * Determine all headers for the "Initiate MPU" request, including the "Authorization" header, which must be determined
     * by the local server.  This is a promissory function.  If the server responds with a signature, the headers
     * (including the Authorization header) will be passed into the success method of the promise.  Otherwise, the failure
     * method on the promise will be called.
     *
     * @param id Associated file ID
     * @returns {qq.Promise}
     */
    function getHeaders(id) {
        var bucket = qq.s3.util.getBucket(options.endpointStore.get(id)),
            headers = {},
            promise = new qq.Promise(),
            key = options.getKey(id),
            signatureConstructor;

        headers["x-amz-acl"] = options.aclStore.get(id);

        if (options.reducedRedundancy) {
            headers[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
        }

        if (options.serverSideEncryption) {
            headers[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
        }

        headers[qq.s3.util.AWS_PARAM_PREFIX + options.filenameParam] = encodeURIComponent(options.getName(id));

        qq.each(options.paramsStore.get(id), function(name, val) {
            headers[qq.s3.util.AWS_PARAM_PREFIX + name] = encodeURIComponent(val);
        });

        signatureConstructor = getSignatureAjaxRequester.constructStringToSign
            (getSignatureAjaxRequester.REQUEST_TYPE.MULTIPART_INITIATE, bucket, key)
            .withContentType(options.getContentType(id))
            .withHeaders(headers);

        // Ask the local server to sign the request.  Use this signature to form the Authorization header.
        getSignatureAjaxRequester.getSignature(id, {signatureConstructor: signatureConstructor}).then(function(response) {
            headers = signatureConstructor.getHeaders();
            headers.Authorization = "AWS " + options.signatureSpec.credentialsProvider.get().accessKey + ":" + response.signature;
            promise.success(headers, signatureConstructor.getEndOfUrl());
        }, promise.failure);

        return promise;
    }

    /**
     * Called by the base ajax requester when the response has been received.  We definitively determine here if the
     * "Initiate MPU" request has been a success or not.
     *
     * @param id ID associated with the file.
     * @param xhr `XMLHttpRequest` object containing the response, among other things.
     * @param isError A boolean indicating success or failure according to the base ajax requester (primarily based on status code).
     */
    function handleInitiateRequestComplete(id, xhr, isError) {
        var promise = pendingInitiateRequests[id],
            domParser = new DOMParser(),
            responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
            uploadIdElements, messageElements, uploadId, errorMessage, status;

        delete pendingInitiateRequests[id];

        // The base ajax requester may declare the request to be a failure based on status code.
        if (isError) {
            status = xhr.status;

            messageElements = responseDoc.getElementsByTagName("Message");
            if (messageElements.length > 0) {
                errorMessage = messageElements[0].textContent;
            }
        }
        // If the base ajax requester has not declared this a failure, make sure we can retrieve the uploadId from the response.
        else {
            uploadIdElements = responseDoc.getElementsByTagName("UploadId");
            if (uploadIdElements.length > 0) {
                uploadId = uploadIdElements[0].textContent;
            }
            else {
                errorMessage = "Upload ID missing from request";
            }
        }

        // Either fail the promise (passing a descriptive error message) or declare it a success (passing the upload ID)
        if (uploadId === undefined) {
            if (errorMessage) {
                options.log(qq.format("Specific problem detected initiating multipart upload request for {}: '{}'.", id, errorMessage), "error");
            }
            else {
                options.log(qq.format("Unexplained error with initiate multipart upload request for {}.  Status code {}.", id, status), "error");
            }

            promise.failure("Problem initiating upload request with Amazon.", xhr);
        }
        else {
            options.log(qq.format("Initiate multipart upload request successful for {}.  Upload ID is {}", id, uploadId));
            promise.success(uploadId, xhr);
        }
    }

    requester = qq.extend(this, new qq.AjaxRequester({
        method: options.method,
        contentType: null,
        endpointStore: options.endpointStore,
        maxConnections: options.maxConnections,
        allowXRequestedWithAndCacheControl: false, //These headers are not necessary & would break some installations if added
        log: options.log,
        onComplete: handleInitiateRequestComplete,
        successfulResponseCodes: {
            POST: [200]
        }
    }));


    qq.extend(this, {
        /**
         * Sends the "Initiate MPU" request to AWS via the REST API.  First, though, we must get a signature from the
         * local server for the request.  If all is successful, the uploadId from AWS will be passed into the promise's
         * success handler. Otherwise, an error message will ultimately be passed into the failure method.
         *
         * @param id The ID associated with the file
         * @returns {qq.Promise}
         */
        send: function(id) {
            var promise = new qq.Promise();

            getHeaders(id).then(function(headers, endOfUrl) {
                options.log("Submitting S3 initiate multipart upload request for " + id);

                pendingInitiateRequests[id] = promise;
                requester.initTransport(id)
                    .withPath(endOfUrl)
                    .withHeaders(headers)
                    .send();
            }, promise.failure);

            return promise;
        }
    });
};
