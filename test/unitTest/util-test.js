module("utility functions");

test("qq.isObject", function() {
    ok(qq.isObject({}), "empty simple object parameter");
    ok(qq.isObject({foo: 'bar'}), true, "non-empty simple object parameter");
    ok(qq.isObject(new Object()), "newed up Object parameter");
    equal(qq.isObject(function(){}), false, "function parameter");
    equal(qq.isObject(null), false, "null parameter");
    equal(qq.isObject([]), false, "array parameter");
    equal(qq.isObject(document.getElementsByTagName('body')), false, "object subclass parameter");
    equal(qq.isObject(undefined, false, "undefined parameter"));
});

test("qq.isFunction", function() {
    ok(qq.isFunction(function(){}), "empty simple function");
    equal(qq.isFunction({}), false, "an object is not a function");
});

test("qq.trimStr", function() {
    equal(qq.trimStr(" blah "), "blah", "trim string test 1");
    equal(qq.trimStr("blah "), "blah", "trim string test 2");
    equal(qq.trimStr(" blah"), "blah", "trim string test 3");
    equal(qq.trimStr("blah"), "blah", "trim string test 4");
    equal(qq.trimStr("bl a h"), "bl a h", "trim string test 5");
    equal(qq.trimStr(""), "", "trim string test 6");
});

test("qq.isFileOrInput", function() {
    $('#qunit-fixture').append("<div id='foo'></div>");
    $('#qunit-fixture').append("<input id='bar'/>");
    $('#qunit-fixture').append("<input id='bar2' type='file'/>");

    var el = $('#foo')[0],
        el2 = $('#bar')[0],
        el3 = $('#bar2')[0];

    ok(!qq.isFileOrInput(el), "div is not an input");
    ok(!qq.isFileOrInput(el2), "must be a file input");
    ok(qq.isFileOrInput(el3), "this is a file input");

});

test("qq.extend", function() {
    var o1 = {one: "one", two: "two", three: "three", four: {a: "a", b: "b"}};

    qq.extend(o1, {five: "five"});
    ok(o1.one === "one" && o1.two === "two" && o1.three === "three" && o1.four.a === "a" && o1.four.b === "b" && o1.five === "five", "simple extend");

    qq.extend(o1, {four: {c: "c"}}, true);
    ok(o1.one === "one" && o1.two === "two" && o1.three === "three" && o1.four.a === "a" && o1.four.b === "b" && o1.four.c === "c" && o1.five === "five", "nested extend");

    qq.extend(o1, {four: {d: "d"}});
    ok(o1.one === "one" && o1.two === "two" && o1.three === "three" && o1.four.d === "d" && o1.five === "five", "non-nested extend");
});

test("qq.indexOf", function() {
    var obj = {two: "foo"};
    var a1 = ["one", obj, 3];

    equal(qq.indexOf(a1, "one"), 0, "string (present)");
    equal(qq.indexOf(a1, obj), 1, "object (present)");
    equal(qq.indexOf(a1, 3), 2, "number (present)");
    equal(qq.indexOf(a1, {two: "foo"}), -1, "object (not present due to strict equals requirement)");
    equal(qq.indexOf(a1, 4), -1, "not present");
});

test("qq.getUniqueId", function() {
    var id1 = qq.getUniqueId();
    var id2 = qq.getUniqueId();
    var id3 = qq.getUniqueId();

    ok(id1 !== id2, "lame uniqueness test 1");
    ok(id1 !== id3, "lame uniqueness test 2");
    ok(id2 !== id3, "lame uniqueness test 3");
});

test("qq().attach", 1, function() {
    var detacher = qq($('#qunit-fixture')[0]).attach("click", function() {
        ok(true, "click handler");
    });

    $('#qunit-fixture').click();
    detacher();
    $('#qunit-fixture').click();
});

test("qq().insertBefore", function() {
    $('#qunit-fixture').append("<div id='foo'></div>");
    var b = $('#foo')[0];
    var a = $("<div id='bar'></div>")[0];
    qq(a).insertBefore(b);

    ok($(b).prev().is(a), "does a come before b?");
});

