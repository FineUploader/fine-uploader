/* globals qq */
/**
 * Module that handles support for existing forms.
 *
 * @param options Options passed from the integrator-supplied options related to form support.
 * @param startUpload Callback to invoke when files "stored" should be uploaded.
 * @constructor
 */
qq.FormSupport = function(options, startUpload) {
    "use strict";
    var self  = this,
        interceptSubmit = options.interceptSubmit,
        formEl = options.element,
        autoUpload = options.autoUpload;

    qq.extend(this, {
        newEndpoint: null,
        newAutoUpload: autoUpload,
        attachedToForm: false,

        getFormInputsAsObject: function() {
            /* jshint eqnull:true */
            if (formEl == null) {
                return null;
            }

            return self._form2Obj(formEl);
        }
    });

    function determineNewEndpoint(formEl) {
        if (formEl.getAttribute("action")) {
            self.newEndpoint = formEl.getAttribute("action");
        }
    }

    function uploadOnSubmit(formEl) {
        qq(formEl).attach("submit", function(event) {
            event = event || window.event;

            if (event.preventDefault) {
                event.preventDefault();
            }
            else {
                event.returnValue = false;
            }

            startUpload();
        });

        formEl.submit = function() {
            startUpload();
        };
    }

    function determineFormEl(formEl) {
        if (formEl) {
            if (qq.isString(formEl)) {
                formEl = document.getElementById(formEl);
            }

            if (formEl) {
                determineNewEndpoint(formEl);
                interceptSubmit && uploadOnSubmit(formEl);
            }
        }

        return formEl;
    }

    formEl = determineFormEl(formEl);
    this.attachedToForm = !!formEl;
};

qq.extend(qq.FormSupport.prototype, {
    _form2Obj: function(form) {
        "use strict";
        var obj = {},
            notIrrelevantType = function(type) {
                var irrelevantTypes = [
                    "button",
                    "image",
                    "reset",
                    "submit"
                ];

                return qq.indexOf(irrelevantTypes, type.toLowerCase()) < 0;
            },
            disabled = function(input) {
                return qq(input).hasAttribute("disabled") && input.type.toLowerCase() !== "hidden";
            };

        qq.each(form.elements, function(idx, el) {
            if (qq.isInput(el, true) && notIrrelevantType(el.type) && !disabled(el)) {
                var value = el.value;

                if (qq.indexOf(["checkbox", "radio"], el.type.toLowerCase()) >= 0) {
                    value = el.checked;
                }

                obj[el.name] = value;
            }
        });

        return obj;
    }
});
