/**
 * Multiple file upload with progress-bar and drag-and-drop. 
 * © Andrew Valums (andrew@valums.com)
 */

var qq = qq || {};

/**
 * Class that creates our multiple file upload widget
 */
qq.FileUploader = function(o){
    this._options = {
        // parent element (DOM node)
        element: null,
        // url of the server-side upload script, should be on the same domain
        action: 'upload-test.php',
        // additional data to send, name-value pairs
        params: {},
        // ex. 'jpg png jpeg tiff'
        allowedExtensions: '',        
        // size limit in bytes, 0 - no limit
        // this option isn't supported in all browsers
        sizeLimit: 0,
        // return false to cancel
        onSubmit: function(id, fileName){},
        onComplete: function(id, fileName, responseJSON){},

        //
        // UI customizations

        template: '<div class="qq-upload-button">Upload a file</div>' +
            '<div class="qq-upload-message"></div>' +
            '<ul class="qq-upload-list"></ul>',

        // template for one item in file list
        fileTemplate: '<li>' +
                '<span class="qq-upload-file-name"></span>' +
                '<span class="qq-upload-spinner"></span>' +
                '<span class="qq-upload-progress"></span>' +
                '<span class="qq-upload-cancel">cancel</span>' +
            '</li>',

        classes: {
            // added to this._element if xhr with progress 
            // is used for uploads
            ajaxUpload: 'qq-upload-ajax',
                                    
            // used to get elements from templates
            button: 'qq-upload-button',
            message: 'qq-upload-message',
            list: 'qq-upload-list',
            fileName: 'qq-upload-file-name',
            progress: 'qq-upload-progress',
            cancel: 'qq-upload-cancel',
            
            // are set after some events
            buttonHover: 'qq-upload-button-hover',
            buttonFocus: 'qq-upload-button-focus',
            // added to list item when upload completes
            // used in css to hide progress spinner, cancel button
            completed: 'qq-upload-completed'
        },
        messages: {
            serverError: "File wasn't uploaded, please contact support and/or try again.",
            typeError: "You selected invalid file, only % are allowed.",
            sizeError: "The file you selected is too large, maximum file size is %",            
        }
    };

    qq.extend(this._options, o);

    this._element = this._options.element;

    if (this._element.nodeType != 1){
        throw new Error('element param of FileUploader should be dom node');
    }

    this._element.innerHTML = this._options.template;

    // get elements for faster access

    this._button = this._getElement('button');
    this._list = this._getElement('list');
    this._message = this._getElement('message');

    // number of files being uploaded
    this._filesInProgress = 0;
    
    // for easier access
    this._classes = this._options.classes;
    
    // make button suitable container for input
    qq.css(this._button, {
        position: 'relative',
        overflow: 'hidden',
        // Make sure browse button is in the right side
        // in Internet Explorer
        direction: 'ltr'
    });

    this._input = this._createInput();
    this._handler = this._createUploadHandler();
    
    if (this._handler instanceof qq.UploadHanderXhr){
        qq.addClass(this._element, this._classes.ajaxUpload);
    }
    
    this._bindCancelEvent();
};

