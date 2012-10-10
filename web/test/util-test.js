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

test("qq.attach", 1, function() {
    var detacher = qq.attach($('#qunit-fixture')[0], "click", function() {
        ok(true, "click handler");
    });

    $('#qunit-fixture').click();
    detacher();
    $('#qunit-fixture').click();
});

test("qq.insertBefore", function() {
    var a = $('#qunit-fixture').append("<div id='foo'></div>")[0];
    var b = $("<div id='bar'></div>")[0];
    qq.insertBefore(b, a);

    ok($(a).prev().is(b), "does b come before a?");
});

test("qq.remove", function() {
    var el = $('#qunit-fixture').append("<div id='foo'></div>");
    qq.remove($('#foo')[0]);

    ok($("#foo").length === 0, "does foo still exist?");
});

test("qq.contains", function() {
    $("#qunit-fixture").append("<div id='qqcontains'></div>");

    ok(qq.contains($("#qunit-fixture")[0], $("#qqcontains")[0]), "qqcontains should exist under qunit");
    equal(qq.contains($("#qunit-fixture")[0], $("body")[0]), false, "body should not exist under qunit");
});

test("qq.toElement", function() {
    var el = qq.toElement("<div id='foo'></div>");

    ok($(el).attr('id') === 'foo', "element should have an id of foo");
    ok($(el).is('div'), "element should be a div");
});

test("qq.css", function() {
    $("#qunit-fixture").append("<div id='qqcss'></div>");
    qq.css($('#qqcss')[0], {display: 'none'});

    ok($("#qqcss:visible").length === 0, "qqcss should be hidden");
});

test("qq.hasClass", function(){
    $("#qunit-fixture").append("<div id='qqhasclass' class='qqhasclass'></div>");

    ok(qq.hasClass($("#qqhasclass")[0], "qqhasclass"), "qqhasclass should have qqhasclass as a class");
});
