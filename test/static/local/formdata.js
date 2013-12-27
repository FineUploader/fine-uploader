/* globals assert, qq */
function mockFormData() {
    "use strict";

    function FormData() {
        this.fake = true;
        this.boundary = "--------FormData" + Math.random();
        this.fields = {};
    }

    FormData.prototype.append = function(key, value) {
        if (this.fields[key] === undefined) {
            this.fields[key] = value;
        }
        else {
            assert.ok(false, "Duplicate field name appended!");
        }
    };

    FormData.prototype.toString = function() {
        var boundary = this.boundary;
        var body = "";
        qq.each(this.fields, function(field, value) {
            body += "--" + boundary + "\r\n";
            // file upload
            if (value.name) {
                var file = field[1];
                body += "Content-Disposition: form-data; name=\""+ field +"\"; filename=\""+ file.name +"\"\r\n";
                body += "Content-Type: "+ file.type +"\r\n\r\n";
                body += file.getAsBinary() + "\r\n";
            } else {
                body += "Content-Disposition: form-data; name=\""+ field +"\";\r\n\r\n";
                body += value + "\r\n";
            }
        });
        body += "--" + boundary +"--";
        return body;
    };

    if (window.FormData) {
        FormData.oldFormData = window.FormData;
    }

    window.FormData = FormData;
}

function unmockFormData() {
    "use strict";

    if (window.FormData && window.FormData.oldFormData) {
        window.FormData = window.FormData.oldFormData;
    }
}
