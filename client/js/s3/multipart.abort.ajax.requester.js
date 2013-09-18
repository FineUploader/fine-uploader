/**
 * Ajax requester used to send an ["Abort Multipart Upload"](http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadAbort.html)
 * request to S3 via the REST API.

 * @param o
 * @returns {{send: Function}}
 * @constructor
 */
qq.s3.AbortMultipartAjaxRequester = function(o) {
    "use strict";

    var requester,
        options = {
            method: "DELETE",
            endpointStore: null,
            signatureSpec: null,
            accessKey: null,
            maxConnections: 3,
            getKey: function(id) {},
            log: function(str, level) {}
        },
        getSignatureAjaxRequester;

    qq.extend(options, o);

    // Transport for requesting signatures (for the "Complete" requests) from the local server
    getSignatureAjaxRequester = new qq.s3.SignatureAjaxRequestor({
        signatureSpec: options.signatureSpec,
        cors: options.cors,
        log: options.log
    });

    /**
     * Attach all required headers (including Authorization) to the "Abort" request.  This is a promissory function
     * that will fulfill the associated promise once all headers have been attached or when an error has occurred that
     * prevents headers from being attached.
     *
     * @param id Associated file ID
     * @param uploadId ID of the associated upload, according to AWS
     * @returns {qq.Promise}
     */
    function getHeaders(id, uploadId) {
        var headers = {},
            promise = new qq.Promise(),
            toSign;

        headers["x-amz-date"] = new Date().toUTCString();

        toSign = {headers: getStringToSign(id, uploadId, headers["x-amz-date"])};

        // Ask the local server to sign the request.  Use this signature to form the Authorization header.
        getSignatureAjaxRequester.getSignature(id, toSign).then(function(response) {
            headers.Authorization = "AWS " + options.accessKey + ":" + response.signature;
            promise.success(headers);
        }, promise.failure);

        return promise;
    }

    /**
     * @param id Associated file ID
     * @param uploadId ID of the associated upload, according to AWS
     * @param utcDateStr The date, formatted as a UTC string
     * @returns {string} A string that must be signed by the local server in order to send the associated "Abort" request.
     */
    function getStringToSign(id, uploadId, utcDateStr) {
        var endpoint = options.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            endOfUrl = getEndOfUrl(id, uploadId);

        return "DELETE" +
            "\n\n\n\n" +
            "x-amz-date:" + utcDateStr +
            "\n" +
            "/" + bucket + "/" + endOfUrl;
    }

    /**
     * Called by the base ajax requester when the response has been received.  We definitively determine here if the
     * "Abort MPU" request has been a success or not.
     *
     * @param id ID associated with the file.
     * @param xhr `XMLHttpRequest` object containing the response, among other things.
     * @param isError A boolean indicating success or failure according to the base ajax requester (primarily based on status code).
     */
    function handleAbortRequestComplete(id, xhr, isError) {
        var domParser = new DOMParser(),
            responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
            errorEls = responseDoc.getElementsByTagName("Error"),
            awsErrorMsg;


        options.log(qq.format("Abort response status {}, body = {}", xhr.status, xhr.responseText));

        // If the base requester has determine this a failure, give up.
        if (isError) {
            options.log(qq.format("Abort Multipart Upload request for {} failed with status {}.", id, xhr.status), "error");
        }
        else {
            // Make sure the correct bucket and key has been specified in the XML response from AWS.
            if (errorEls.length) {
                isError = true;
                awsErrorMsg = responseDoc.getElementsByTagName("Message")[0].textContent;
                options.log(qq.format("Failed to Abort Multipart Upload request for {}.  Error: {}", id, awsErrorMsg), "error");
            }
            else {
                options.log(qq.format("Abort MPU request succeeded for file ID {}.", id));
            }
        }
    }

    /**
     * @param id Associated file ID
     * @param uploadId ID of the associated upload, according to AWS
     * @returns {String} The last part of the URL where we will send this request.  Includes the resource (key) and any params.
     */
    function getEndOfUrl(id, uploadId) {
        return qq.format("{}?uploadId={}", options.getKey(id), uploadId);
    }


    requester = new qq.AjaxRequestor({
        validMethods: ["DELETE"],
        method: options.method,
        contentType: null,
        endpointStore: options.endpointStore,
        maxConnections: options.maxConnections,
        log: options.log,
        onComplete: handleAbortRequestComplete,
        successfulResponseCodes: {
            DELETE: [204]
        }
    });


    return {
        /**
         * Sends the "Abort" request.
         *
         * @param id ID associated with the file.
         * @param uploadId AWS uploadId for this file
         */
        send: function(id, uploadId) {
            var endOfUrl = getEndOfUrl(id, uploadId);

            getHeaders(id, uploadId).then(function(headers) {
                options.log("Submitting S3 Abort multipart upload request for " + id);

                requester.send(id, endOfUrl, null, headers);
            });
        }
    };
};
