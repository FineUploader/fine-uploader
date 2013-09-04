describe('iframe.xss.response', function () {

    before(function () {
        $('body').append("<script id='iframe-xss-response' src='temp/iframe.xss.response.js'></script>");
    });

    after(function () {
        $("#iframe-xss-response").remove();
    });

    it('#913 - Has matching regex for JSON nested more than 1 level', function () {
       var simpleStuff, deepStuff, match;

       simpleStuff = JSON.stringify({ hello: 'world', my: 'name', is: 'mark' });
       match = readIframeResponse(simpleStuff);
       assert.equal(match[1], simpleStuff);

       deepStuff = JSON.stringify({ hello: { my: 'name', is: { mark: '?' }}, foo: 'bar'});
       match = readIframeResponse(deepStuff);
       assert.ok(match[1], deepStuff);

       moarStuff = '{"images":{"id":2}, "uuid":"bla"}';
       match = readIframeResponse(moarStuff);
       assert.ok(match[1], moarStuff);
    });

});
