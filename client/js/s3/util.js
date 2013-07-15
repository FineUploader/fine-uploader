qq.s3 = qq.s3 || {};

qq.s3.util = qq.s3.util || (function() {
    return {
        AWS_PARAM_PREFIX: "x-amz-meta-",

        /**
         * @param endpoint The bucket's fully-qualified URL.
         * @returns {String || undefined} The bucket name, or undefined if the URL cannot be parsed.
         */
        getBucket: function(endpoint) {
            var match = /^https?:\/\/([a-z0-9]+)\.s3\.amazonaws\.com/i.exec(endpoint);

            if (match) {
                return match[1];
            }
        },

        /**
         * Escape characters per [AWS guidelines](http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTForms.html#HTTPPOSTEscaping).
         *
         * @param original Non-escaped string
         * @returns {string} Escaped string
         */
        getAwsEncodedStr: function(original) {
            var encoded = "";

            qq.each(original, function(idx, char) {
                var encodedChar = char;

                if (char.charCodeAt(0) > 255) {
                    encodedChar = escape(char).replace('%', '\\');
                }
                else if (char === '$') {
                    encodedChar = "\\$";
                }
                else if (char === '\\') {
                    encodedChar = '\\\\';
                }

                encoded += encodedChar;
            });

            return encoded;
        },

        /**
         * Create a policy document to be signed and sent along with the S3 upload request.
         *
         * @param spec Object with properties: `endpoint`, `key`, `acl`, `type`, `expectedStatus`, and `params`.
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
                params = spec.params;

            // Is this going to be a problem if we encounter this moments before 2 AM just before daylight savings time ends?
            expirationDate.setMinutes(expirationDate.getMinutes() + 5);
            policy.expiration = expirationDate.toISOString();

            conditions.push({acl: acl});
            conditions.push({bucket: bucket});
            conditions.push({"Content-Type": type});
            conditions.push({success_action_status: new String(expectedStatus)});
            conditions.push({key: key});

            qq.each(params, function(name, val) {
                var awsParamName = qq.s3.util.AWS_PARAM_PREFIX + name,
                    param = {};

                param[awsParamName] = qq.s3.util.getAwsEncodedStr(val);
                conditions.push(param);
            });

            policy.conditions = conditions;

            return policy;
        },

        /**
         * Generates all parameters to be passed along with the S3 upload request.  This includes invoking a callback
         * that is expected to asynchronously retrieve a signature for the policy document.
         *
         * @param spec Object with properties: `params`, `type`, `key`, `accessKey`, `acl`, `expectedStatus`,
         * and `log()`, along with any options associated with `qq.s3.util.getPolicy()`.
         * @returns {qq.Promise} Promise that will be fulfilled once all parameters have been determined.
         */
        generateAwsParams: function(spec, signPolicyCallback) {
            var awsParams = {},
                customParams = spec.params,
                promise = new qq.Promise(),
                policyJson = qq.s3.util.getPolicy(spec),
                type = spec.type,
                key = spec.key,
                accessKey = spec.accessKey,
                acl = spec.acl,
                expectedStatus = spec.expectedStatus,
                log = spec.log;

            awsParams.key = key;
            awsParams.AWSAccessKeyId = accessKey;
            awsParams["Content-Type"] = type;
            awsParams.acl = acl;
            awsParams.success_action_status = expectedStatus;

            // Custom (user-supplied) params must be prefixed with the value of `qq.s3.util.AWS_PARAM_PREFIX`.
            qq.each(customParams, function(name, val) {
                var awsParamName = qq.s3.util.AWS_PARAM_PREFIX + name;
                awsParams[awsParamName] = qq.s3.util.getAwsEncodedStr(val);
            });

            // Invoke a promissory callback that should provide us with a base64-encoded policy doc and an
            // HMAC signature for the policy doc.
            signPolicyCallback(policyJson).then(
                function(policyAndSignature) {
                    awsParams.policy = policyAndSignature.policy;
                    awsParams.signature = policyAndSignature.signature;
                    promise.success(awsParams);
                },
                function() {
                    log("Can't continue further with request to S3 as we did not receive " +
                        "a valid signature and policy from the server.", "error");
                }
            );

            return promise;
        }
    };
}());
