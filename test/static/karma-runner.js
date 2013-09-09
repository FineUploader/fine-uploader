/* Global beforeEach for mocha unit tests */
var $fixture;
beforeEach(function() {
    $fixture = $("<div id='mocha-fixture'></div>");
    $fixture.appendTo('body');
    return $fixture;
});

afterEach(function () {
    $fixture.empty();
    return $fixture.remove();
});
