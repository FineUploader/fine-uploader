(function($) {
    "use strict";
    var uploader, $el, init, dataStore, pluginOption, pluginOptions, addCallbacks, transformOptions, isValidCommand,
        delegateCommand;

    pluginOptions = ['uploaderType'];

    init = function (options) {
        var xformedOpts = transformOptions(options);
        addCallbacks(xformedOpts);

        if (pluginOption('uploaderType') === 'basic') {
            uploader(new qq.FineUploaderBasic(xformedOpts));
        }
        else {
            uploader(new qq.FineUploader(xformedOpts));
        }

        return $el;
    };

    dataStore = function(key, val) {
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
    };

    //the underlying Fine Uploader instance is stored in jQuery's data stored, associated with the element
    // tied to this instance of the plug-in
    uploader = function(instanceToStore) {
        return dataStore('uploader', instanceToStore);
    };

    pluginOption = function(option, optionVal) {
        return dataStore(option, optionVal);
    };

    //implement all callbacks defined in Fine Uploader as functions that trigger appropriately names events and
    // return the result of executing the bound handler back to Fine Uploader
    addCallbacks = function(transformedOpts) {
        var callbacks = transformedOpts.callbacks = {};

        $.each(new qq.FineUploaderBasic()._options.callbacks, function(prop, func) {
            var name = /^on(\w+)/.exec(prop)[1].toLowerCase();
            callbacks[prop] = function() {
                var args = Array.prototype.slice.call(arguments);
                return $el.triggerHandler(name, args);
            };
        });
    };

    //transform jQuery objects into HTMLElements, and pass along all other option properties
    transformOptions = function(source, dest) {
        var xformed = dest === undefined ? { element : $el[0] } : dest;

        $.each(source, function(prop, val) {
            if ($.inArray(prop, pluginOptions) >= 0) {
                pluginOption(prop, val);
            }
            else if (val instanceof $) {
                xformed[prop] = val[0];
            }
            else if ($.isPlainObject(val)) {
                xformed[prop] = {};
                transformOptions(val, xformed[prop]);
            }
            else {
                xformed[prop] = val;
            }
        });

        if (dest === undefined) {
            return xformed;
        }
    };

    isValidCommand = function(command) {
        return $.type(command) === "string" &&
            !command.match(/^_/) && //enforce private methods convention
            uploader()[command] !== undefined;
    };

    //assuming we have already verified that this is a valid command, call the associated function in the underlying
    // Fine Uploader instance (passing along the arguments from the caller) and return the result of the call back to the caller
    delegateCommand = function(command) {
        return uploader()[command].apply(uploader(), Array.prototype.slice.call(arguments, 1));
    };

    $.fn.fineUploader = function(optionsOrCommand) {
        $el = this;

        if (uploader() && isValidCommand(optionsOrCommand)) {
            return delegateCommand.apply(this, arguments);
        }
        else if (typeof optionsOrCommand === 'object' || !optionsOrCommand) {
            return init.apply(this, arguments);
        }
        else {
            $.error('Method ' +  optionsOrCommand + ' does not exist on jQuery.fineUploader');
        }

        return this;
    };

}(jQuery));
