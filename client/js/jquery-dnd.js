/*globals jQuery, qq*/
(function($) {
    "use strict";
    var rootDataKey = "fineUploaderDnd",
        $el;

    function init (options) {
        if (!options) {
            options = {};
        }

        options.dropZoneElements = [$el];
        var xformedOpts = transformVariables(options);
        addCallbacks(xformedOpts);
        dnd(new qq.DragAndDrop(xformedOpts));

        return $el;
    };

    function dataStore(key, val) {
        var data = $el.data(rootDataKey);

        if (val) {
            if (data === undefined) {
                data = {};
            }
            data[key] = val;
            $el.data(rootDataKey, data);
        }
        else {
            if (data === undefined) {
                return null;
            }
            return data[key];
        }
    };

    function dnd(instanceToStore) {
        return dataStore('dndInstance', instanceToStore);
    };

    function addCallbacks(transformedOpts) {
        var callbacks = transformedOpts.callbacks = {},
            dndInst = new qq.FineUploaderBasic();

        $.each(new qq.DragAndDrop.callbacks(), function(prop, func) {
            var name = prop,
                $callbackEl;

            $callbackEl = $el;

            callbacks[prop] = function() {
                var args = Array.prototype.slice.call(arguments),
                    jqueryHandlerResult = $callbackEl.triggerHandler(name, args);

                return jqueryHandlerResult;
            };
        });
    };

    //transform jQuery objects into HTMLElements, and pass along all other option properties
    function transformVariables(source, dest) {
        var xformed, arrayVals;

        if (dest === undefined) {
            xformed = {};
        }
        else {
            xformed = dest;
        }

        $.each(source, function(prop, val) {
            if (val instanceof $) {
                xformed[prop] = val[0];
            }
            else if ($.isPlainObject(val)) {
                xformed[prop] = {};
                transformVariables(val, xformed[prop]);
            }
            else if ($.isArray(val)) {
                arrayVals = [];
                $.each(val, function(idx, arrayVal) {
                    if (arrayVal instanceof $) {
                        $.merge(arrayVals, arrayVal);
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
    };

    function isValidCommand(command) {
        return $.type(command) === "string" &&
            command === "dispose" &&
            dnd()[command] !== undefined;
    };

    function delegateCommand(command) {
        var xformedArgs = [], origArgs = Array.prototype.slice.call(arguments, 1);
        transformVariables(origArgs, xformedArgs);
        return dnd()[command].apply(dnd(), xformedArgs);
    };

    $.fn.fineUploaderDnd = function(optionsOrCommand) {
        var self = this, selfArgs = arguments, retVals = [];

        this.each(function(index, el) {
            $el = $(el);

            if (dnd() && isValidCommand(optionsOrCommand)) {
                retVals.push(delegateCommand.apply(self, selfArgs));

                if (self.length === 1) {
                    return false;
                }
            }
            else if (typeof optionsOrCommand === 'object' || !optionsOrCommand) {
                init.apply(self, selfArgs);
            }
            else {
                $.error("Method " +  optionsOrCommand + " does not exist in Fine Uploader's DnD module.");
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
