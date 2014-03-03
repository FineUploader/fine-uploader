/*globals window, navigator, document, FormData, File, HTMLInputElement, XMLHttpRequest, Blob, Storage, ActiveXObject */
/* jshint -W079 */
var qq = function(element) {
    "use strict";

    return {
        hide: function() {
            element.style.display = "none";
            return this;
        },

        /** Returns the function which detaches attached event */
        attach: function(type, fn) {
            if (element.addEventListener){
                element.addEventListener(type, fn, false);
            } else if (element.attachEvent){
                element.attachEvent("on" + type, fn);
            }
            return function() {
                qq(element).detach(type, fn);
            };
        },

        detach: function(type, fn) {
            if (element.removeEventListener){
                element.removeEventListener(type, fn, false);
            } else if (element.attachEvent){
                element.detachEvent("on" + type, fn);
            }
            return this;
        },

        contains: function(descendant) {
            // The [W3C spec](http://www.w3.org/TR/domcore/#dom-node-contains)
            // says a `null` (or ostensibly `undefined`) parameter
            // passed into `Node.contains` should result in a false return value.
            // IE7 throws an exception if the parameter is `undefined` though.
            if (!descendant) {
                return false;
            }

            // compareposition returns false in this case
            if (element === descendant) {
                return true;
            }

            if (element.contains){
                return element.contains(descendant);
            } else {
                /*jslint bitwise: true*/
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
            /*jshint eqnull: true*/
            if (element.style == null) {
                throw new qq.Error("Can't apply style to node as it is not on the HTMLElement prototype chain!");
            }

            /*jshint -W116*/
            if (styles.opacity != null){
                if (typeof element.style.opacity !== "string" && typeof(element.filters) !== "undefined"){
                    styles.filter = "alpha(opacity=" + Math.round(100 * styles.opacity) + ")";
                }
            }
            qq.extend(element.style, styles);

            return this;
        },

        hasClass: function(name) {
            var re = new RegExp("(^| )" + name + "( |$)");
            return re.test(element.className);
        },

        addClass: function(name) {
            if (!qq(element).hasClass(name)){
                element.className += " " + name;
            }
            return this;
        },

        removeClass: function(name) {
            var re = new RegExp("(^| )" + name + "( |$)");
            element.className = element.className.replace(re, " ").replace(/^\s+|\s+$/g, "");
            return this;
        },

        getByClass: function(className) {
            var candidates,
                result = [];

            if (element.querySelectorAll){
                return element.querySelectorAll("." + className);
            }

            candidates = element.getElementsByTagName("*");

            qq.each(candidates, function(idx, val) {
                if (qq(val).hasClass(className)){
                    result.push(val);
                }
            });
            return result;
        },

        children: function() {
            var children = [],
                child = element.firstChild;

            while (child){
                if (child.nodeType === 1){
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
        },

        // Returns true if the attribute exists on the element
        // AND the value of the attribute is NOT "false" (case-insensitive)
        hasAttribute: function(attrName) {
            var attrVal;

            if (element.hasAttribute) {

                if (!element.hasAttribute(attrName)) {
                    return false;
                }

                /*jshint -W116*/
                return (/^false$/i).exec(element.getAttribute(attrName)) == null;
            }
            else {
                attrVal = element[attrName];

                if (attrVal === undefined) {
                    return false;
                }

                /*jshint -W116*/
                return (/^false$/i).exec(attrVal) == null;
            }
        }
    };
};

(function(){
    "use strict";

    qq.log = function(message, level) {
        if (window.console) {
            if (!level || level === "info") {
                window.console.log(message);
            }
            else
            {
                if (window.console[level]) {
                    window.console[level](message);
                }
                else {
                    window.console.log("<" + level + "> " + message);
                }
            }
        }
    };

    qq.isObject = function(variable) {
        return variable && !variable.nodeType && Object.prototype.toString.call(variable) === "[object Object]";
    };

    qq.isFunction = function(variable) {
        return typeof(variable) === "function";
    };

    /**
     * Check the type of a value.  Is it an "array"?
     *
     * @param value value to test.
     * @returns true if the value is an array or associated with an `ArrayBuffer`
     */
    qq.isArray = function(value) {
        return Object.prototype.toString.call(value) === "[object Array]" ||
            (value && window.ArrayBuffer && value.buffer && value.buffer.constructor === ArrayBuffer);
    };

    // Looks for an object on a `DataTransfer` object that is associated with drop events when utilizing the Filesystem API.
    qq.isItemList = function(maybeItemList) {
        return Object.prototype.toString.call(maybeItemList) === "[object DataTransferItemList]";
    };

    // Looks for an object on a `NodeList` or an `HTMLCollection`|`HTMLFormElement`|`HTMLSelectElement`
    // object that is associated with collections of Nodes.
    qq.isNodeList = function(maybeNodeList) {
        return Object.prototype.toString.call(maybeNodeList) === "[object NodeList]" ||
            // If `HTMLCollection` is the actual type of the object, we must determine this
            // by checking for expected properties/methods on the object
            (maybeNodeList.item && maybeNodeList.namedItem);
    };

    qq.isString = function(maybeString) {
        return Object.prototype.toString.call(maybeString) === "[object String]";
    };

    qq.trimStr = function(string) {
        if (String.prototype.trim) {
            return string.trim();
        }

        return string.replace(/^\s+|\s+$/g,"");
    };


    /**
     * @param str String to format.
     * @returns {string} A string, swapping argument values with the associated occurrence of {} in the passed string.
     */
    qq.format = function(str) {

        var args =  Array.prototype.slice.call(arguments, 1),
            newStr = str,
            nextIdxToReplace = newStr.indexOf("{}");

        qq.each(args, function(idx, val) {
            var strBefore = newStr.substring(0, nextIdxToReplace),
                strAfter = newStr.substring(nextIdxToReplace+2);

            newStr = strBefore + val + strAfter;
            nextIdxToReplace = newStr.indexOf("{}", nextIdxToReplace + val.length);

            // End the loop if we have run out of tokens (when the arguments exceed the # of tokens)
            if (nextIdxToReplace < 0) {
                return false;
            }
        });

        return newStr;
    };

    qq.isFile = function(maybeFile) {
        return window.File && Object.prototype.toString.call(maybeFile) === "[object File]";
    };

    qq.isFileList = function(maybeFileList) {
        return window.FileList && Object.prototype.toString.call(maybeFileList) === "[object FileList]";
    };

    qq.isFileOrInput = function(maybeFileOrInput) {
        return qq.isFile(maybeFileOrInput) || qq.isInput(maybeFileOrInput);
    };

    qq.isInput = function(maybeInput, notFile) {
        var evaluateType = function(type) {
            var normalizedType = type.toLowerCase();

            if (notFile) {
                return normalizedType !== "file";
            }

            return normalizedType === "file";
        };

        if (window.HTMLInputElement) {
            if (Object.prototype.toString.call(maybeInput) === "[object HTMLInputElement]") {
                if (maybeInput.type && evaluateType(maybeInput.type)) {
                    return true;
                }
            }
        }
        if (maybeInput.tagName) {
            if (maybeInput.tagName.toLowerCase() === "input") {
                if (maybeInput.type && evaluateType(maybeInput.type)) {
                    return true;
                }
            }
        }

        return false;
    };

    qq.isBlob = function(maybeBlob) {
        if (window.Blob && Object.prototype.toString.call(maybeBlob) === "[object Blob]") {
            return true;
        }
    };

    qq.isXhrUploadSupported = function() {
        var input = document.createElement("input");
        input.type = "file";

        return (
            input.multiple !== undefined &&
                typeof File !== "undefined" &&
                typeof FormData !== "undefined" &&
                typeof (qq.createXhrInstance()).upload !== "undefined" );
    };

    // Fall back to ActiveX is native XHR is disabled (possible in any version of IE).
    qq.createXhrInstance = function() {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }

        try {
            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
        }
        catch(error) {
            qq.log("Neither XHR or ActiveX are supported!", "error");
            return null;
        }
    };

    qq.isFolderDropSupported = function(dataTransfer) {
        return (dataTransfer.items && dataTransfer.items[0].webkitGetAsEntry);
    };

    qq.isFileChunkingSupported = function() {
        return !qq.androidStock() && //Android's stock browser cannot upload Blobs correctly
            qq.isXhrUploadSupported() &&
            (File.prototype.slice !== undefined || File.prototype.webkitSlice !== undefined || File.prototype.mozSlice !== undefined);
    };

    qq.sliceBlob = function(fileOrBlob, start, end) {
        var slicer = fileOrBlob.slice || fileOrBlob.mozSlice || fileOrBlob.webkitSlice;

        return slicer.call(fileOrBlob, start, end);
    };

    qq.arrayBufferToHex = function(buffer) {
        var bytesAsHex = "",
            bytes = new Uint8Array(buffer);


        qq.each(bytes, function(idx, byte) {
            var byteAsHexStr = byte.toString(16);

            if (byteAsHexStr.length < 2) {
                byteAsHexStr = "0" + byteAsHexStr;
            }

            bytesAsHex += byteAsHexStr;
        });

        return bytesAsHex;
    };

    qq.readBlobToHex = function(blob, startOffset, length) {
        var initialBlob = qq.sliceBlob(blob, startOffset, startOffset + length),
            fileReader = new FileReader(),
            promise = new qq.Promise();

        fileReader.onload = function() {
            promise.success(qq.arrayBufferToHex(fileReader.result));
        };

        fileReader.onerror = promise.failure;

        fileReader.readAsArrayBuffer(initialBlob);

        return promise;
    };

    qq.extend = function(first, second, extendNested) {
        qq.each(second, function(prop, val) {
            if (extendNested && qq.isObject(val)) {
                if (first[prop] === undefined) {
                    first[prop] = {};
                }
                qq.extend(first[prop], val, true);
            }
            else {
                first[prop] = val;
            }
        });

        return first;
    };

    /**
     * Allow properties in one object to override properties in another,
     * keeping track of the original values from the target object.
     *
     * Note that the pre-overriden properties to be overriden by the source will be passed into the `sourceFn` when it is invoked.
     *
     * @param target Update properties in this object from some source
     * @param sourceFn A function that, when invoked, will return properties that will replace properties with the same name in the target.
     * @returns {object} The target object
     */
    qq.override = function(target, sourceFn) {
        var super_ = {},
            source = sourceFn(super_);

        qq.each(source, function(srcPropName, srcPropVal) {
            if (target[srcPropName] !== undefined) {
                super_[srcPropName] = target[srcPropName];
            }

            target[srcPropName] = srcPropVal;
        });

        return target;
    };

    /**
     * Searches for a given element in the array, returns -1 if it is not present.
     * @param {Number} [from] The index at which to begin the search
     */
    qq.indexOf = function(arr, elt, from){
        if (arr.indexOf) {
            return arr.indexOf(elt, from);
        }

        from = from || 0;
        var len = arr.length;

        if (from < 0) {
            from += len;
        }

        for (; from < len; from+=1){
            if (arr.hasOwnProperty(from) && arr[from] === elt){
                return from;
            }
        }
        return -1;
    };

    //this is a version 4 UUID
    qq.getUniqueId = function(){
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            /*jslint eqeq: true, bitwise: true*/
            var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    //
    // Browsers and platforms detection
    qq.ie = function() {
        return navigator.userAgent.indexOf("MSIE") !== -1;
    };

    qq.ie7 = function() {
        return navigator.userAgent.indexOf("MSIE 7") !== -1;
    };

    qq.ie10 = function() {
        return navigator.userAgent.indexOf("MSIE 10") !== -1;
    };

    qq.ie11 = function() {
        return (navigator.userAgent.indexOf("Trident") !== -1 &&
            navigator.userAgent.indexOf("rv:11") !== -1);
    };

    qq.safari = function() {
        return navigator.vendor !== undefined && navigator.vendor.indexOf("Apple") !== -1;
    };

    qq.chrome = function() {
        return navigator.vendor !== undefined && navigator.vendor.indexOf("Google") !== -1;
    };

    qq.opera = function() {
        return navigator.vendor !== undefined && navigator.vendor.indexOf("Opera") !== -1;
    };

    qq.firefox = function() {
        return (!qq.ie11() && navigator.userAgent.indexOf("Mozilla") !== -1 && navigator.vendor !== undefined && navigator.vendor === "");
    };

    qq.windows = function() {
        return navigator.platform === "Win32";
    };

    qq.android = function() {
        return navigator.userAgent.toLowerCase().indexOf("android") !== -1;
    };

    // We need to identify the Android stock browser via the UA string to work around various bugs in this browser,
    // such as the one that prevents a `Blob` from being uploaded.
    qq.androidStock = function() {
        return qq.android() && navigator.userAgent.toLowerCase().indexOf("chrome") < 0;
    };

    qq.ios7 = function() {
        return qq.ios() && navigator.userAgent.indexOf(" OS 7_") !== -1;
    };

    qq.ios = function() {
        /*jshint -W014 */
        return navigator.userAgent.indexOf("iPad") !== -1
            || navigator.userAgent.indexOf("iPod") !== -1
            || navigator.userAgent.indexOf("iPhone") !== -1;
    };

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
        var div = document.createElement("div");
        return function(html){
            div.innerHTML = html;
            var element = div.firstChild;
            div.removeChild(element);
            return element;
        };
    }());

    //key and value are passed to callback for each entry in the iterable item
    qq.each = function(iterableItem, callback) {
        var keyOrIndex, retVal;

        if (iterableItem) {
            // Iterate through [`Storage`](http://www.w3.org/TR/webstorage/#the-storage-interface) items
            if (window.Storage && iterableItem.constructor === window.Storage) {
                for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                    retVal = callback(iterableItem.key(keyOrIndex), iterableItem.getItem(iterableItem.key(keyOrIndex)));
                    if (retVal === false) {
                        break;
                    }
                }
            }
            // `DataTransferItemList` & `NodeList` objects are array-like and should be treated as arrays
            // when iterating over items inside the object.
            else if (qq.isArray(iterableItem) || qq.isItemList(iterableItem) || qq.isNodeList(iterableItem)) {
                for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                    retVal = callback(keyOrIndex, iterableItem[keyOrIndex]);
                    if (retVal === false) {
                        break;
                    }
                }
            }
            else if (qq.isString(iterableItem)) {
                for (keyOrIndex = 0; keyOrIndex < iterableItem.length; keyOrIndex++) {
                    retVal = callback(keyOrIndex, iterableItem.charAt(keyOrIndex));
                    if (retVal === false) {
                        break;
                    }
                }
            }
            else {
                for (keyOrIndex in iterableItem) {
                    if (Object.prototype.hasOwnProperty.call(iterableItem, keyOrIndex)) {
                        retVal = callback(keyOrIndex, iterableItem[keyOrIndex]);
                        if (retVal === false) {
                            break;
                        }
                    }
                }
            }
        }
    };

    //include any args that should be passed to the new function after the context arg
    qq.bind = function(oldFunc, context) {
        if (qq.isFunction(oldFunc)) {
            var args =  Array.prototype.slice.call(arguments, 2);

            return function() {
                var newArgs = qq.extend([], args);
                if (arguments.length) {
                    newArgs = newArgs.concat(Array.prototype.slice.call(arguments));
                }
                return oldFunc.apply(context, newArgs);
            };
        }

        throw new Error("first parameter must be a function!");
    };

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
        /*jshint laxbreak: true*/
        var uristrings = [],
            prefix = "&",
            add = function(nextObj, i){
                var nextTemp = temp
                    ? (/\[\]$/.test(temp)) // prevent double-encoding
                    ? temp
                    : temp+"["+i+"]"
                    : i;
                if ((nextTemp !== "undefined") && (i !== "undefined")) {
                    uristrings.push(
                        (typeof nextObj === "object")
                            ? qq.obj2url(nextObj, nextTemp, true)
                            : (Object.prototype.toString.call(nextObj) === "[object Function]")
                            ? encodeURIComponent(nextTemp) + "=" + encodeURIComponent(nextObj())
                            : encodeURIComponent(nextTemp) + "=" + encodeURIComponent(nextObj)
                    );
                }
            };

        if (!prefixDone && temp) {
            prefix = (/\?/.test(temp)) ? (/\?$/.test(temp)) ? "" : "&" : "?";
            uristrings.push(temp);
            uristrings.push(qq.obj2url(obj));
        } else if ((Object.prototype.toString.call(obj) === "[object Array]") && (typeof obj !== "undefined") ) {
            qq.each(obj, function(idx, val) {
                add(val, idx);
            });
        } else if ((typeof obj !== "undefined") && (obj !== null) && (typeof obj === "object")){
            qq.each(obj, function(prop, val) {
                add(val, prop);
            });
        } else {
            uristrings.push(encodeURIComponent(temp) + "=" + encodeURIComponent(obj));
        }

        if (temp) {
            return uristrings.join(prefix);
        } else {
            return uristrings.join(prefix)
                .replace(/^&/, "")
                .replace(/%20/g, "+");
        }
    };

    qq.obj2FormData = function(obj, formData, arrayKeyName) {
        if (!formData) {
            formData = new FormData();
        }

        qq.each(obj, function(key, val) {
            key = arrayKeyName ? arrayKeyName + "[" + key + "]" : key;

            if (qq.isObject(val)) {
                qq.obj2FormData(val, formData, key);
            }
            else if (qq.isFunction(val)) {
                formData.append(key, val());
            }
            else {
                formData.append(key, val);
            }
        });

        return formData;
    };

    qq.obj2Inputs = function(obj, form) {
        var input;

        if (!form) {
            form = document.createElement("form");
        }

        qq.obj2FormData(obj, {
            append: function(key, val) {
                input = document.createElement("input");
                input.setAttribute("name", key);
                input.setAttribute("value", val);
                form.appendChild(input);
            }
        });

        return form;
    };

    qq.setCookie = function(name, value, days) {
        var date = new Date(),
            expires = "";

        if (days) {
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        }

        document.cookie = name+"="+value+expires+"; path=/";
    };

    qq.getCookie = function(name) {
        var nameEQ = name + "=",
            ca = document.cookie.split(";"),
            cookie;

        qq.each(ca, function(idx, part) {
            /*jshint -W116 */
            var cookiePart = part;
            while (cookiePart.charAt(0) == " ") {
                cookiePart = cookiePart.substring(1, cookiePart.length);
            }

            if (cookiePart.indexOf(nameEQ) === 0) {
                cookie = cookiePart.substring(nameEQ.length, cookiePart.length);
                return false;
            }
        });

        return cookie;
    };

    qq.getCookieNames = function(regexp) {
        var cookies = document.cookie.split(";"),
            cookieNames = [];

        qq.each(cookies, function(idx, cookie) {
            cookie = qq.trimStr(cookie);

            var equalsIdx = cookie.indexOf("=");

            if (cookie.match(regexp)) {
                cookieNames.push(cookie.substr(0, equalsIdx));
            }
        });

        return cookieNames;
    };

    qq.deleteCookie = function(name) {
        qq.setCookie(name, "", -1);
    };

    qq.areCookiesEnabled = function() {
        var randNum = Math.random() * 100000,
            name = "qqCookieTest:" + randNum;
        qq.setCookie(name, 1);

        if (qq.getCookie(name)) {
            qq.deleteCookie(name);
            return true;
        }
        return false;
    };

    /**
     * Not recommended for use outside of Fine Uploader since this falls back to an unchecked eval if JSON.parse is not
     * implemented.  For a more secure JSON.parse polyfill, use Douglas Crockford's json2.js.
     */
    qq.parseJson = function(json) {
        /*jshint evil: true*/
        if (window.JSON && qq.isFunction(JSON.parse)) {
            return JSON.parse(json);
        } else {
            return eval("(" + json + ")");
        }
    };

    /**
     * Retrieve the extension of a file, if it exists.
     *
     * @param filename
     * @returns {string || undefined}
     */
    qq.getExtension = function(filename) {
        var extIdx = filename.lastIndexOf(".") + 1;

        if (extIdx > 0) {
            return filename.substr(extIdx, filename.length - extIdx);
        }
    };

    qq.getFilename = function(blobOrFileInput) {
        /*jslint regexp: true*/

        if (qq.isInput(blobOrFileInput)) {
            // get input value and remove path to normalize
            return blobOrFileInput.value.replace(/.*(\/|\\)/, "");
        }
        else if (qq.isFile(blobOrFileInput)) {
            if (blobOrFileInput.fileName !== null && blobOrFileInput.fileName !== undefined) {
                return blobOrFileInput.fileName;
            }
        }

        return blobOrFileInput.name;
    };

    /**
     * A generic module which supports object disposing in dispose() method.
     * */
    qq.DisposeSupport = function() {
        var disposers = [];

        return {
            /** Run all registered disposers */
            dispose: function() {
                var disposer;
                do {
                    disposer = disposers.shift();
                    if (disposer) {
                        disposer();
                    }
                }
                while (disposer);
            },

            /** Attach event handler and register de-attacher as a disposer */
            attach: function() {
                var args = arguments;
                /*jslint undef:true*/
                this.addDisposer(qq(args[0]).attach.apply(this, Array.prototype.slice.call(arguments, 1)));
            },

            /** Add disposer to the collection */
            addDisposer: function(disposeFunction) {
                disposers.push(disposeFunction);
            }
        };
    };
}());
