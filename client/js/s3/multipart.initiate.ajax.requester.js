/*globals qq*/
// TODO comments
qq.s3.InitiateMultipartAjaxRequester = function(o) {
    "use strict";

    var requester,
        validMethods = ["POST"],
        options = {
            method: "POST",
            endpointStore: null,
            paramsStore: null,
            signatureEndpoint: null,
            accessKey: null,
            acl: "private",
            maxConnections: 3,
            getContentType: function(id) {},
            getKey: function(id) {},
            log: function(str, level) {}
        },
        getSignatureAjaxRequester;

    qq.extend(options, o);

    getSignatureAjaxRequester = new qq.s3.PolicySignatureAjaxRequestor({
        endpoint: options.signatureEndpoint,
        cors: options.cors,
        log: options.log
    });


    // TODO remove code duplication among all ajax requesters
    if (qq.indexOf(validMethods, getNormalizedMethod()) < 0) {
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for S3 Initiate Multipart Upload requests!");
    }

    // TODO remove code duplication among all ajax requesters
    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    // TODO comments
    function getHeaders(id, key) {
        var bucket = qq.s3.util.getBucket(options.endpointStore.getEndpoint(id)),
            headers = {},
            promise = new qq.Promise(),
            toSign;

        headers["x-amz-date"] = new Date().toUTCString();
        headers["Content-Type"] = options.getContentType(id);
        headers["x-amz-acl"] = options.acl;

        qq.each(options.paramsStore.getParams(id), function(name, val) {
            headers[qq.s3.util.AWS_PARAM_PREFIX + name] = val;
        });

        toSign = {multipartHeaders: getStringToSign(headers, bucket, key)};

        // TODO handle failure?
        getSignatureAjaxRequester.getSignature(id, toSign).then(function(response) {
            headers.Authorization = "AWS " + options.accessKey + ":" + response.signature;
            promise.success(headers);
        }, promise.failure);

        return promise;
    }

    /**
     * @param headers All headers to be sent with the initiate request
     * @param bucket Bucket where the file parts will reside
     * @param key S3 Object name for the file
     * @returns {string} The string that must be signed by the local server before sending the initiate request
     */
    function getStringToSign(headers, bucket, key) {
        var headerNames = [],
            headersAsString = "";

        qq.each(headers, function(name, val) {
            if (name !== "Content-Type") {
                headerNames.push(name);
            }
        });

        headerNames.sort();

        qq.each(headerNames, function(idx, name) {
            headersAsString += name + ":" + headers[name] + "\n";
        });

        return "POST\n\n" + headers["Content-Type"] + "\n\n" + headersAsString + "/" + bucket + "/" + key + "?uploads";
    }


    function handleInitiateRequestComplete(id, xhr, isError) {
        //TODO handle the result of the "Initiate MPU" request
        qq.log(xhr.responseText);
    }

    requester = new qq.AjaxRequestor({
        method: getNormalizedMethod(),
        contentType: null,
        endpointStore: options.endpointStore,
        maxConnections: options.maxConnections,
        log: options.log,
        onComplete: handleInitiateRequestComplete,
        successfulResponseCodes: {
            POST: [200]
        }
    });


    return {
        // TODO comments
        send: function(id, key) {
            var promise = new qq.Promise(),
                addToPath = key + "?uploads";

            // TODO handle failure?
            getHeaders(id, key).then(function(headers) {
                options.log("Submitting S3 initiate multipart upload request for " + id);

                requester.send(id, addToPath, null, headers);
            }, promise.failure);

            return promise;
        }
    };
};
