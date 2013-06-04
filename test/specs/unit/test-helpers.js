
var helpme = (function () {
    var obj = {};
    var createBlob, createFile;

    obj.createBlob = function (data, contentType) {
        return new Blob(data, contentType);
    }; 

    obj.createFile = function (data) {
        if (!qq.isBlob(data))
            data = obj.createBlob(data);     

        var reader = new FileReader();
        reader.onload = function (event) {
                 
        };
        reader.readAsText(data);
    }

    return obj;
});
