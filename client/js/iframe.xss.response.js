function readIframeResponse(stuff) {
    var re = /(\{.*\})/;
    return re.exec(stuff);
}
(function () {
    var response = readIframeResponse(document.body.innerHTML);
    if (response) {
        parent.postMessage(response[1], '*');
    }
}());