test("qq().remove", function() {
    var el = $('#qunit-fixture').append("<div id='foo'></div>");
    qq($('#foo')[0]).remove();

    ok($("#foo").length === 0, "does foo still exist?");
});

test("qq().contains", function() {
    $("#qunit-fixture").append("<div id='qqcontains'></div>");

    ok(qq($("#qunit-fixture")[0]).contains($("#qqcontains")[0]), "qqcontains should exist under qunit");
    equal(qq($("#qunit-fixture")[0]).contains($("body")[0]), false, "body should not exist under qunit");
});

test("qq.toElement", function() {
    var el = qq.toElement("<div id='foo'></div>");

    ok($(el).attr('id') === 'foo', "element should have an id of foo");
    ok($(el).is('div'), "element should be a div");
});

test("qq().css", function() {
    $("#qunit-fixture").append("<div id='qqcss'></div>");
    qq($('#qqcss')[0]).css({display: 'none'});

    ok($("#qqcss:visible").length === 0, "qqcss should be hidden");
});

test("qq().hasClass", function(){
    $("#qunit-fixture").append("<div id='qqhasclass' class='qqhasclass'></div>");

    ok(qq($("#qqhasclass")[0]).hasClass("qqhasclass"), "qqhasclass should have qqhasclass as a class");
});

test("qq().addClass", function() {
    $('#qunit-fixture').append('<div></div>');
    var $el = $('div', '#qunit-fixture');
    qq($el[0]).addClass("addclasstest");

    ok($el.hasClass('addclasstest'), 'qq.addClass should actually add classes');
});

test("qq().removeClass", function() {
    $('#qunit-fixture').append('<div class="foobar"></div>');
    var $el = $('.foobar', '#qunit-fixture');
    qq($el[0]).removeClass('foobar');

    ok(!$el.hasClass('foobar'), "qq.removeClass should be able to remove classes");
});

test("qq().setText", function() {
    $('#qunit-fixture').append('<div></div>');
    var $el = $('div', '#qunit-fixture');
    qq($el[0]).setText("this is a test");

    equal($el.text(), "this is a test", "qq.setText should be able to set an element's text");
});

test("qq().children", function() {
    $('#qunit-fixture').append('<div class="child"></div>').append('<div class="child"></div>');

    var children = qq($("#qunit-fixture")[0]).children();
    equal(children.length, 2, "there should be exactly 2 children");
    ok($(children[0]).hasClass("child") && $(children[1]).hasClass("child"), "both children should have a 'child' class");
});

test("qq().getByClass", function() {
    $('#qunit-fixture').append('<div class="foobar"></div>');

    var returnedEl = qq(document).getByClass('foobar');
    equal(returnedEl.length, 1, "getByClass should only return one element in this case");
    ok($('.foobar').is(returnedEl[0]), "getByClass should return the correct element");
});

test("qq.obj2url", function() {
    var baseUrl = "http://mydomain.com/upload";
    var urlWithEncodedPath = "http://mydomain.com/upload%20me";
    var params = {one: "one", two: "two", three: "three"};
    var params2 = {a: "this is a test"};
    var params3 = {a: {b: 'innerProp'}};
    var params4 = {a: function() {return "funky";}};

    var baseUrlWithParams = qq.obj2url(params, baseUrl);
    var parsedUrlWithParams = $.url(baseUrlWithParams);
    equal(parsedUrlWithParams.param('one'), "one", "checking first param, 1st url");
    equal(parsedUrlWithParams.param('two'), "two", "checking second param, 1st url");
    equal(parsedUrlWithParams.param('three'), "three", "checking third param, 1st url");

    var baseUrlWithParams2 = qq.obj2url(params2, baseUrl);
    var parsedUrlWithParams2 = $.url(baseUrlWithParams2);
    equal(parsedUrlWithParams2.param('a'), "this is a test", "checking first param, 2nd url");

    var baseUrlWithParams3 = qq.obj2url(params3, baseUrl);
    var parsedUrlWithParams3 = $.url(baseUrlWithParams3);
    equal(parsedUrlWithParams3.param('a').b, 'innerProp', 'checking a param with an object as a value');

    var baseUrlWithParams4 = qq.obj2url(params4, baseUrl);
    var parsedUrlWithParams4 = $.url(baseUrlWithParams4);
    equal(parsedUrlWithParams4.param('a'), 'funky', 'checking a param with a function as a value');

    var emptyUrlWithParams = qq.obj2url(params, "");
    equal(emptyUrlWithParams, "one=one&two=two&three=three", 'test w/ empty url');

    var urlWithEncodedPathResult = qq.obj2url(params, urlWithEncodedPath);
    ok(urlWithEncodedPathResult.match("^" + urlWithEncodedPath), "ensure encoded paths are left alone");
});

