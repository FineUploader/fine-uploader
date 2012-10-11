/*global jQuery, qq*/
(function($) {
    "use strict";
    var methods, uploader, $el;


    function addCallbacks(transformedOpts) {
        var callbacks = transformedOpts.callbacks = {};

        $.each(new qq.FineUploaderBasic()._options.callbacks, function(prop, func) {
            var name = /^on(\w+)/.exec(prop)[1].toLowerCase();
            callbacks[prop] = function() {
                var args = Array.prototype.slice.call(arguments);
                return $el.triggerHandler(name, args);
            };
        });
    }

    function transformOptions(source, dest) {
        var xformed = dest === undefined ? { element : $el[0] } : dest;

        $.each(source, function(prop, val) {
            if (val instanceof $) {
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
    }

    methods = {
        init : function(options) {
            var xformedOpts = transformOptions(options);
            addCallbacks(xformedOpts);
            uploader = new qq.FineUploader(xformedOpts);
            return $el;
        }
    };

    $.fn.fineUploader = function(optionsOrMethod) {
        $el = this;

        if (methods[optionsOrMethod]) {
            return methods[ optionsOrMethod ].apply( this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof optionsOrMethod === 'object' || ! optionsOrMethod) {
            return methods.init.apply(this, arguments);
        }
        else {
            $.error('Method ' +  optionsOrMethod + ' does not exist on jQuery.tooltip');
        }

        return this;
    };

}(jQuery));
