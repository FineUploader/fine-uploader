if (window.postMessage) {
    describe('iframe.xss.response', function () {

        var iframe, doc;
        var script = '<scr' + 'ipt type="text/javascript" src="/base/client/js/iframe.xss.response.js"></scr' + 'ipt>';
        if (window.mochaResults) {
            script = '<scr' + 'ipt type="text/javascript" src="/client/js/iframe.xss.response.js"></scr' + 'ipt>';
        }

        beforeEach(function () {
            iframe = document.createElement('iframe');
            iframe.setAttribute('id', 'iframe-fixture');
            iframe.setAttribute('src', 'java' + String.fromCharCode(115) + 'cript:false;');
            $("#mocha-fixture").append(iframe);
            doc = iframe.contentWindow || iframe.contentDocument;
            if (doc.document) {
                doc = doc.document;
            }
        });

        afterEach(function () {
            $("#iframe-fixture").remove();
            doc = null;
            $(window).off('message');
        });

        it('#913 - Correctly parses JSON nested more than 1 level (simple)', function (done) {
            var stuff = JSON.stringify({ hello: 'world', my: 'name', is: 'mark' });

            $(window).on('message', function (event) {
                var data = event.originalEvent.data;
                assert.equal(data, stuff);
                done();
            });

            doc.open();
            doc.write(stuff + script);
            doc.close();
        });

        it('#913 - Correctly parses JSON nested more than 1 level (deep)', function (done) {
            var stuff = JSON.stringify({ hello: { my: 'name', is: { mark: '?' }}, foo: 'bar'});

            $(window).on('message', function (event) {
                var data = event.originalEvent.data;
                assert.equal(data, stuff);
                done();
            });

            doc.open();
            doc.write(stuff + script);
            doc.close();
        });

        it('#913 - Correctly parses JSON nested more than 1 level (test case)', function (done) {
            var stuff = '{"images":{"id":2}, "uuid":"bla"}';

            $(window).on('message', function (event) {
                var data = event.originalEvent.data;
                assert.equal(data, stuff);
                done();
            });

            doc.open();
            doc.write(stuff + script);
            doc.close();
        });

    });
}
