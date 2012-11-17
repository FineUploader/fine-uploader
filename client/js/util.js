var qq = function(element) {
    "use strict";

    return {
        hide: function() {
            element.style.display = 'none';
            return this;
        },

        /** Returns the function which detaches attached event */
        attach: function(type, fn) {
            if (element.addEventListener){
                element.addEventListener(type, fn, false);
            } else if (element.attachEvent){
                element.attachEvent('on' + type, fn);
            }
            return function() {
                qq(element).detach(type, fn);
            };
        },

        detach: function(type, fn) {
            if (element.removeEventListener){
                element.removeEventListener(type, fn, false);
            } else if (element.attachEvent){
                element.detachEvent('on' + type, fn);
            }
            return this;
        },

        contains: function(descendant) {
            // compareposition returns false in this case
            if (element == descendant) {
                return true;
            }

            if (element.contains){
                return element.contains(descendant);
            } else {
                return !!(descendant.compareDocumentPosition(element) & 8);
            }
        },

        /**
         * Insert this element before elementB.
         */
        insertBefore: function(elementB) {
            elementB.parentNode.insertBefore(element, elementB);
            return this;
        },

        remove: function() {
            element.parentNode.removeChild(element);
            return this;
        },

        /**
         * Sets styles for an element.
         * Fixes opacity in IE6-8.
         */
        css: function(styles) {
            if (styles.opacity != null){
                if (typeof element.style.opacity != 'string' && typeof(element.filters) != 'undefined'){
                    styles.filter = 'alpha(opacity=' + Math.round(100 * styles.opacity) + ')';
                }
            }
            qq.extend(element.style, styles);

            return this;
        },

        hasClass: function(name) {
            var re = new RegExp('(^| )' + name + '( |$)');
            return re.test(element.className);
        },

        addClass: function(name) {
            if (!qq(element).hasClass(name)){
                element.className += ' ' + name;
            }
            return this;
        },

        removeClass: function(name) {
            var re = new RegExp('(^| )' + name + '( |$)');
            element.className = element.className.replace(re, ' ').replace(/^\s+|\s+$/g, "");
            return this;
        },

        getByClass: function(className) {
            if (element.querySelectorAll){
                return element.querySelectorAll('.' + className);
            }

            var result = [];
            var candidates = element.getElementsByTagName("*");
            var len = candidates.length;

            for (var i = 0; i < len; i++){
                if (qq(candidates[i]).hasClass(className)){
                    result.push(candidates[i]);
                }
            }
            return result;
        },

        children: function() {
            var children = [],
                child = element.firstChild;

            while (child){
                if (child.nodeType == 1){
                    children.push(child);
                }
                child = child.nextSibling;
            }

            return children;
        },

        setText: function(text) {
            element.innerText = text;
            element.textContent = text;
            return this;
        },

        clearText: function() {
            return qq(element).setText("");
        }
    };
};

qq.log = function(message, level) {
    if (window.console) {
        if (!level || level === 'info') {
            window.console.log(message);
        }
        else
        {
            if (window.console[level]) {
                window.console[level](message);
            }
            else {
                window.console.log('<' + level + '> ' + message);
            }
        }
    }
};

qq.isObject = function(variable) {
    "use strict";
    return variable !== null && variable && typeof(variable) === "object" && variable.constructor === Object;
};

qq.extend = function (first, second, extendNested) {
    "use strict";
    var prop;
    for (prop in second) {
        if (second.hasOwnProperty(prop)) {
            if (extendNested && qq.isObject(second[prop])) {
                if (first[prop] === undefined) {
                    first[prop] = {};
                }
                qq.extend(first[prop], second[prop], true);
            }
            else {
                first[prop] = second[prop];
            }
        }
    }
};

/**
 * Searches for a given element in the array, returns -1 if it is not present.
 * @param {Number} [from] The index at which to begin the search
 */
qq.indexOf = function(arr, elt, from){
    if (arr.indexOf) return arr.indexOf(elt, from);

    from = from || 0;
    var len = arr.length;

    if (from < 0) from += len;

    for (; from < len; from++){
        if (from in arr && arr[from] === elt){
            return from;
        }
    }
    return -1;
};