qq.FileUploader.prototype = {
    overwriteParams: function(){
        
    },
    /**
     * Returns true if some file is being uploaded, false otherwise
     */
    isUploading: function(){
        return !! self._filesInProgress;
    },
    showMessage: function(message){
        qq.setText(this._message, message);
    },   
    /**
     * Gets one of the elements listed in this._options.classes
     * 
     * First optional element is root for search,
     * this._element is default value.
     *
     * Usage
     *  1. this._getElement('button');
     *  2. this._getElement(item, 'file'); 
     **/
    _getElement: function(parent, type){
        if (typeof arguments[0] == 'string'){
            parent = this._element;
            type = arguments[0];       
        }
        
        return qq.getByClass(parent, this._options.classes[type])[0];
    },
    _getMessage: function(code){
        var message = this._options.messages[code];
        if (code == 'typeError'){
            message = message.replace('%', this._options.allowedExtensions.join(', '));
        } else if (code == 'sizeError'){
            message = message.replace('%', this._options.sizeLimit);
        }
        
        return message; 
    },
    _isAllowedExtension: function(fileName){
        return true;
    },
    _createUploadHandler: function(){
        var self = this,
            handlerClass;        
        
        if( qq.UploadHandlerXhr.isSupported()){            
            handlerClass = 'UploadHandlerXhr';                        
        } else {
            handlerClass = 'UploadHandlerForm';
        }

        var handler = new qq[handlerClass]({
            action: this._options.action,            
            onProgress: function(id, fileName, loaded, total){
                // is only called for xhr upload
                self._updateProgress(id, loaded, total);                    
            },
            onComplete: function(id, fileName, result){
                                
                self._options.onComplete(id, fileName, result);
                
                self._markCompleted(id);

                if (!result.success){
                    self.showMessage(result.error || self.getText("serverError"));
                }
            }
        });

        return handler;
    },
    _createInput: function(){
        var input = document.createElement("input");
        //input.setAttribute("multiple", "multiple");
        input.setAttribute("type", "file");
        input.setAttribute("name", "file");
        qq.css(input, {
            position: 'absolute',
            // in Opera only 'browse' button
            // is clickable and it is located at
            // the right side of the input
            right: 0,
            top: 0,
            zIndex: 1,
            fontSize: '480px',
            margin: 0,
            padding: 0,
            cursor: 'pointer',
            opacity: 0
        });
        this._button.appendChild(input);

        var self = this;
        qq.attach(input, 'change', function(){
            self._onInputChange();
        });

        
        qq.attach(input, 'mouseover', function(){
            qq.addClass(self._button, self._classes.buttonHover);
        });
        qq.attach(input, 'mouseout', function(){
            qq.removeClass(self._button, self._classes.buttonHover);
        });
        qq.attach(input, 'focus', function(){
            qq.addClass(self._button, self._classes.buttonFocus);
        });
        qq.attach(input, 'blur', function(){
            qq.removeClass(self._button, self._classes.buttonFocus);
        });

        // IE and Opera, unfortunately have 2 tab stops on file input
        // which is unacceptable in our case, disable keyboard access
        if (window.attachEvent){
            // it is IE or Opera
            input.setAttribute('tabIndex', "-1");
        }

        return input;
    },
    _onInputChange: function(){        
        if (this._handler instanceof qq.UploadHandlerXhr){
            
            var files = this._input.files;
            var i = files.length;
            while (i--){
                this._uploadFile(files[i], files[i].name, files[i].size);
            }            
        } else {            
            // Some browsers have path, others just file name
            var name = this._input.value.replace(/.*(\/|\\)/, "");
            this._uploadFile(this._input, name);
            qq.remove(this._input);                        
        }
                
        this._input = this._createInput();
        qq.removeClass(this._button, this._classes.buttonFocus);
    },     
    _uploadFile: function(fileContainer, name, size){
        if (! this._isAllowedExtension(name)){
            this._error('typeError');   
                             
        } else if (this._options.sizeLimit && size > this._options.sizeLimit){
            this._error('sizeError');
                                                   
        } else {                    
            var id = this._handler.add(fileContainer);
                    
            if (this._options.onSubmit(id, name) !== false){
                this._handler.upload(id, this._options.params);
                this._addToList(id, name);                                                
            } else {
                this._handler.cancel(id);
            }                    
                    
        }                                   
    },  
    _addToList: function(fileName, id){
        var item = qq.toElement(this._options.fileTemplate);          
        
        item.qqFileId = id;

        var fileElement = qq._getElement(item, 'file');        
        qq.setText(fileElement, fileName);
        

        this._list.appendChild(item);

        this._filesInProgress++;
    },
    _markCompleted: function(id){
        var item = this._getItemByFileId(id);        
        qq.addClass(item, this._classes.completed);
    },
    _updateProgress: function(id, loaded, total){
        var item = this._getItemByFileId(id);
        var progress = this._getElement(item, 'progress');
        
        qq.setText(progress, loaded + ' / ' + total);
    },
    _getItemByFileId: function(id){
        var item = this._list.firstChild;
        
        // there can't be text nodes in this._list
        // because of that we can safely use nextSibling
        
        while (item){
            item = item.nextSibling;
            if (item.qqFileId == id){
                return item;
            }
        }          
    },
    /**
     * delegate click event for cancel link 
     **/
    _bindCancelEvent: function(){
        var self = this;
        qq.attach(this._list, 'click', function(e){
            e = e || window.event;
            var target = e.target || e.srcElement;

            if (qq.hasClass(target, self._classes.cancel)){
                qq.preventDefault(e);

                var item = target.parentNode;
                self._handler.cancel(item.qqFileId);
                qq.remove(item);
            }
        });

    },    
};

/**
 * Class for uploading files using form and iframe
 */
