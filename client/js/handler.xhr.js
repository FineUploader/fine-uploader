/**
 * Class for uploading files using xhr
 * @inherits qq.UploadHandlerAbstract
 */
qq.UploadHandlerXhr = function(o){
    qq.UploadHandlerAbstract.apply(this, arguments);

    this._files = [];
    this._xhrs = [];

    // current loaded size in bytes for each file
    this._loaded = [];
};

// @inherits qq.UploadHandlerAbstract
qq.extend(qq.UploadHandlerXhr.prototype, qq.UploadHandlerAbstract.prototype)

qq.extend(qq.UploadHandlerXhr.prototype, {
    /**
     * Adds file to the queue
     * Returns id to use with upload, cancel
     **/
    add: function(file){
        if (!(file instanceof File)){
            throw new Error('Passed obj in not a File (in qq.UploadHandlerXhr)');
        }

        return this._files.push(file) - 1;
    },
    getName: function(id){
        var file = this._files[id];
        // fix missing name in Safari 4
        //NOTE: fixed missing name firefox 11.0a2 file.fileName is actually undefined
        return (file.fileName !== null && file.fileName !== undefined) ? file.fileName : file.name;
    },
    getSize: function(id){
        var file = this._files[id];
        return file.fileSize != null ? file.fileSize : file.size;
    },
    /**
     * Returns uploaded bytes for file identified by id
     */
    getLoaded: function(id){
        return this._loaded[id] || 0;
    },
    isValid: function(id) {
        return this._files[id] !== undefined;
    },
    reset: function() {
        qq.UploadHandlerAbstract.prototype.reset.apply(this, arguments);
        this._files = [];
        this._xhrs = [];
        this._loaded = [];
    },
    /**
     * Sends the file identified by id to the server
     */
    _upload: function(id){
        var file = this._files[id],
            name = this.getName(id),
            size = this.getSize(id),
            self = this,
            url = this._options.endpoint,
            protocol = this._options.demoMode ? "GET" : "POST",
            xhr, formData, paramName, key, params;

        this._options.onUpload(id, this.getName(id), true);

        this._loaded[id] = 0;

        xhr = this._xhrs[id] = new XMLHttpRequest();

        xhr.upload.onprogress = function(e){
            if (e.lengthComputable){
                self._loaded[id] = e.loaded;
                self._options.onProgress(id, name, e.loaded, e.total);
            }
        };

        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4){
                self._onComplete(id, xhr);
            }
        };

        params = this._options.paramsStore.getParams(id);

        //build query string
        if (!this._options.paramsInBody) {
            params[this._options.inputName] = name;
            url = qq.obj2url(params, this._options.endpoint);
        }

        xhr.open(protocol, url, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(name));
        xhr.setRequestHeader("Cache-Control", "no-cache");
        if (this._options.forceMultipart || this._options.paramsInBody) {
            formData = new FormData();

            if (this._options.paramsInBody) {
                qq.obj2FormData(params, formData);
            }

            formData.append(this._options.inputName, file);
            file = formData;
        } else {
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            //NOTE: return mime type in xhr works on chrome 16.0.9 firefox 11.0a2
            xhr.setRequestHeader("X-Mime-Type", file.type);
        }

        for (key in this._options.customHeaders){
            if (this._options.customHeaders.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, this._options.customHeaders[key]);
            }
        }

        this.log('Sending upload request for ' + id);
        xhr.send(file);
    },
    _onComplete: function(id, xhr){
        "use strict";
        // the request was aborted/cancelled
        if (!this._files[id]) { return; }

        var name = this.getName(id);
        var size = this.getSize(id);
        var response; //the parsed JSON response from the server, or the empty object if parsing failed.

        this._options.onProgress(id, name, size, size);

        this.log("xhr - server response received for " + id);
        this.log("responseText = " + xhr.responseText);

        try {
            if (typeof JSON.parse === "function") {
                response = JSON.parse(xhr.responseText);
            } else {
                response = eval("(" + xhr.responseText + ")");
            }
        } catch(error){
            this.log('Error when attempting to parse xhr response text (' + error + ')', 'error');
            response = {};
        }

        if (xhr.status !== 200 || !response.success){
            if (this._options.onAutoRetry(id, name, response, xhr)) {
                return;
            }
        }

        this._options.onComplete(id, name, response, xhr);

        this._xhrs[id] = null;
        this._dequeue(id);
    },
    _cancel: function(id){
        this._options.onCancel(id, this.getName(id));

        this._files[id] = null;

        if (this._xhrs[id]){
            this._xhrs[id].abort();
            this._xhrs[id] = null;
        }
    }
});