test("qq.obj2FormData", function() {
    var formData = function() {
        var data = {};
        return {
            append: function(key, val) {
                data[decodeURIComponent(key)] = decodeURIComponent(val);
            },
            get: function(key) {
                return data[key];
            },
            clear: function() {
                data = [];
            }
        };
    }()

    var params = {one: "one", two: "two", three: "three"};
    var params2 = {a: {b: 'innerProp'}};
    var params3 = {a: function() {return "funky"}};

    equal(qq.obj2FormData(params, formData).get('one'), 'one', "simple params");
    equal(qq.obj2FormData(params, formData).get('two'), 'two', "simple params");
    equal(qq.obj2FormData(params, formData).get('three'), 'three', "simple params");

    formData.clear();
    equal(qq.obj2FormData(params2, formData).get('a[b]'), 'innerProp', "nested objects");

    formData.clear();
    equal(qq.obj2FormData(params3, formData).get('a'), 'funky', "function param");
});

test("qq.obj2Inputs", function() {
    var params = {one: "one", two: "two", three: "three"};
    var params2 = {a: {b: 'innerProp'}};
    var params3 = {a: function() {return "funky"}};

    $('#qunit-fixture').append('<form id="obj2Inputs"></form>');
    var $form = $('#obj2Inputs');

    qq.obj2Inputs(params, $form[0]);
    equal($form.find('input[name="one"]').val(), 'one', 'simple params');
    equal($form.find('input[name="two"]').val(), 'two', 'simple params');
    equal($form.find('input[name="three"]').val(), 'three', 'simple params');

    $form.empty();
    qq.obj2Inputs(params2, $form[0]);
    var inputName = 'a[b]';
    equal($form.find('input[name="' + inputName + '"]').val(), 'innerProp', "nested objects");

    $form.empty();
    qq.obj2Inputs(params3, $form[0]);
    equal($form.find('input[name="a"]').val(), 'funky', 'function param');
});

test("qq.DisposeSupport", 2, function() {
    var disposer = new qq.DisposeSupport();
    disposer.addDisposer(function() {
        ok(true, "disposer 1");
    });

    disposer.addDisposer(function() {
        ok(true, "disposer 2");
    });

    disposer.dispose();
});

test("qq().hide()", function() {
    ok($('#qunit-fixture').is(':visible'), "ensure fixture is initially visible");
    qq($('#qunit-fixture')[0]).hide();
    ok($('#qunit-fixture').is(':hidden'), "ensure fixture has been hidden by qq.hide");
});

test("cookies", function() {
    var cookieName1 = "qq|cookieName1",
        cookieVal1 = "cookieVal1",
        cookieName2 = "qq|cookieName2",
        cookieVal2 = "cookieVal2";

    qq.setCookie(cookieName1, cookieVal1, 1);
    qq.setCookie(cookieName2, cookieVal2, 1);

    equal(qq.getCookie(cookieName1), cookieVal1, "set & get simple cookie value - 1");
    equal(qq.getCookie(cookieName2), cookieVal2, "set & get simple cookie value - 2");

    var matchingCookieNames = qq.getCookieNames(/^qq\|cookieName/);
    equal(matchingCookieNames.length, 2, "get cookie names based on regexp");
    equal(matchingCookieNames[0], cookieName1, "getCookieName using regexp - 1");
    equal(matchingCookieNames[1], cookieName2, "getCookieName using regexp - 2");

    qq.deleteCookie(cookieName1);
    equal(qq.getCookie(cookieName1), undefined, "delete cookie value - 1");
    qq.deleteCookie(cookieName2);
    equal(qq.getCookie(cookieName2), undefined, "delete cookie value - 2");
});