qq.UploadHandlerForm = function(o){
    this._options = {
        // URL of the server-side upload script,
        // should be on the same domain to get response
        action: '/upload',
        // fires for each file, when iframe finishes loading
        onComplete: function(id, fileName, response){}
    };
    qq.extend(this._options, o);
       
    this._inputs = {};
};
qq.UploadHandlerForm.prototype = {
    /**
     * Adds file input to the queue
     * Returns id to use with upload, cancel
     **/    
    add: function(fileInput){
        fileInput.setAttribute('name', 'qqfile');
        var id = 'qq-upload-handler-iframe' + qq.getUniqueId();       
        
        this._inputs[id] = fileInput;
        
        // remove file input from DOM
        qq.remove(fileInput);
                
        return id;
    },
    /**
     * Sends the file identified by id and additional query params to the server
     * @param {Object} params name-value string pairs
     */
    upload: function(id, params){                        
        var input = this._inputs[id];
        
        if (!input){
            throw new Error('file with passed id was not added, or already uploaded or cancelled');
        }                
        
        var fileName = input.value.replace(/.*(\/|\\)/, "");
                
        var iframe = this._createIframe(id);
        var form = this._createForm(iframe, params);
        form.appendChild(input);

        var self = this;
        this._attachLoadEvent(iframe, function(){            
            self._options.onComplete(id, fileName, self._getIframeContentJSON(iframe));

            // timeout added to fix busy state in FF3.6
            setTimeout(function(){
                qq.remove(iframe);
            }, 1);
        });

        form.submit();
        
        qq.remove(form);
        delete this._inputs[id];
        
        return id;
    },
    cancel: function(id){        
        if (id in this._inputs){
            delete this._inputs[id];
        }        

        var iframe = document.getElementById(id);
        if (iframe){
            // to cancel request set src to something else
            // we use src="javascript:false;" because it doesn't
            // trigger ie6 prompt on https
            iframe.setAttribute('src', 'javascript:false;');

            qq.remove(iframe);
        }
    },
    _attachLoadEvent: function(iframe, callback){
        qq.attach(iframe, 'load', function(){
            // when we remove iframe from dom
            // the request stops, but in IE load
            // event fires
            if (!iframe.parentNode){
                return;
            }

            // fixing Opera 10.53
            if (iframe.contentDocument &&
                iframe.contentDocument.body &&
                iframe.contentDocument.body.innerHTML == "false"){
                // In Opera event is fired second time
                // when body.innerHTML changed from false
                // to server response approx. after 1 sec
                // when we upload file with iframe
                return;
            }

            callback();
        });
    },
    /**
     * Returns json object received by iframe from server.
     */
    _getIframeContentJSON: function(iframe){
        // iframe.contentWindow.document - for IE<7
        var doc = iframe.contentDocument ? iframe.contentDocument: iframe.contentWindow.document,
            response;

        try{
            response = eval("(" + doc.body.innerHTML + ")");
        } catch(err){
            response = {};
        }

        return response;
    },
    /**
     * Creates iframe with unique name
     */
    _createIframe: function(id){
        // We can't use following code as the name attribute
        // won't be properly registered in IE6, and new window
        // on form submit will open
        // var iframe = document.createElement('iframe');
        // iframe.setAttribute('name', id);

        var iframe = qq.toElement('<iframe src="javascript:false;" name="' + id + '" />');
        // src="javascript:false;" removes ie6 prompt on https

        iframe.setAttribute('id', id);

        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        return iframe;
    },
    /**
     * Creates form, that will be submitted to iframe
     */
    _createForm: function(iframe, params){
        // We can't use the following code in IE6
        // var form = document.createElement('form');
        // form.setAttribute('method', 'post');
        // form.setAttribute('enctype', 'multipart/form-data');
        // Because in this case file won't be attached to request
        var form = qq.toElement('<form method="post" enctype="multipart/form-data"></form>');

        var queryString = '?';
        for (key in params){
            queryString += '&' + key + '=' + encodeURIComponent(params[key]);
        }

        form.setAttribute('action', this._options.action + queryString);
        form.setAttribute('target', iframe.name);
        form.style.display = 'none';
        document.body.appendChild(form);

        return form;
    }
};

/**
 * Class for uploading files using xhr
 */
