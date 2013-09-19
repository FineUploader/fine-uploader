(function() {
    var match = /(\{.*\})/.exec(document.body != null ? document.body.innerHTML : "");
    if (match) {
        parent.postMessage(match[1], '*');
    }
}());
