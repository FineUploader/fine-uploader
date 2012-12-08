/**
 * Class for uploading files using form and iframe
 * @inherits qq.UploadHandlerAbstract
 */
qq.UploadHandlerForm = function(o){
    qq.UploadHandlerAbstract.apply(this, arguments);

    this._inputs = {};
    this._detach_load_events = {};
};
// @inherits qq.UploadHandlerAbstract
qq.extend(qq.UploadHandlerForm.prototype, qq.UploadHandlerAbstract.prototype);

qq.extend(qq.UploadHandlerForm.prototype, {
    add: function(fileInput){
        fileInput.setAttribute('name', this._options.inputName);
        var id = qq.getUniqueId();

        this._inputs[id] = fileInput;

        // remove file input from DOM
        if (fileInput.parentNode){
            qq(fileInput).remove();
        }

        return id;
    },
    getName: function(id){
        // get input value and remove path to normalize
        return this._inputs[id].value.replace(/.*(\/|\\)/, "");
    },
    isValid: function(id) {
        return this._inputs[id] !== undefined;
    },
    reset: function() {
        qq.UploadHandlerAbstract.prototype.reset.apply(this, arguments);
        this._inputs = {};
        this._detach_load_events = {};
    },
    _cancel: function(id){
        this._options.onCancel(id, this.getName(id));

        delete this._inputs[id];
        delete this._detach_load_events[id];

        var iframe = document.getElementById(id);
        if (iframe){
            // to cancel request set src to something else
            // we use src="javascript:false;" because it doesn't
            // trigger ie6 prompt on https
            iframe.setAttribute('src', 'javascript:false;');

            qq(iframe).remove();
        }
    },
    _upload: function(id){
        this._options.onUpload(id, this.getName(id), false);
        var input = this._inputs[id];

        if (!input){
            throw new Error('file with passed id was not added, or already uploaded or cancelled');
        }

        var fileName = this.getName(id);

        var iframe = this._createIframe(id);
        var form = this._createForm(iframe, this._options.paramsStore.getParams(id));
        form.appendChild(input);

        var self = this;
        this._attachLoadEvent(iframe, function(){
            self.log('iframe loaded');

            var response = self._getIframeContentJSON(iframe);

            // timeout added to fix busy state in FF3.6
            setTimeout(function(){
                self._detach_load_events[id]();
                delete self._detach_load_events[id];
                qq(iframe).remove();
            }, 1);

            if (!response.success) {
                if (self._options.onAutoRetry(id, fileName, response)) {
                    return;
                }
            }
            self._options.onComplete(id, fileName, response);
            self._dequeue(id);
        });

        this.log('Sending upload request for ' + id);
        form.submit();
        qq(form).remove();

        return id;
    },
    _attachLoadEvent: function(iframe, callback){
        var self = this;
        this._detach_load_events[iframe.id] = qq(iframe).attach('load', function(){
            self.log('Received response for ' + iframe.id);

            // when we remove iframe from dom
            // the request stops, but in IE load
            // event fires
            if (!iframe.parentNode){
                return;
            }

            try {
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
            }
            catch (error) {
                //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
                self.log('Error when attempting to access iframe during handling of upload response (' + error + ")", 'error');
            }

            callback();
        });
    },
    /**
     * Returns json object received by iframe from server.
     */
    _getIframeContentJSON: function(iframe){
        //IE may throw an "access is denied" error when attempting to access contentDocument on the iframe in some cases
        try {
            // iframe.contentWindow.document - for IE<7
            var doc = iframe.contentDocument ? iframe.contentDocument: iframe.contentWindow.document,
                response;

            var innerHTML = doc.body.innerHTML;
            this.log("converting iframe's innerHTML to JSON");
            this.log("innerHTML = " + innerHTML);
            //plain text response may be wrapped in <pre> tag
            if (innerHTML && innerHTML.match(/^<pre/i)) {
                innerHTML = doc.body.firstChild.firstChild.nodeValue;
            }
            response = eval("(" + innerHTML + ")");
        } catch(error){
            this.log('Error when attempting to parse form upload response (' + error + ")", 'error');
            response = {success: false};
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
        var protocol = this._options.demoMode ? "GET" : "POST",
            form = qq.toElement('<form method="' + protocol + '" enctype="multipart/form-data"></form>'),
            url = this._options.endpoint;

        if (!this._options.paramsInBody) {
            url = qq.obj2url(params, this._options.endpoint);
        }
        else {
            qq.obj2Inputs(params, form);
        }

        form.setAttribute('action', url);
        form.setAttribute('target', iframe.name);
        form.style.display = 'none';
        document.body.appendChild(form);

        return form;
    }
});
