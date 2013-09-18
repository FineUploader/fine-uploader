/*globals jQuery, qq*/
(function($) {
    "use strict";
    var $el,
        pluginOptions = ['uploaderType', 'endpointType'];

    function init(options) {
        if (options) {
            var xformedOpts = transformVariables(options),
                newUploaderInstance = getNewUploaderInstance(xformedOpts);

            uploader(newUploaderInstance);
            addCallbacks(xformedOpts, newUploaderInstance);
        }

        return $el;
    }

    function getNewUploaderInstance(params) {
        var uploaderType = pluginOption('uploaderType'),
            namespace = pluginOption('endpointType');

        // If the integrator has defined a specific type of uploader to load, use that, otherwise assume `qq.FineUploader`
        if (uploaderType) {
            // We can determine the correct constructor function to invoke by combining "FineUploader"
            // with the upper camel cased `uploaderType` value.
            uploaderType = uploaderType.charAt(0).toUpperCase() + uploaderType.slice(1).toLowerCase();

            if (namespace) {
                return new qq[namespace]["FineUploader" + uploaderType](params);
            }

            return new qq["FineUploader" + uploaderType](params);
        }
        else {
            if (namespace) {
                return new qq[namespace]["FineUploader"](params);
            }

            return new qq.FineUploader(params);
        }
    }

    function dataStore(key, val) {
        var data = $el.data('fineuploader');

        if (val) {
            if (data === undefined) {
                data = {};
            }
            data[key] = val;
            $el.data('fineuploader', data);
        }
        else {
            if (data === undefined) {
                return null;
            }
            return data[key];
        }
    }

    //the underlying Fine Uploader instance is stored in jQuery's data stored, associated with the element
    // tied to this instance of the plug-in
    function uploader(instanceToStore) {
        return dataStore('uploader', instanceToStore);
    }

    function pluginOption(option, optionVal) {
        return dataStore(option, optionVal);
    }

    // Implement all callbacks defined in Fine Uploader as functions that trigger appropriately names events and
    // return the result of executing the bound handler back to Fine Uploader
    function addCallbacks(transformedOpts, newUploaderInstance) {
        var callbacks = transformedOpts.callbacks = {};

        $.each(newUploaderInstance._options.callbacks, function(prop, defaultCallback) {
            var name, $callbackEl;

            name = /^on(\w+)/.exec(prop)[1];
            name = name.substring(0, 1).toLowerCase() + name.substring(1);
            $callbackEl = $el;

            callbacks[prop] = function() {
                var originalArgs = Array.prototype.slice.call(arguments),
                    transformedArgs = [],
                    defaultCallbackRetVal, contributedCallbackRetVal;

                $.each(originalArgs, function(idx, arg) {
                    transformedArgs.push(maybeWrapInJquery(arg));
                });

                defaultCallbackRetVal = defaultCallback.apply(this, originalArgs);
                contributedCallbackRetVal = $callbackEl.triggerHandler(name, transformedArgs);

                return defaultCallbackRetVal || contributedCallbackRetVal;
            };
        });

        newUploaderInstance._options.callbacks = callbacks;
    }

    //transform jQuery objects into HTMLElements, and pass along all other option properties
    function transformVariables(source, dest) {
        var xformed, arrayVals;

        if (dest === undefined) {
            if (source.uploaderType !== 'basic') {
                xformed = { element : $el[0] };
            }
            else {
                xformed = {};
            }
        }
        else {
            xformed = dest;
        }

        $.each(source, function(prop, val) {
            if ($.inArray(prop, pluginOptions) >= 0) {
                pluginOption(prop, val);
            }
            else if (val instanceof $) {
                xformed[prop] = val[0];
            }
            else if ($.isPlainObject(val)) {
                xformed[prop] = {};
                transformVariables(val, xformed[prop]);
            }
            else if ($.isArray(val)) {
                arrayVals = [];
                $.each(val, function(idx, arrayVal) {
                    var arrayObjDest = {};

                    if (arrayVal instanceof $) {
                        $.merge(arrayVals, arrayVal);
                    }
                    else if ($.isPlainObject(arrayVal)) {
                        transformVariables(arrayVal, arrayObjDest);
                        arrayVals.push(arrayObjDest);
                    }
                    else {
                        arrayVals.push(arrayVal);
                    }
                });
                xformed[prop] = arrayVals;
            }
            else {
                xformed[prop] = val;
            }
        });

        if (dest === undefined) {
            return xformed;
        }
    }

    function isValidCommand(command) {
        return $.type(command) === "string" &&
            !command.match(/^_/) && //enforce private methods convention
            uploader()[command] !== undefined;
    }

    // Assuming we have already verified that this is a valid command, call the associated function in the underlying
    // Fine Uploader instance (passing along the arguments from the caller) and return the result of the call back to the caller
    function delegateCommand(command) {
        var xformedArgs = [],
            origArgs = Array.prototype.slice.call(arguments, 1),
            retVal;

        transformVariables(origArgs, xformedArgs);

        retVal = uploader()[command].apply(uploader(), xformedArgs);

        return maybeWrapInJquery(retVal);
    }

    // If the value is an `HTMLElement` or `HTMLDocument`, wrap it in a `jQuery` object
    function maybeWrapInJquery(val) {
        var transformedVal = val;

        // If the command is returning an `HTMLElement` or `HTMLDocument`, wrap it in a `jQuery` object
        if(val != null && typeof val === "object"
            && (val.nodeType === 1 || val.nodeType === 9)
            && val.cloneNode) {

            transformedVal = $(val);
        }

        return transformedVal;
    }

    $.fn.fineUploader = function(optionsOrCommand) {
        var self = this, selfArgs = arguments, retVals = [];

        this.each(function(index, el) {
            $el = $(el);

            if (uploader() && isValidCommand(optionsOrCommand)) {
                retVals.push(delegateCommand.apply(self, selfArgs));

                if (self.length === 1) {
                    return false;
                }
            }
            else if (typeof optionsOrCommand === 'object' || !optionsOrCommand) {
                init.apply(self, selfArgs);
            }
            else {
                $.error('Method ' +  optionsOrCommand + ' does not exist on jQuery.fineUploader');
            }
        });

        if (retVals.length === 1) {
            return retVals[0];
        }
        else if (retVals.length > 1) {
            return retVals;
        }

        return this;
    };

}(jQuery));
