/*globals qq*/
/**
 * Attempts to validate an image, wherever possible.
 *
 * @param blob File or Blob representing a user-selecting image.
 * @param log Uses this to post log messages to the console.
 * @constructor
 */
qq.ImageValidation = function(blob, log) {
    "use strict";

    /**
     * @param limits Object with possible image-related limits to enforce.
     * @returns {boolean} true if at least one of the limits has a non-zero value
     */
    function hasNonZeroLimits(limits) {
        var atLeastOne = false;

        qq.each(limits, function(limit, value) {
            if (value > 0) {
                atLeastOne = true;
                return false;
            }
        });

        return atLeastOne;
    }

    /**
     * @returns {qq.Promise} The promise is a failure if we can't obtain the width & height.
     * Otherwise, `success` is called on the returned promise with an object containing
     * `width` and `height` properties.
     */
    function getWidthHeight() {
        var sizeDetermination = new qq.Promise();

        new qq.Identify(blob, log).isPreviewable().then(function() {
            var image = new Image(),
                url = window.URL && window.URL.createObjectURL ? window.URL :
                      window.webkitURL && window.webkitURL.createObjectURL ? window.webkitURL :
                      null;

            if (url) {
                image.onerror = function() {
                    log("Cannot determine dimensions for image.  May be too large.", "error");
                    sizeDetermination.failure();
                };

                image.onload = function() {
                    sizeDetermination.success({
                        width: this.width,
                        height: this.height
                    });
                };

                image.src = url.createObjectURL(blob);
            }
            else {
                log("No createObjectURL function available to generate image URL!", "error");
                sizeDetermination.failure();
            }
        }, sizeDetermination.failure);

        return sizeDetermination;
    }

    /**
     *
     * @param limits Object with possible image-related limits to enforce.
     * @param dimensions Object containing `width` & `height` properties for the image to test.
     * @returns {String || undefined} The name of the failing limit.  Undefined if no failing limits.
     */
    function getFailingLimit(limits, dimensions) {
        var failingLimit;

        qq.each(limits, function(limitName, limitValue) {
            if (limitValue > 0) {
                var limitMatcher = /(max|min)(Width|Height)/.exec(limitName),
                    dimensionPropName = limitMatcher[2].charAt(0).toLowerCase() + limitMatcher[2].slice(1),
                    actualValue = dimensions[dimensionPropName];

                /*jshint -W015*/
                switch(limitMatcher[1]) {
                    case "min":
                        if (actualValue < limitValue) {
                            failingLimit = limitName;
                            return false;
                        }
                        break;
                    case "max":
                        if (actualValue > limitValue) {
                            failingLimit = limitName;
                            return false;
                        }
                        break;
                }
            }
        });

        return failingLimit;
    }

    /**
     * Validate the associated blob.
     *
     * @param limits
     * @returns {qq.Promise} `success` is called on the promise is the image is valid or
     * if the blob is not an image, or if the image is not verifiable.
     * Otherwise, `failure` with the name of the failing limit.
     */
    this.validate = function(limits) {
        var validationEffort = new qq.Promise();

        log("Attempting to validate image.");

        if (hasNonZeroLimits(limits)) {
            getWidthHeight().then(function(dimensions) {
                var failingLimit = getFailingLimit(limits, dimensions);

                if (failingLimit) {
                    validationEffort.failure(failingLimit);
                }
                else {
                    validationEffort.success();
                }
            }, validationEffort.success);
        }
        else {
            validationEffort.success();
        }

        return validationEffort;
    };
};
