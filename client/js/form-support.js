/* globals qq */
/**
 * Module that handles support for existing forms.
 *
 * @param options Options passed from the integrator-supplied options related to form support.
 * @param startUpload Callback to invoke when files "stored" should be uploaded.
 * @param log Proxy for the logger
 * @constructor
 */
qq.FormSupport = function(options, startUpload, log) {
    "use strict";
    var self  = this,
        interceptSubmit = options.interceptSubmit,
        formEl = options.element,
        autoUpload = options.autoUpload;

    // Available on the public API associated with this module.
    qq.extend(this, {
        // To be used by the caller to determine if the endpoint will be determined by some processing
        // that occurs in this module, such as if the form has an action attribute.
        // Ignore if `attachToForm === false`.
        newEndpoint: null,

        // To be used by the caller to determine if auto uploading should be allowed.
        // Ignore if `attachToForm === false`.
        newAutoUpload: autoUpload,

        // true if a form was detected and is being tracked by this module
        attachedToForm: false,

        // Returns an object with names and values for all valid form elements associated with the attached form.
        getFormInputsAsObject: function() {
            /* jshint eqnull:true */
            if (formEl == null) {
                return null;
            }

            return self._form2Obj(formEl);
        }
    });

    // If the form contains an action attribute, this should be the new upload endpoint.
    function determineNewEndpoint(formEl) {
        if (formEl.getAttribute("action")) {
            self.newEndpoint = formEl.getAttribute("action");
        }
    }

    // Return true only if the form is valid, or if we cannot make this determination.
    // If the form is invalid, ensure invalid field(s) are highlighted in the UI.
    function validateForm(formEl, nativeSubmit) {
        if (formEl.checkValidity && !formEl.checkValidity()) {
            log("Form did not pass validation checks - will not upload.", "error");
            nativeSubmit();
        }
        else {
            return true;
        }
    }

    // Intercept form submit attempts, unless the integrator has told us not to do this.
    function maybeUploadOnSubmit(formEl) {
        var nativeSubmit = formEl.submit;

        // Intercept and squelch submit events.
        qq(formEl).attach("submit", function(event) {
            event = event || window.event;

            if (event.preventDefault) {
                event.preventDefault();
            }
            else {
                event.returnValue = false;
            }

            validateForm(formEl, nativeSubmit) && startUpload();
        });

        // The form's `submit()` function may be called instead (i.e. via jQuery.submit()).
        // Intercept that too.
        formEl.submit = function() {
            validateForm(formEl, nativeSubmit) && startUpload();
        };
    }

    // If the element value passed from the uploader is a string, assume it is an element ID - select it.
    // The rest of the code in this module depends on this being an HTMLElement.
    function determineFormEl(formEl) {
        if (formEl) {
            if (qq.isString(formEl)) {
                formEl = document.getElementById(formEl);
            }

            if (formEl) {
                log("Attaching to form element.");
                determineNewEndpoint(formEl);
                interceptSubmit && maybeUploadOnSubmit(formEl);
            }
        }

        return formEl;
    }

    formEl = determineFormEl(formEl);
    this.attachedToForm = !!formEl;
};

qq.extend(qq.FormSupport.prototype, {
    // Converts all relevant form fields to key/value pairs.  This is meant to mimic the data a browser will
    // construct from a given form when the form is submitted.
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
            radioOrCheckbox = function(type) {
                return qq.indexOf(["checkbox", "radio"], type.toLowerCase()) >= 0;
            },
            ignoreValue = function(el) {
                if (radioOrCheckbox(el.type) && !el.checked) {
                    return true;
                }

                return el.disabled && el.type.toLowerCase() !== "hidden";
            },
            selectValue = function(select) {
                var value = null;

                qq.each(qq(select).children(), function(idx, child) {
                    if (child.tagName.toLowerCase() === "option" && child.selected) {
                        value = child.value;
                        return false;
                    }
                });

                return value;
            };

        qq.each(form.elements, function(idx, el) {
            if (qq.isInput(el, true) && notIrrelevantType(el.type) && !ignoreValue(el)) {
                obj[el.name] = el.value;
            }
            else if (el.tagName.toLowerCase() === "select" && !ignoreValue(el)) {
                var value = selectValue(el);

                if (value !== null) {
                    obj[el.name] = value;
                }
            }
        });

        return obj;
    }
});
