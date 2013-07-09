/*globals qq*/

/**
 * This module represents an upload or "Select File(s)" button.  It's job is to embed an opaque `<input type="file">`
 * element as a child of a provided "container" element.  This "container" element (`options.element`) is used to provide
 * a custom style for the `<input type="file">` element.  The ability to change the style of the container element is also
 * provided here by adding CSS classes to the container on hover/focus.
 *
 * TODO Eliminate the mouseover and mouseout event handlers since the :hover CSS pseudo-class should now be
 * available on all supported browsers.
 *
 * @param o Options to override the default values
 */
qq.UploadButton = function(o) {
    "use strict";

    var input,
       // Used to detach all event handlers created at once for this instance
        disposeSupport = new qq.DisposeSupport(),

        options = {
            // "Container" element
            element: null,

            // If true adds `multiple` attribute to `<input type="file">`
            multiple: false,

            // Corresponds to the `accept` attribute on the associated `<input type="file">`

            acceptFiles: null,

            // `name` attribute of `<input type="file">`
            name: 'qqfile',

            // Called when the browser invokes the onchange handler on the `<input type="file">`
            onChange: function(input) {},

            // **This option will be removed** in the future as the :hover CSS pseudo-class is available on all supported browsers
            hoverClass: 'qq-upload-button-hover',

            focusClass: 'qq-upload-button-focus'
        };

    // Overrides any of the default option values with any option values passed in during construction.
    qq.extend(options, o);


    // Embed an opaque `<input type="file">` element as a child of `options.element`.
    function createInput() {
        var input = document.createElement("input");

        if (options.multiple){
            input.setAttribute("multiple", "multiple");
        }

        if (options.acceptFiles) {
            input.setAttribute("accept", options.acceptFiles);
        }

        input.setAttribute("type", "file");
        input.setAttribute("name", options.name);

        qq(input).css({
            position: 'absolute',
            // in Opera only 'browse' button
            // is clickable and it is located at
            // the right side of the input
            right: 0,
            top: 0,
            fontFamily: 'Arial',
            // 4 persons reported this, the max values that worked for them were 243, 236, 236, 118
            fontSize: '118px',
            margin: 0,
            padding: 0,
            cursor: 'pointer',
            opacity: 0
        });

        options.element.appendChild(input);

        disposeSupport.attach(input, 'change', function(){
            options.onChange(input);
        });

        // **These event handlers will be removed** in the future as the :hover CSS pseudo-class is available on all supported browsers
        disposeSupport.attach(input, 'mouseover', function(){
            qq(options.element).addClass(options.hoverClass);
        });
        disposeSupport.attach(input, 'mouseout', function(){
            qq(options.element).removeClass(options.hoverClass);
        });

        disposeSupport.attach(input, 'focus', function(){
            qq(options.element).addClass(options.focusClass);
        });
        disposeSupport.attach(input, 'blur', function(){
            qq(options.element).removeClass(options.focusClass);
        });

        // IE and Opera, unfortunately have 2 tab stops on file input
        // which is unacceptable in our case, disable keyboard access
        if (window.attachEvent) {
            // it is IE or Opera
            input.setAttribute('tabIndex', "-1");
        }

        return input;
    }

    // Make button suitable container for input
    qq(options.element).css({
        position: 'relative',
        overflow: 'hidden',
        // Make sure browse button is in the right side in Internet Explorer
        direction: 'ltr'
    });

    input = createInput();


    // Exposed API
    return {
        getInput: function(){
            return input;
        },

        reset: function(){
            if (input.parentNode){
                qq(input).remove();
            }

            qq(options.element).removeClass(options.focusClass);
            input = createInput();
        }
    };
};
