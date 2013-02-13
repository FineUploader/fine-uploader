## qQuery ##
Fine Uploader, which lives in the `qq` namespace, also contains a number of utility functions in the same namespace.
While these functions were developed to be used by the internal Fine Uploader code, they are all public functions and many
of them may be useful to others.  If, for example, you cannot or do not want to import a 3rd-party library such as jQuery,
Fine Uploader's qQuery contains a number of useful utility functions.  I will document the ones that are most likely to be
useful outside of Fine Uploader below:

### `qq(HTMLElement)` ###
The functions below are part of the `qq(HTMLElement)` function.  This is similar to the `jQuery` function that takes,
for one, a selector string.  `qq(...)` is a bit simpler and less advanced, though.  It only accepts one HTMLElement (for now).
For example, if you want to hide an element with an ID of "myDiv":

```javascript
var myDiv = document.getElementById('myDiv');
qq(myDiv).hide();
```

The following element-related functions are available on the `qq(...)` function.  Unless otherwise specified, the function returns the qq instance to allow chaining:
* `hide()` - Hides this element.
* `attach(String type, Function callback)` - attach an event handler to this element for a specific type of native DOM event.  Returns a `detach` function.
* `detach(String type, Function originalCallback)` - detach an already attached event handler given a specific event type and callback function.
* `contains(HTMLElement descendant)` - Returns true if this element contains the passed element.
* `insertBefore(HTMLElement elementB)` - Inserts this element directly before the passed element in the DOM.
* `remove()` - Removes this element from the DOM.
* `css(Object styles)` - Specify css styles for this element, such as `{top: 0, right: 0`}.
* `hasClass(String className)` - Returns true if this element has the passed class name.
* `addClass(String className)` - Adds the passed class to this element.
* `removeClass(String className)` - Removes the passed class from this element.
* `getByClass(String className)` -  Returns an array of all descendants of this element that contain the passed class name.
* `setText(String text)` - Sets the text for this element.
* `clearText(String text)` - Clears all text for this element.
* `children()` - Returns an array of all immediate children elements of this element.

### The following utility functions are also available in the `qq` namespace as: ###
* `qq.isObject(somevar)` - Returns true if the parameter is a "simple" object, such as `{foo: "bar"}` or `new Object()`.
* `qq.isFunction(maybeFunc)` - Returns true if the parameter is a function.
* `qq.trimStr(string)` - Polyfill for `String.prototype.trim()`, since some browsers, such as IE8 and earlier, do not support this function.
* `qq.extend(Object firstObj, Object secondObj, Boolean extendNested)` - Copies the properties of secondObj to firstObj.  If extendNested is true, sub-properties of secondObj are copied over as well.
* `qq.indexOf(Array array, String item, Number startingIndex)` - Same as [indexOf from Javascript 1.6](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf), but implemented for browsers that don't support this native function, such as IE8 and earlier.
* `qq.preventDefault(Event)` - A function used to prevent the user agent's default action.  To be used inside an event handler.
* `qq.toElement()` - Creates and returns a new DIV element.
* `qq.each(objectOrArray, callback)` - Iterates through an object or array, passing your callback the key and value for each element in the object.  `return false;` to stop iteration.
* `qq.log(String logMessage, (optional) String logLevel)` - Log a message to the console.  No-op if console logging is not supported
by the user agent.  Will delegate to the user agent's logging function that corresponds to the passed logging level, if
it exists.  If a comparable function does not exist, but console logging is supported, the log event will be delegated
to `console.log` and the log level will be included in the message.
* `qq.ie10()` - Returns true if the current user agent is Internet Explorer 10.
* `qq.ie()` - Returns true if the current user agent is Internet Explorer.
* `qq.safari()` - Returns true if the current user agent is Safari.
* `qq.chrome()` - Returns true if the current user agent is Chrome.
* `qq.firefox()` - Returns true if the current user agent is Firefox.
* `qq.windows()` - Returns true if the current user agent is running on the Microsoft Windows platform.
* `qq.android()` - Returns true of the current user agent in running on an Android device.
* `qq.isXhrUploadSupported()` - Returns true if the current user agent is capable of sending files using an ajax request.
* `qq.isFolderDropSupported()` - Returns true if the current user agent is capable of handling dropped folders.
* `qq.isFileChunkingSupported()` - Returns true if the current user agent is capable of sending chunked file requests.
* `qq.areCookiesEnabled()` - Returns true if persistent cookies are permitted by the user agent.
* `qq.getUniqueId()` - Returns a version 4 UUID.
* `qq.getCookie(String name)` - Returns the value of the cookie associated with the passed name.
* `qq.setCookie(String name, String value, number daysTillExpiration)` - Sets or updates a cookie.
* `qq.deleteCookie(String name) - Deletes a cookie with the passed name.