qq.UploadHandlerXhr = function(o){
    this._options = {
        // url of the server-side upload script,
        // should be on the same domain
        action: '/upload',
        onProgress: function(id, fileName, loaded, total){},
        onComplete: function(id, fileName, response){}
    };
    qq.extend(this._options, o);

    this._files = [];
    this._xhrs = [];
};
qq.UploadHandlerXhr.prototype = {
    /**
     * Adds file to the queue
     * Returns id to use with upload, cancel
     **/    
    add: function(file){
        return this._files.push(file) - 1;        
    },
    /**
     * Sends the file identified by id and additional query params to the server
     * @param {Object} params name-value string pairs
     */    
    upload: function(id, params){
        var file = this._files[id];
        
        if (!file){
            throw new Error('file with passed id was not added, or already uploaded or cancelled');   
        }
                        
        var xhr = this._xhrs[id] = new XMLHttpRequest();

        var self = this;
        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                self._options.onProgress(id, file.name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = function(){
            // the request was aborted/cancelled
            if (!self._files[id]){
                return;
            }
            
            if (xhr.readyState == 4){

                self._files[id] = null;
                self._xhrs[id] = null;

                if (xhr.status == 200){
                    var response;
                    
                    try {
                        response = eval("(" + xhr.responseText + ")");
                    } catch(err){
                        response = {};
                    }
                    
                    self._options.onComplete(id, file.name, response);
                        
                } else {                   
                    self._options.onComplete(id, file.name, {});
                }                
            }
        };

        // build query string
        var queryString = '?qqfile=' + encodeURIComponent(file.fileName);
        for (key in params){
            queryString += '&' + key + '=' + encodeURIComponent(params[key]);
        }

        xhr.open("POST", this._options.action + queryString, true);
        xhr.send(file);
    },
    cancel: function(id){
        this._files[id] = null;
        
        if (this._xhrs[id]){
            this._xhrs[id].abort();
            this._xhrs[id] = null;                                   
        }
    }
};

//
// Helper functions
//

var qq = qq || {};

//
// Useful generic functions

/**
 * Adds all missing properties from obj2 to obj1
 */
qq.extend = function(obj1, obj2){
    for (prop in obj2){
        obj1[prop] = obj2[prop];
    }
};

/**
 * @return {Number} unique id
 */
qq.getUniqueId = (function(){
    var id = 0;
    return function(){
        return id++;
    };
})();

//
// Events

qq.attach = function(element, type, fn){
    if (element.addEventListener){
        element.addEventListener(type, fn, false);
    } else if (element.attachEvent){
        element.attachEvent('on' + type, fn);
    }
};
qq.detach = function(element, type, fn){
    if (element.removeEventListener){
        element.removeEventListener(type, fn, false);
    } else if (element.attachEvent){
        element.detachEvent('on' + type, fn);
    }
};

qq.preventDefault = function(e){
    if (e.preventDefault){
        e.preventDefault();
    } else{
        e.returnValue = false;
    }
}
//
// Node manipulations

/**
 * Insert node a before node b.
 */
qq.insertBefore = function(a, b){
    b.parentNode.insertBefore(a, b);
};
qq.remove = function(element){
    if (element.parentNode){
        element.parentNode.removeChild(element);
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
        var el = div.firstChild;
        div.removeChild(el)
        return el;
    };
})();

//
// Node properties and attributes

/**
 * Sets styles for an element.
 * Fixes opacity in IE6-8.
 */
qq.css = function(el, styles){
    if (styles.opacity != null){
        if (typeof el.style.opacity != 'string' && typeof(el.filters) != 'undefined'){
            styles.filter = 'alpha(opacity=' + Math.round(100 * styles.opacity) + ')';
        }
    }
    qq.extend(el.style, styles);
};
qq.hasClass = function(element, name){
    var re = new RegExp('(^| )' + name + '( |$)');
    return re.test(element.className);
};
qq.addClass = function(element, name){
    if (!qq.hasClass(element, name)){
        element.className += ' ' + name;
    }
};
qq.removeClass = function(element, name){
    var re = new RegExp('(^| )' + name + '( |$)');
    element.className = element.className.replace(re, ' ').replace(/^\s+|\s+$/g, "");
};
qq.setText = function(el, text){
    el.innerText = text;
    el.textContent = text;
};

//
// Selecting elements

qq.children = function(element){
    var children = [],
    child = element.firstChild;

    while (child){
        if (child.nodeType == 1){
            children.push(child);
        }
        child = child.nextSibling;
    }

    return children;
};

qq.getByClass = function(element, className){
    if (element.querySelectorAll){
        return element.querySelectorAll('.' + className);
    }

    var result = [];
    var candidates = element.getElementsByTagName("*");
    var len = candidates.length;

    for (var i = 0; i < len; i++){
        if (qq.hasClass(candidates[i], className)){
            result.push(candidates[i]);
        }
    }
    return result;
};
