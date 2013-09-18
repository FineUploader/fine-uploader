/*globals qq*/
/**
 * Ajax requester used to send an ["Complete Multipart Upload"](http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadComplete.html)
 * request to S3 via the REST API.
 *
 * @param o Options passed by the creator, to overwrite any default option values.
 * @returns {{send: Function}} Used to send the request.
 * @constructor
 */
qq.s3.CompleteMultipartAjaxRequester = function(o) {
    "use strict";

    var requester,
        pendingCompleteRequests = {},
        options = {
            method: "POST",
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
     * Attach all required headers (including Authorization) to the "Complete" request.  This is a promissory function
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
     * @returns {string} A string that must be signed by the local server in order to send the associated "Complete" request.
     */
    function getStringToSign(id, uploadId, utcDateStr) {
        var endpoint = options.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            endOfUrl = getEndOfUrl(id, uploadId);

        return "POST" +
            "\n\n" +
            "application/xml; charset=UTF-8" +
            "\n\n" +
            "x-amz-date:" + utcDateStr +
            "\n" +
            "/" + bucket + "/" + endOfUrl;
    }

    /**
     * Called by the base ajax requester when the response has been received.  We definitively determine here if the
     * "Complete MPU" request has been a success or not.
     *
     * @param id ID associated with the file.
     * @param xhr `XMLHttpRequest` object containing the response, among other things.
     * @param isError A boolean indicating success or failure according to the base ajax requester (primarily based on status code).
     */
    function handleCompleteRequestComplete(id, xhr, isError) {
        var promise = pendingCompleteRequests[id],
            domParser = new DOMParser(),
            endpoint = options.endpointStore.getEndpoint(id),
            bucket = qq.s3.util.getBucket(endpoint),
            key = options.getKey(id),
            responseDoc = domParser.parseFromString(xhr.responseText, "application/xml"),
            bucketEls = responseDoc.getElementsByTagName("Bucket"),
            keyEls = responseDoc.getElementsByTagName("Key");

        delete pendingCompleteRequests[id];

        options.log(qq.format("Complete response status {}, body = {}", xhr.status, xhr.responseText));

        // If the base requester has determine this a failure, give up.
        if (isError) {
            options.log(qq.format("Complete Multipart Upload request for {} failed with status {}.", id, xhr.status), "error");
        }
        else {
            // Make sure the correct bucket and key has been specified in the XML response from AWS.
            if (bucketEls.length && keyEls.length) {
                if (bucketEls[0].textContent !== bucket) {
                    isError = true;
                    options.log(qq.format("Wrong bucket in response to Complete Multipart Upload request for {}.", id), "error");
                }

                // TODO Compare key name from response w/ expected key name if AWS ever fixes the encoding of key names in this response.
            }
            else {
                isError = true;
                options.log(qq.format("Missing bucket and/or key in response to Complete Multipart Upload request for {}.", id), "error");
            }
        }

        if (isError) {
            promise.failure("Problem asking Amazon to combine the parts!", xhr);
        }
        else {
            promise.success(xhr);
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

    /**
     * @param etagEntries Array of objects containing `etag` values and their associated `part` numbers.
     * @returns {string} XML string containing the body to send with the "Complete" request
     */
    function getCompleteRequestBody(etagEntries) {
        var doc = document.implementation.createDocument(null, "CompleteMultipartUpload", null);

        // Construct an XML document for each pair of etag/part values that correspond to part uploads.
        qq.each(etagEntries, function(idx, etagEntry) {
            var part = etagEntry.part,
                etag = etagEntry.etag,
                partEl = doc.createElement("Part"),
                partNumEl = doc.createElement("PartNumber"),
                partNumTextEl = doc.createTextNode(part),
                etagTextEl = doc.createTextNode(etag),
                etagEl = doc.createElement("ETag");

            etagEl.appendChild(etagTextEl);
            partNumEl.appendChild(partNumTextEl);
            partEl.appendChild(partNumEl);
            partEl.appendChild(etagEl);
            qq(doc).children()[0].appendChild(partEl);
        });

        // Turn the resulting XML document into a string fit for transport.
        return new XMLSerializer().serializeToString(doc);
    }

    requester = new qq.AjaxRequestor({
        method: options.method,
        contentType: "application/xml; charset=UTF-8",
        endpointStore: options.endpointStore,
        maxConnections: options.maxConnections,
        log: options.log,
        onComplete: handleCompleteRequestComplete,
        successfulResponseCodes: {
            POST: [200]
        }
    });


    return {
        /**
         * Sends the "Complete" request and fulfills the returned promise when the success of this request is known.
         *
         * @param id ID associated with the file.
         * @param uploadId AWS uploadId for this file
         * @param etagEntries Array of objects containing `etag` values and their associated `part` numbers.
         * @returns {qq.Promise}
         */
        send: function(id, uploadId, etagEntries) {
            var promise = new qq.Promise();

            getHeaders(id, uploadId).then(function(headers) {
                var body = getCompleteRequestBody(etagEntries);

                options.log("Submitting S3 complete multipart upload request for " + id);

                pendingCompleteRequests[id] = promise;
                requester.send(id, getEndOfUrl(id, uploadId), null, headers, body);
            }, promise.failure);

            return promise;
        }
    };
};
