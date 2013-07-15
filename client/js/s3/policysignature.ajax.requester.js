/*globals qq, XMLHttpRequest*/
qq.s3.PolicySignatureAjaxRequestor = function(o) {
    "use strict";

    var requestor,
        validMethods = ["POST"],
        options = {
            method: "POST",
            endpoint: null,
            maxConnections: 3,
            customHeaders: {},
            paramsStore: {},
            cors: {
                expected: false,
                sendCredentials: false
            },
            log: function(str, level) {},
            onSignatureReceived: function(id, policyAndSignature, isError) {}
        };

    qq.extend(options, o);

    if (qq.indexOf(validMethods, getNormalizedMethod()) < 0) {
        throw new Error("'" + getNormalizedMethod() + "' is not a supported method for S3 signature requests!");
    }

    function getNormalizedMethod() {
        return options.method.toUpperCase();
    }

    function handleSignatureReceived(id, xhrOrXdr, isError) {
        var responseJson = xhrOrXdr.responseText,
            errorMessage = "S3 policy signature request failed!",
            response;

        // React if the UA indicates failure, either via status or error callback.
        if (isError) {
            // If this is an XDR request, the status will not be available.
            if (xhrOrXdr.status !== undefined) {
                errorMessage = qq.format("{}  Received response code of {}.", errorMessage, xhrOrXdr.status);
            }

            options.log(errorMessage, "error");
        }

        else if (responseJson) {
            response = qq.parseJson(responseJson);

            if (!response.policy) {
                isError = true;
                options.log("Response does not include the base64 encoded policy!", "error");
            }
            else if (!response.signature) {
                isError = true;
                options.log("Response does not include the base64 encoded signed policy!", "error");
            }
        }
        else {
            isError = true;
            options.log("Received an empty response from the server!", "error");
        }

        options.onSignatureReceived(id, response || responseJson, isError);
    }

    requestor = new qq.AjaxRequestor({
        method: getNormalizedMethod(),
        contentType: "application/json; charset=utf-8",
        endpointStore: {
            getEndpoint: function() {
                return options.endpoint;
            }
        },
        paramsStore: options.paramsStore,
        maxConnections: options.maxConnections,
        customHeaders: options.customHeaders,
        log: options.log,
        onComplete: handleSignatureReceived,
        cors: options.cors,
        successfulResponseCodes: {
            POST: [200]
        }
    });


    return {
        getSignature: function(id, policy) {
            var params = policy;
            options.log("Submitting S3 signature request for " + id);
            requestor.send(id, null, params);
        }
    };
};