qq.getUniqueId = (function(){
    var id = 0;
    return function(){ return id++; };
})();

//
// Browsers and platforms detection

qq.ie       = function(){ return navigator.userAgent.indexOf('MSIE') != -1; }
qq.ie10     = function(){ return navigator.userAgent.indexOf('MSIE 10') != -1; }
qq.safari   = function(){ return navigator.vendor != undefined && navigator.vendor.indexOf("Apple") != -1; }
qq.chrome   = function(){ return navigator.vendor != undefined && navigator.vendor.indexOf('Google') != -1; }
qq.firefox  = function(){ return (navigator.userAgent.indexOf('Mozilla') != -1 && navigator.vendor != undefined && navigator.vendor == ''); }
qq.windows  = function(){ return navigator.platform == "Win32"; }

//
// Events

qq.preventDefault = function(e){
    if (e.preventDefault){
        e.preventDefault();
    } else{
        e.returnValue = false;
    }
};

/**
 * Creates and returns element from html string
 * Uses innerHTML to create an element
 */
qq.toElement = (function(){
    var div = document.createElement('div');
    return function(html){
        div.innerHTML = html;
        var element = div.firstChild;
        div.removeChild(element);
        return element;
    };
})();

/**
 * obj2url() takes a json-object as argument and generates
 * a querystring. pretty much like jQuery.param()
 *
 * how to use:
 *
 *    `qq.obj2url({a:'b',c:'d'},'http://any.url/upload?otherParam=value');`
 *
 * will result in:
 *
 *    `http://any.url/upload?otherParam=value&a=b&c=d`
 *
 * @param  Object JSON-Object
 * @param  String current querystring-part
 * @return String encoded querystring
 */
qq.obj2url = function(obj, temp, prefixDone){
    var uristrings = [],
        prefix = '&',
        add = function(nextObj, i){
            var nextTemp = temp
                ? (/\[\]$/.test(temp)) // prevent double-encoding
                ? temp
                : temp+'['+i+']'
                : i;
            if ((nextTemp != 'undefined') && (i != 'undefined')) {
                uristrings.push(
                    (typeof nextObj === 'object')
                        ? qq.obj2url(nextObj, nextTemp, true)
                        : (Object.prototype.toString.call(nextObj) === '[object Function]')
                        ? encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj())
                        : encodeURIComponent(nextTemp) + '=' + encodeURIComponent(nextObj)
                );
            }
        };

    if (!prefixDone && temp) {
        prefix = (/\?/.test(temp)) ? (/\?$/.test(temp)) ? '' : '&' : '?';
        uristrings.push(temp);
        uristrings.push(qq.obj2url(obj));
    } else if ((Object.prototype.toString.call(obj) === '[object Array]') && (typeof obj != 'undefined') ) {
        // we wont use a for-in-loop on an array (performance)
        for (var i = 0, len = obj.length; i < len; ++i){
            add(obj[i], i);
        }
    } else if ((typeof obj != 'undefined') && (obj !== null) && (typeof obj === "object")){
        // for anything else but a scalar, we will use for-in-loop
        for (var i in obj){
            add(obj[i], i);
        }
    } else {
        uristrings.push(encodeURIComponent(temp) + '=' + encodeURIComponent(obj));
    }

    if (temp) {
        return uristrings.join(prefix);
    } else {
        return uristrings.join(prefix)
            .replace(/^&/, '')
            .replace(/%20/g, '+');
    }
};

/**
 * A generic module which supports object disposing in dispose() method.
 * */
qq.DisposeSupport = {
    _disposers: [],

    /** Run all registered disposers */
    dispose: function() {
        var disposer;
        while (disposer = this._disposers.shift()) {
            disposer();
        }
    },

    /** Add disposer to the collection */
    addDisposer: function(disposeFunction) {
        this._disposers.push(disposeFunction);
    },

    /** Attach event handler and register de-attacher as a disposer */
    _attach: function() {
        this.addDisposer(qq(arguments[0]).attach.apply(this, Array.prototype.slice.call(arguments, 1)));
    }
};
