/*globals qq */
qq.s3 = qq.s3 || {};

qq.s3.util = qq.s3.util || (function() {
    "use strict";

    return {
        AWS_PARAM_PREFIX: "x-amz-meta-",

        SESSION_TOKEN_PARAM_NAME: "x-amz-security-token",

        REDUCED_REDUNDANCY_PARAM_NAME: "x-amz-storage-class",
        REDUCED_REDUNDANCY_PARAM_VALUE: "REDUCED_REDUNDANCY",

        SERVER_SIDE_ENCRYPTION_PARAM_NAME: "x-amz-server-side-encryption",
        SERVER_SIDE_ENCRYPTION_PARAM_VALUE: "AES256",

        /**
         * This allows for the region to be specified in the bucket's endpoint URL, or not.
         *
         * Examples of some valid endpoints are:
         *     http://foo.s3.amazonaws.com
         *     https://foo.s3.amazonaws.com
         *     http://foo.s3-ap-northeast-1.amazonaws.com
         *     foo.s3.amazonaws.com
         *     http://foo.bar.com
         *     http://s3.amazonaws.com/foo.bar.com
         * ...etc
         *
         * @param endpoint The bucket's URL.
         * @returns {String || undefined} The bucket name, or undefined if the URL cannot be parsed.
         */
        getBucket: function(endpoint) {
            var patterns = [
                    //bucket in domain
                    /^(?:https?:\/\/)?([a-z0-9.\-_]+)\.s3(?:-[a-z0-9\-]+)?\.amazonaws\.com/i,
                    //bucket in path
                    /^(?:https?:\/\/)?s3(?:-[a-z0-9\-]+)?\.amazonaws\.com\/([a-z0-9.\-_]+)/i,
                    //custom domain
                    /^(?:https?:\/\/)?([a-z0-9.\-_]+)/i
                ],
                bucket;

            qq.each(patterns, function(idx, pattern) {
                var match = pattern.exec(endpoint);

                if (match) {
                    bucket = match[1];
                    return false;
                }
            });

            return bucket;
        },

        /**
         * Create a policy document to be signed and sent along with the S3 upload request.
         *
         * @param spec Object with properties use to construct the policy document.
         * @returns {Object} Policy doc.
         */
        getPolicy: function(spec) {
            var policy = {},
                conditions = [],
                bucket = qq.s3.util.getBucket(spec.endpoint),
                key = spec.key,
                acl = spec.acl,
                type = spec.type,
                expirationDate = new Date(),
                expectedStatus = spec.expectedStatus,
                sessionToken = spec.sessionToken,
                params = spec.params,
                successRedirectUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl(spec.successRedirectUrl),
                minFileSize = spec.minFileSize,
                maxFileSize = spec.maxFileSize,
                reducedRedundancy = spec.reducedRedundancy,
                serverSideEncryption = spec.serverSideEncryption;

            policy.expiration = qq.s3.util.getPolicyExpirationDate(expirationDate);

            conditions.push({acl: acl});
            conditions.push({bucket: bucket});

            if (type) {
                conditions.push({"Content-Type": type});
            }

            if (expectedStatus) {
                conditions.push({success_action_status: expectedStatus.toString()});
            }

            if (successRedirectUrl) {
                conditions.push({success_action_redirect: successRedirectUrl});
            }

            if (reducedRedundancy) {
                conditions.push({});
                conditions[conditions.length - 1][qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
            }

            if (sessionToken) {
                conditions.push({});
                conditions[conditions.length - 1][qq.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
            }

            if (serverSideEncryption) {
                conditions.push({});
                conditions[conditions.length - 1][qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
            }

            conditions.push({key: key});

            // user metadata
            qq.each(params, function(name, val) {
                var awsParamName = qq.s3.util.AWS_PARAM_PREFIX + name,
                    param = {};

                param[awsParamName] = encodeURIComponent(val);
                conditions.push(param);
            });

            policy.conditions = conditions;

            qq.s3.util.enforceSizeLimits(policy, minFileSize, maxFileSize);

            return policy;
        },

        /**
         * Update a previously constructed policy document with updated credentials.  Currently, this only requires we
         * update the session token.  This is only relevant if requests are being signed client-side.
         *
         * @param policy Live policy document
         * @param newSessionToken Updated session token.
         */
        refreshPolicyCredentials: function(policy, newSessionToken) {
            var sessionTokenFound = false;

            qq.each(policy.conditions, function(oldCondIdx, oldCondObj) {
                qq.each(oldCondObj, function(oldCondName, oldCondVal) {
                    if (oldCondName === qq.s3.util.SESSION_TOKEN_PARAM_NAME) {
                        oldCondObj[oldCondName] = newSessionToken;
                        sessionTokenFound = true;
                    }
                });
            });

            if (!sessionTokenFound) {
                policy.conditions.push({});
                policy.conditions[policy.conditions.length - 1][qq.s3.util.SESSION_TOKEN_PARAM_NAME] = newSessionToken;
            }
        },

        /**
         * Generates all parameters to be passed along with the S3 upload request.  This includes invoking a callback
         * that is expected to asynchronously retrieve a signature for the policy document.  Note that the server
         * signing the request should reject a "tainted" policy document that includes unexpected values, since it is
         * still possible for a malicious user to tamper with these values during policy document generation, b
         * before it is sent to the server for signing.
         *
         * @param spec Object with properties: `params`, `type`, `key`, `accessKey`, `acl`, `expectedStatus`, `successRedirectUrl`,
         * `reducedRedundancy`, serverSideEncryption, and `log()`, along with any options associated with `qq.s3.util.getPolicy()`.
         * @returns {qq.Promise} Promise that will be fulfilled once all parameters have been determined.
         */
        generateAwsParams: function(spec, signPolicyCallback) {
            var awsParams = {},
                customParams = spec.params,
                promise = new qq.Promise(),
                policyJson = qq.s3.util.getPolicy(spec),
                sessionToken = spec.sessionToken,
                type = spec.type,
                key = spec.key,
                accessKey = spec.accessKey,
                acl = spec.acl,
                expectedStatus = spec.expectedStatus,
                successRedirectUrl = qq.s3.util.getSuccessRedirectAbsoluteUrl(spec.successRedirectUrl),
                reducedRedundancy = spec.reducedRedundancy,
                serverSideEncryption = spec.serverSideEncryption,
                log = spec.log;

            awsParams.key = key;
            awsParams.AWSAccessKeyId = accessKey;

            if (type) {
                awsParams["Content-Type"] = type;
            }

            if (expectedStatus) {
                awsParams.success_action_status = expectedStatus;
            }

            if (successRedirectUrl) {
                awsParams.success_action_redirect = successRedirectUrl;
            }

            if (reducedRedundancy) {
                awsParams[qq.s3.util.REDUCED_REDUNDANCY_PARAM_NAME] = qq.s3.util.REDUCED_REDUNDANCY_PARAM_VALUE;
            }

            if (serverSideEncryption) {
                awsParams[qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_NAME] = qq.s3.util.SERVER_SIDE_ENCRYPTION_PARAM_VALUE;
            }

            if (sessionToken) {
                awsParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = sessionToken;
            }

            awsParams.acl = acl;

            // Custom (user-supplied) params must be prefixed with the value of `qq.s3.util.AWS_PARAM_PREFIX`.
            // Custom param values will be URI encoded as well.
            qq.each(customParams, function(name, val) {
                var awsParamName = qq.s3.util.AWS_PARAM_PREFIX + name;
                awsParams[awsParamName] = encodeURIComponent(val);
            });

            // Invoke a promissory callback that should provide us with a base64-encoded policy doc and an
            // HMAC signature for the policy doc.
            signPolicyCallback(policyJson).then(
                function(policyAndSignature, updatedAccessKey, updatedSessionToken) {
                    awsParams.policy = policyAndSignature.policy;
                    awsParams.signature = policyAndSignature.signature;

                    if (updatedAccessKey) {
                        awsParams.AWSAccessKeyId = updatedAccessKey;
                    }
                    if (updatedSessionToken) {
                        awsParams[qq.s3.util.SESSION_TOKEN_PARAM_NAME] = updatedSessionToken;
                    }

                    promise.success(awsParams);
                },
                function(errorMessage) {
                    errorMessage = errorMessage || "Can't continue further with request to S3 as we did not receive " +
                                                   "a valid signature and policy from the server.";

                    log("Policy signing failed.  " + errorMessage, "error");
                    promise.failure(errorMessage);
                }
            );

            return promise;
        },

        /**
         * Add a condition to an existing S3 upload request policy document used to ensure AWS enforces any size
         * restrictions placed on files server-side.  This is important to do, in case users mess with the client-side
         * checks already in place.
         *
         * @param policy Policy document as an `Object`, with a `conditions` property already attached
         * @param minSize Minimum acceptable size, in bytes
         * @param maxSize Maximum acceptable size, in bytes (0 = unlimited)
         */
        enforceSizeLimits: function(policy, minSize, maxSize) {
            var adjustedMinSize = minSize < 0 ? 0 : minSize,
                // Adjust a maxSize of 0 to the largest possible integer, since we must specify a high and a low in the request
                adjustedMaxSize = maxSize <= 0 ? 9007199254740992 : maxSize;

            if (minSize > 0 || maxSize > 0) {
                policy.conditions.push(["content-length-range", adjustedMinSize.toString(), adjustedMaxSize.toString()]);
            }
        },

        getPolicyExpirationDate: function(date) {
            /*jshint -W014 */
            // Is this going to be a problem if we encounter this moments before 2 AM just before daylight savings time ends?
            date.setMinutes(date.getMinutes() + 5);

            if (Date.prototype.toISOString) {
                return date.toISOString();
            }
            else {
                var pad = function(number) {
                    var r = String(number);

                    if ( r.length === 1 ) {
                        r = "0" + r;
                    }

                    return r;
                };

                return date.getUTCFullYear()
                        + "-" + pad( date.getUTCMonth() + 1 )
                        + "-" + pad( date.getUTCDate() )
                        + "T" + pad( date.getUTCHours() )
                        + ":" + pad( date.getUTCMinutes() )
                        + ":" + pad( date.getUTCSeconds() )
                        + "." + String( (date.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
                        + "Z";
            }
        },

        /**
         * Looks at a response from S3 contained in an iframe and parses the query string in an attempt to identify
         * the associated resource.
         *
         * @param iframe Iframe containing response
         * @returns {{bucket: *, key: *, etag: *}}
         */
        parseIframeResponse: function(iframe) {
            var doc = iframe.contentDocument || iframe.contentWindow.document,
                queryString = doc.location.search,
                match = /bucket=(.+)&key=(.+)&etag=(.+)/.exec(queryString);

            if (match) {
                return {
                    bucket: match[1],
                    key: match[2],
                    etag: match[3].replace(/%22/g, "")
                };
            }
        },

        /**
         * @param successRedirectUrl Relative or absolute location of success redirect page
         * @returns {*|string} undefined if the parameter is undefined, otherwise the absolute location of the success redirect page
         */
        getSuccessRedirectAbsoluteUrl: function(successRedirectUrl) {
            if (successRedirectUrl) {
                var targetAnchorContainer = document.createElement("div"),
                    targetAnchor;

                if (qq.ie7()) {
                    // Note that we must make use of `innerHTML` for IE7 only instead of simply creating an anchor via
                    // `document.createElement('a')` and setting the `href` attribute.  The latter approach does not allow us to
                    // obtain an absolute URL in IE7 if the `endpoint` is a relative URL.
                    targetAnchorContainer.innerHTML = "<a href='" + successRedirectUrl + "'></a>";
                    targetAnchor = targetAnchorContainer.firstChild;
                    return targetAnchor.href;
                }
                else {
                    // IE8 and IE9 do not seem to derive an absolute URL from a relative URL using the `innerHTML`
                    // approach above, so we'll just create an anchor this way and set it's `href` attribute.
                    // Due to yet another quirk in IE8 and IE9, we have to set the `href` equal to itself
                    // in order to ensure relative URLs will be properly parsed.
                    targetAnchor = document.createElement("a");
                    targetAnchor.href = successRedirectUrl;
                    targetAnchor.href = targetAnchor.href;
                    return targetAnchor.href;
                }
            }
        },

        // AWS employs a strict interpretation of [RFC 3986](http://tools.ietf.org/html/rfc3986#page-12).
        // So, we must ensure all reserved characters listed in the spec are percent-encoded,
        // and spaces are replaced with "+".
        encodeQueryStringParam: function(param) {
            var percentEncoded = encodeURIComponent(param);

            // %-encode characters not handled by `encodeURIComponent` (to follow RFC 3986)
            percentEncoded = percentEncoded.replace(/[!'()]/g, escape);

            // %-encode characters not handled by `escape` (to follow RFC 3986)
            percentEncoded = percentEncoded.replace(/\*/g, "%2A");

            // replace percent-encoded spaces with a "+"
            return percentEncoded.replace(/%20/g, "+");
        }
    };
}());
