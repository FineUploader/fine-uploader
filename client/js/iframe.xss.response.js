(function() {
    var match = /(\{.+\}{0})/.exec(document.body.innerHTML);
    if (match) {
        parent.postMessage(match[0], '*');
    }
}());
