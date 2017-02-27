(function() {
    document.querySelector('.tag-chooser').addEventListener('submit', function(event) {
        event.preventDefault()
        var version = event.target.elements['tag'].value
        if (version.trim()) {
            window.location.href = '/tag/' + version
        }
    })
}())
