/*globals qq*/
qq.PasteSupport = function(o) {
    "use strict";

    var options, detachPasteHandler;

    options = {
        targetElement: null,
        callbacks: {
            log: function(message, level) {},
            pasteReceived: function(blob) {}
        }
    };

    function registerPasteHandler() {
        qq(options.targetElement).attach("paste", function(event) {
            var blob, item,
                clipboardData = event.clipboardData;

            if (clipboardData) {
                item = clipboardData.items[0];
                if (item.type.indexOf("image/") === 0) {
                    blob = item.getAsFile();
                    options.callbacks.pasteReceived(blob);
                }
            }
        });
    }

    function unregisterPasteHandler() {
        if (detachPasteHandler) {
            detachPasteHandler();
        }
    }

    qq.extend(options, o);
    registerPasteHandler();

    return {
        reset: function() {
            unregisterPasteHandler();
        }
    };
};