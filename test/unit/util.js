/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl, File */
describe("util.js", function () {
    "use strict";

    var el, $el;

    describe("hide", function () {
        it("properly hide an element", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = qq($el[0]);

            //assert.notEqual($el.css(display), "none", "element should not be hidden");
            el.hide();
            assert.equal($el.css("display"), "none", "element should be hidden");
        });
    }); // hide

    describe("detach",function () {
        it("detaches an event from an element", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = qq($el[0]);

            var detacher = el.attach("click", function () {
                return false;
            });

            $el.trigger("click");
        });
    }); // detach

    describe("contains", function () {
        it("returns true if the element contains itself", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = $el[0];

            assert.ok(qq(el).contains(el), "the element should contain itself");
        });

        it("return true if the element contains the descendant", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = $el[0];

            assert.ok(qq($fixture[0]).contains(el), "$el is a descendant of $fixture");
        });

        it("returns false if the element does not contain the descendant", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#bar");
            el = $el[0];

            assert.ok(!qq($fixture[0]).contains(el), "$el is not a descendant of $fixture");
        });

        it("#887 - accounts for IE7 bug in Node.contains", function () {
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = $el[0];

            assert.ok(!qq(el).contains(null), "should return false when passed a `null` parameter");
            assert.ok(!qq(el).contains(undefined), "should return false when passed an `undefined` parameter");
        });
    }); // contains

    describe("insertBefore", function () {
        it("inserts an element before another", function () {
            var elB, $elB;

            $elB = $("<div id='foo'></div>").appendTo($fixture);
            elB = $elB[0];

            $el = $("<div/>").html("<div id='bar'></div>").contents();
            el = $el[0];

            // insert `el` before `elB`
            qq(el).insertBefore(elB);

            assert.ok($fixture.find("#bar").length > 0, "should have inserted #bar before #foo");
        });
    }); // insertBefore

    describe("remove", function () {
        it("removes an element from the DOM", function () {
            var elB, $elB;

            $fixture.append("<div id='foo'></div>");

            $el = $fixture.find("#foo");
            $el.append("<div id='bar'></div>");
            el = $el[0];

            $elB = $el.find("#bar");
            elB = $elB[0];

            qq(el).remove(elB);
            assert.equal($fixture.find("#bar").length, 0, "#bar should have been removed");
        });
    });

    describe("hasClass", function () {
        it("asks an element whether it has a class", function () {
            el = document.createElement("div");
            $(el).addClass("derp");

            assert.ok(qq(el).hasClass("derp"), "el should have the 'derp' class");
            assert.ok(!qq(el).hasClass("herp"), "el should not have the class 'herp'");
        });
    }); // hasClass

    describe("addClass", function () {
        it("adds a class to an element", function () {
            el = document.createElement("div");

            assert.ok(!$(el).hasClass("derp"), "element should NOT have the 'derp' class");

            qq(el).addClass("derp");

            assert.ok($(el).hasClass("derp"), "element should have the 'derp' class");
        });
    }); // addClass

    describe("removeClass", function () {
        it("removes a class from an element", function () {
            el = document.createElement("div");
            $(el).addClass("derp");
            qq(el).removeClass("derp");

            assert.ok(!$(el).hasClass("derp"), "class should have been removed from the element");
        });
    }); // hasClass

    describe("getByClass", function () {
        it("gets a list of elements by class", function () {
            var results, q;

            results = [];
            $fixture.empty();
            q = qq($fixture[0]);
            $fixture.append("<div class='foo'></div>");
            $fixture.append("<div class='bar'></div>");
            $fixture.append("<div class='foo bar'></div>");

            results = q.getByClass("foo");

            assert.equal(results.length, 2, "getting the wrong number of classes");

            results = q.getByClass("bar");

            assert.equal(results.length, 2, "getting the wrong number of classes");
        });

    }); // getByClass

    describe("children", function () {
        it("returns a list of children of an element", function () {
            var results, q;

            results = [];
            $fixture.empty();
            q = qq($fixture[0]);
            $fixture.append("<div class='foo'></div>");
            $fixture.append("<div class='bar'></div>");
            $fixture.append("<div class='foo bar'></div>");

            results = q.children();
            assert.equal(results.length, 3, "was expecting 3 children");
        });
    }); // children

    describe("setText", function () {
        it("sets the inner text of an element", function () {
            var text = "Herp Derp";
            el = document.createElement("p");
            qq(el).setText(text);

            assert.equal($(el).text(), text, "text should have been set to " + text);
        });
    }); // setText

    describe("clearText", function () {
        it("clears any text set on an element", function () {
            var text = "Herp Derp";
            el = document.createElement("p");
            qq(el).setText(text);
            qq(el).clearText();

            assert.equal($(el).text(), "", "text was not cleared");
        });
    }); // clearText

    describe("isObject", function () {
        it("returns true for an empty object", function () {
            assert.ok(qq.isObject({}), "empty objects are objects");
        });

        it("returns true for a simple object", function () {
            assert.ok(qq.isObject({ foo: "bar" }), "simple objects are objects");
        });

        it("should return true for a newed up Object", function() {
            /* jshint -W010 */
            assert.ok(qq.isObject(new Object()), "new objects are objects");
        });

        it("should return false for a function", function () {
            assert.ok(!qq.isObject(function(){}), "This is not Ruby. Functions are not objects");
        });

        it("should return false for null", function () {
            assert.ok(!qq.isObject(null), "the null is not an object");
        });

        it("should return false for an array", function () {
            assert.ok(!qq.isObject([]), "arrays are not objects");
        });

        it("should return undefined for an undefined", function () {
            assert.ok(!qq.isObject(undefined), "");
        });
    }); // isObject

    describe("isFunction", function () {
        it ("returns true for an empty simple function", function () {
            assert.ok(qq.isFunction(function() {}));
        });

        it("returns false for an Object", function () {
            assert.ok(!qq.isFunction({}));
        });
    }); // isFunction

    describe("isArray", function () {
        it("returns true for an empty array", function () {
            assert.ok(qq.isArray([]));
        });

        it("returns true for a basic array", function () {
            assert.ok(qq.isArray([1, "foo", { herp: "derp" }]));
        });

        it("returns false for a string", function () {
            assert.ok(!qq.isArray("Herp derp"));
        });

        if (window.Uint8Array) {
            it("returns true for an ArrayBuffer", function() {
                var uint8array = new Uint8Array();
                assert.ok(qq.isArray(uint8array));
            });
        }

    }); // isArray

    // template
    describe("isString", function () {
        it("returns true for the empty string", function () {
            assert.ok(qq.isString(""), "the empty string IS a string");
        });

        it("should return true for a string with characters", function () {
            assert.ok(qq.isString("Herp derp"), "strings are strings");
        });
    }); // isString

    describe("trimStr", function () {
        it("trims around string", function () {
            assert.equal(qq.trimStr(" blah "), "blah");
        });

        it("trims after string", function () {
            assert.equal(qq.trimStr("blah "), "blah");
        });

        it("trims before string", function () {
            assert.equal(qq.trimStr(" blah"), "blah");
        });

        it("trims with nothing to trim", function () {
            assert.equal(qq.trimStr("blah"), "blah");
        });

        it("trimStr - can trim a string with many spaces everywhere", function () {
            assert.equal(qq.trimStr("bl a h"), "bl a h");
        });

        it("trimStr - can trim the empty string", function () {
            assert.equal(qq.trimStr(""), "");
        });
    }); // trimStr

    describe("isInput", function () {
        it("detects and identifies an input of type file", function () {
            var input;

            $fixture.append("<input id='foo' type='file'>");
            input = $fixture.find("#foo")[0];
            assert.ok(qq.isInput(input));
        });
    }); // isInput

    describe("extend", function () {
        it("extends simple objects", function () {
            var testy =
            {   one: "one",
                two: "two",
                three: "three",
                four: {
                    a: "a",
                    b: "b"
                }};

            var five = { five: "five" };
            var four_1 = { four: { c: "c" }};
            var four_2 = { four: { d: "d" }};
            var new_testy = qq.extend(testy, five);
            assert.deepEqual(new_testy.one, testy.one);
            assert.deepEqual(new_testy.two, testy.two);
            assert.deepEqual(new_testy.three, testy.three);
            assert.deepEqual(new_testy.four, testy.four);
            assert.deepEqual(new_testy.five, testy.five);
        });

        it("extends nested objects", function () {
            var testy =
            {   one: "one",
                two: "two",
                three: "three",
                four: {
                    a: "a",
                    b: "b"
                }};

            var five = { five: "five" };
            var four_1 = { four: { c: "c" }};
            var four_2 = { four: { d: "d" }};
            var new_testy = qq.extend(testy, four_1, true);
            assert.deepEqual(new_testy.one, testy.one);
            assert.deepEqual(new_testy.two, testy.two);
            assert.deepEqual(new_testy.three, testy.three);
            assert.deepEqual(new_testy.four.a, testy.four.a);
            assert.deepEqual(new_testy.four.b, testy.four.b);
            assert.deepEqual(new_testy.four.c, testy.four.c);
        });

        it("extends non-nested objects", function () {
            var testy =
            {   one: "one",
                two: "two",
                three: "three",
                four: {
                    a: "a",
                    b: "b"
                }};

            var five = { five: "five" };
            var four_1 = { four: { c: "c" }};
            var four_2 = { four: { d: "d" }};
            var new_testy = qq.extend(testy, four_2);
            assert.deepEqual(new_testy.one, testy.one);
            assert.deepEqual(new_testy.two, testy.two);
            assert.deepEqual(new_testy.three, testy.three);
            assert.deepEqual(new_testy.four.d, testy.four.d);
        });
    }); // extend

    describe("indexOf", function () {
        it("returns true for a string that is present", function () {
            var obj = { foo: "bar" };
            var arr = ["a", obj, 3];
            assert.equal(qq.indexOf(arr, "a"), 0);
        });

        it("returns true for an object that is present", function () {
            var obj = { foo: "bar" };
            var arr = ["a", obj, 3];
            assert.equal(qq.indexOf(arr, obj), 1);
        });

        it("returns true for a number that is present", function () {
            var obj = { foo: "bar" };
            var arr = ["a", obj, 3];
            assert.equal(qq.indexOf(arr, 3), 2);
        });

        it("returns false for an object that is not present due to strict assert.equals", function () {
            var obj = { foo: "bar" };
            var arr = ["a", obj, 3];
            assert.equal(qq.indexOf(arr, { foo: "bar" }), -1);
        });

        it("returns false for an object that is not present at all", function () {
            var obj = { foo: "bar" };
            var arr = ["a", obj, 3];
            assert.equal(qq.indexOf(arr, 4), -1);
        });
    }); // indexOf

    describe("getUniqueId", function () {
        it("no collisions for 10000 generations", function () {
            var bucket = [];
            // generate a bucket of 1000 unique ids
            for (var i = 0; i < 10000; i++) {
                bucket[i] = qq.getUniqueId();
            }

            // check for duplicates
            bucket.sort();
            var last = bucket[0];
            for (var j = 1; j < bucket.length; j++) {
                assert.notEqual(bucket[j], last);
                last = bucket[j];
            }
        });
    }); // getUniqueId

    describe("each", function () {
        it("provides value and iteration count ", function () {
            qq.each([0, 1, 2], function (i, num) {
                assert.equal(i, num);
            });
        });

        it("allows iterating over objects", function () {
            var answers = [];
            var obj = { one: 1, two: 2, three: 3 };

            qq.each(obj, function (key, value) { answers.push(key); });
            assert.equal(answers.join(", "), "one, two, three");

            answers = [];
            qq.each(obj, function (key, value) { answers.push(value); });
            assert.equal(answers.join(", "), "1, 2, 3");
        });

        it("allows iterating over arrays", function () {
            var answers = [];
            var arr = ["one", "two", "three"];

            qq.each(arr, function (key, value) { answers.push(value); });
            assert.equal(answers.join(", "), "one, two, three");
        });

        it("handles a null properly", function () {
            var answers = 0;
            qq.each(null, function () { ++answers; });
            assert.equal(0, answers);
        });

        it("handle strings properly", function() {
            var answers = [];
            var str = "hello!";

            qq.each(str, function (key, value) { answers.push(value); });
            assert.equal(answers.join(", "), "h, e, l, l, o, !");
        });
    }); // each

    describe("bind", function () {
        it("binds a function to a context", function () {
            var context = { foo: "bar" };
            var func = function (arg) { return "foo: " + (this.foo || arg); };
            var bound = qq.bind(func, context);
            assert.equal(bound(), "foo: bar");
        });

        it("binds a function without a context", function () {
            var context = { foo: "bar" };
            var func = function (arg) { return "foo: " + (this.foo || arg); };
            var bound = qq.bind(func, context, "bar");
            assert.equal(bound(), "foo: bar");
        });
    }); // bind

    describe("obj2url", function () {
        it("obj2url - can construct a URL with a basic object as param", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params2, baseUrl);
            var controlUrl = purl(varUrl);

            assert.equal(controlUrl.param("a"), "this is a it");
        });

        it("obj2url - can construct a URL with a basic object as params", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params1, baseUrl);
            var controlUrl = purl(varUrl);

            assert.equal(controlUrl.param("one"), "one");
            assert.equal(controlUrl.param("two"), "two");
            assert.equal(controlUrl.param("three"), "three");
        });

        it("obj2url - can construct a URL with an embedded object as a param value", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params3, baseUrl);
            var controlUrl = purl(varUrl);

            assert.equal(controlUrl.param("a").b, "innerProp");
        });

        it("obj2url - can construct a URL with a function as a param value", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params4, baseUrl);
            var controlUrl = purl(varUrl);

            assert.equal(controlUrl.param("a"), "funky");
        });

        it("obj2url - can construct an empty URL with params", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params1, "");

            assert.equal(varUrl, "one=one&two=two&three=three");
        });

        it("obj2url - will leave encoded paths alone", function () {
            var baseUrl = "http://mydomain.com/upload";
            var urlWithEncodedPath = "http://mydomain.com/upload%20me";
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a: "this is a it" };
            var params3 = { a : { b: "innerProp" }};
            var params4 = { a: function () { return "funky"; }};
            var varUrl = qq.obj2url(params1, urlWithEncodedPath);
            var regex = new RegExp("^" + urlWithEncodedPath);

            assert.ok(varUrl.match(regex));
        });
    }); // obj2url

    describe("obj2FormData", function () {
        it("constructs a URL with a basic object as param", function () {
            var formData = (function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        /* jshint boss:true */
                        return (data = []);
                    }
                };
            }());

            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a : { b: "innerProp" }};
            var params3 = { a: function () { return "funky"; }};

            assert.equal(qq.obj2FormData(params1, formData).get("one"), "one");
            assert.equal(qq.obj2FormData(params1, formData).get("two"), "two");
            assert.equal(qq.obj2FormData(params1, formData).get("three"), "three");

            formData.clear();
        });

        it("constructs a URL with an embedded object as param", function () {
            var formData = (function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        /* jshint boss:true */
                        return (data = []);
                    }
                };
            }());
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a : { b: "innerProp" }};
            var params3 = { a: function () { return "funky"; }};

            assert.equal(qq.obj2FormData(params2, formData).get("a[b]"), "innerProp");
        });

        it("constructs a URL with a function as param", function () {
            var formData = (function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        /* jshint boss:true */
                        return (data = []);
                    }
                };
            }());
            var params1 = { one: "one", two: "two", three: "three" };
            var params2 = { a : { b: "innerProp" }};
            var params3 = { a: function () { return "funky"; }};

            assert.equal(qq.obj2FormData(params3, formData).get("a"), "funky");
        });
    }); // obj2FormData

    describe("parseJson", function () {
        it("parses JSON", function () {
            var object = { a: "a", b: "b"},
                json = JSON.stringify(object),
                parsedJson = JSON.parse(json);

            assert.deepEqual(qq.parseJson(json), parsedJson);
        });
    }); // parseJson

    describe("isFileOrInput", function () {
        it("detects and identifies an input of type file", function () {
            var input;

            $fixture.append("<input id='foo' type='file'>");
            input = $fixture.find("#foo")[0];

            assert.ok(qq.isFileOrInput(input));
        });
        it("returns false on a regular input element", function () {
            var $input;

            $fixture.append("<input id='bar'>");
            $input = $fixture.find("#bar");

            assert.ok(!qq.isFileOrInput($input[0]), "must be a file input");
        });

        it("returns true for a file-input field", function () {
            var $input;

            $fixture.append("<input id='bar2' type='file'>");
            $input = $fixture.find("#bar2");

            assert.ok(qq.isFileOrInput($input[0]), "this is a file input");
        });

        it("isFileOrInput - should return false on a div element", function () {
            var $input;

            $fixture.append("<div id='foo'></div>");
            $input = $fixture.find("#foo");

            assert.ok(!qq.isFileOrInput($input[0]), "div is not an input");
        });
    }); // isFileOrInput

    describe("isInput", function () {
        it("returns true on an input element", function () {
            var $el = $("<input id='foo' type='file'>").appendTo($fixture);
            var el = $el[0];

            assert.ok(qq.isInput(el), "inputs are inputs");
        });

        it("isInput - should return false on a div", function () {
            var $el = $("<div id='foo'></div>").appendTo($fixture);
            var el = $el[0];

            assert.ok(!qq.isInput(el), "divs are not inputs");
        });
    }); //

    describe("getExtension", function() {
        it("extract extension from file when an extension exists", function() {
            var filename = "foo.bar.txt";
            assert.equal(qq.getExtension(filename), "txt");
        });

        it("extract extension from file when an extension does not exist", function() {
            var filename = "foo";
            assert.equal(qq.getExtension(filename), undefined);
        });
    });

    describe("DisposeSupport", function () {
        it("adds disposers and dispose of them", function () {
            var disposer = new qq.DisposeSupport();
            disposer.addDisposer(function () {
                assert.ok(true);
            });

            disposer.dispose();
        });

        it("attaches event handler and register de-attacher as disposer", function () {
            var disposer;
            disposer = new qq.DisposeSupport();
            el = document.createElement("div");
            $fixture.append(el);

            disposer.attach(el, "click", function () { assert.ok(true); });
            $(el).click();
        });
    }); //

    describe("hasAttribute", function() {
        it("should return true if the attribute exists w/ no specified value", function() {
            var el = $("<div test-attr></div>")[0];
            assert.ok(qq(el).hasAttribute("test-attr"));
        });

        it("should return true if the attribute exists w/ anything other than false as the value", function() {
            var el1 = $("<div test-attr=''></div>")[0],
                el2 = $("<div test-attr='foobar'></div>")[0],
                el3 = $("<div test-attr='true'></div>")[0],
                el4 = $("<div test-attr='truefalse'></div>")[0];

            assert.ok(qq(el1).hasAttribute("test-attr"), "empty string test");
            assert.ok(qq(el2).hasAttribute("test-attr"), "not false value test");
            assert.ok(qq(el3).hasAttribute("test-attr"), "true value test");
            assert.ok(qq(el4).hasAttribute("test-attr"), "whole string should be 'false'");

        });

        it("should return false if the attribute does not exist", function() {
            var el = $("<div></div>")[0];
            assert.ok(!qq(el).hasAttribute("test-attr"));
        });

        it("should return false if the value is false", function() {
            var el1 = $("<div test-attr='false'></div>")[0],
                el2 = $("<div test-attr='fAlse'></div>")[0];

            assert.ok(!qq(el1).hasAttribute("test-attr"), "all lowercase false test");
            assert.ok(!qq(el2).hasAttribute("test-attr"), "mixed case false test");
        });
    });

    describe("qq.format", function() {
        it("should format a simple string correctly", function() {
            assert.equal(qq.format("hello {}, how are {}?", "ray", "you"), "hello ray, how are you?");
        });

        it ("should format a string correctly even if it contains  injected values with curly brackets", function() {
            assert.equal(qq.format("hello {}, how are {}?", "{} ray", "you"), "hello {} ray, how are you?");
            assert.equal(qq.format("hello {}, how are {}?", "{} ray{}", "{you}"), "hello {} ray{}, how are {you}?");
        });

        it("should fail gracefully if not enough tokens to replace", function() {
            assert.equal(qq.format("hello {}, how are {}?", "ray"), "hello ray, how are {}?");
        });

        it("should format a string correctly with tokens at start or end", function() {
            assert.equal(qq.format("{} was here {}", "ray", "today"), "ray was here today");
        });

        it("should format a string correctly with non-strings as parameters", function() {
            assert.equal(qq.format("Number: {}, boolean: {}, Object: {}, Array: {}", 1, true, {one: "two"}, [1,2,3]), "Number: 1, boolean: true, Object: [object Object], Array: 1,2,3");
        });
    });

    describe("qq.isFolderDropSupported", function() {
        it("should return false if DataTransfer doesn't contain an items array", function() {
            assert.ok(!qq.isFolderDropSupported({}));
        });

        it("should return false if DataTransfer does contain an items array, but it's empty", function() {
            assert.ok(!qq.isFolderDropSupported({items: []}));
        });
    });
}); // Util

