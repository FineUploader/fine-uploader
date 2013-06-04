$(function () { 
    var $fixture = $("#qunit-fixture");
    
    // // isObject
    module('isObject')

        test('should return true for an empty Object', function() {
            ok(qq.isObject({})); 
        });

        test('should return true for a simple Object', function () {
            ok(qq.isObject({ foo: 'bar' }));
        });

        test('should return true for a newed up Object', function() {
            ok(qq.isObject(new Object())); 
        });

        test('should return false for a function', function () {
            ok(!qq.isObject(function(){})); 
        });

        test('should return false for null', function () {
            ok(!qq.isObject(null));
        });

        test('should return false for an array', function () {
            ok(!qq.isObject([]));
        });

        test('should return undefined for an undefined', function () {
            ok(!qq.isObject(undefined));
        });

    // isFunction
    module('isFunction')

        test ('should return true for an empty simple function', function () {
            ok(qq.isFunction(function() {}));
        });

        test('should return false for an Object', function () {
            ok(!qq.isFunction({})); 
        });

    // isArray
    module('isArray') 
        test('should return true for an empty array', function () {
            ok(qq.isArray([]));
        });

        test('should return true for a basic array', function () {
            ok(qq.isArray([1, "foo", { herp: "derp" }]));
        });
        
        test('should return false for a string', function () {
            ok(!qq.isArray("Herp derp"));
        });

    // isString
    module('isString') 
         test('should return true for the empty string', function () {
             ok(qq.isString(''));
         });

         test('should return true for a string wtesth characters', function () {
             ok(qq.isString('Herp derp'));
         });

    // trimStr
    module('trimStr')
         test('can trim around string', function () {
             equal(qq.trimStr(' blah '), 'blah');
         });

         test('can trim after string', function () {
             equal(qq.trimStr('blah '), 'blah');
         });

         test('can trim before string', function () {
             equal(qq.trimStr(' blah'), 'blah');
         });

         test('can trim wtesth nothing to trim', function () {
             equal(qq.trimStr('blah'), 'blah');
         });

         test('can trim a string wtesth many spaces everywhere', function () {
             equal(qq.trimStr('bl a h'), 'bl a h');
         });

         test('can trim the empty string', function () {
             equal(qq.trimStr(''), '');
         });

    // extend
    module('extend')
    
        test('can extend simple objects', function () {
            var testy = 
                {   one: 'one', 
                    two: 'two', 
                    three: 'three', 
                    four: {
                            a: 'a',
                            b: 'b'
                }};

            var five = { five: 'five' };
            var four_1 = { four: { c: 'c' }};
            var four_2 = { four: { d: 'd' }};
            var new_testy = qq.extend(testy, five)
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four, testy.four);
            deepEqual(new_testy.five, testy.five);
        });

        test('can extend nested objects', function () {
            var testy = 
                {   one: 'one', 
                    two: 'two', 
                    three: 'three', 
                    four: {
                            a: 'a',
                            b: 'b'
                }};

            var five = { five: 'five' };
            var four_1 = { four: { c: 'c' }};
            var four_2 = { four: { d: 'd' }};
            var new_testy = qq.extend(testy, four_1, true);
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four.a, testy.four.a);
            deepEqual(new_testy.four.b, testy.four.b);
            deepEqual(new_testy.four.c, testy.four.c);
        });

        test('can extend non-nested objects', function () {
            var testy = 
                {   one: 'one', 
                    two: 'two', 
                    three: 'three', 
                    four: {
                            a: 'a',
                            b: 'b'
                }};

            var five = { five: 'five' };
            var four_1 = { four: { c: 'c' }};
            var four_2 = { four: { d: 'd' }};
            var new_testy = qq.extend(testy, four_2);
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four.d, testy.four.d);
        });


    // indexOf
    module('indexOf')

        test('should return true for a string that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 'a'), 0);
        });

        test('should return true for an object that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, obj), 1);
        });

        test('should return true for a number that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 3), 2);
        });

        test('should return false for an object that is not present due to strict equals', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, { foo: 'bar' }), -1);
        });

        test('should return false for an object that is not present at all', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 4), -1);
        });

    // getUniqueId
    module('getUniqueId')
        
        test('should not collide for 10000 generations', function () {
            var bucket = [];
            // generate a bucket of 1000 unique ids
            for (var i = 0; i < 10000; i++) {
                bucket[i] = qq.getUniqueId();
            }

            // check for duplicates
            bucket.sort();
            var last = bucket[0];
            for (var i = 1; i < bucket.length; i++) {
                notEqual(bucket[i], last);
                last = bucket[i];
            }
        });

    // each
    module('each')
        
        test('should provide value and testeration count ', function () {
            qq.each([0, 1, 2], function (i, num) {
                equal(i, num);
            });
        });

        test('can allow testerating over objects', function () {
            var answers = [];
            var obj = { one: 1, two: 2, three: 3 };
            obj.constructor.prototype.four = 4;

            qq.each(obj, function (key, value) { answers.push(key); });
            equal(answers.join(', '), 'one, two, three');

            var answers = [];
            qq.each(obj, function (key, value) { answers.push(value); });
            equal(answers.join(', '), '1, 2, 3');
        });

        test('can handle a null properly', function () {
            var answers = 0;
            qq.each(null, function () { ++answers; });
            equal(0, answers);
        });

    // bind
    module('bind')
        
        test('can bind a function to a context', function () {
            var context = { foo: 'bar' };
            var func = function (arg) { return 'foo: ' + (this.foo || arg); };
            var bound = qq.bind(func, context);
            equal(bound(), 'foo: bar');
        });

        test('can bind wtesthout a context', function () {
            var context = { foo: 'bar' };
            var func = function (arg) { return 'foo: ' + (this.foo || arg); };
            var bound = qq.bind(func, null, 'bar');
            equal(bound(), 'foo: bar');
        });

        // test('can bind a function to 0, empty string, and false', function () {});

    // obj2url
    module('obj2url')

        test('can construct a URL wtesth a basic object as param', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params2, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a'), 'this is a test');
        });

        test('can construct a URL wtesth a basic object as params', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params1, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('one'), 'one');
            equal(controlUrl.param('two'), 'two');
            equal(controlUrl.param('three'), 'three');
        });

        test('can construct a URL wtesth an embedded object as a param value', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params3, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a').b, 'innerProp');
        });

        test('can construct a URL wtesth a function as a param value', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params4, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a'), 'funky');
        });

        test('can construct an empty URL wtesth params', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params1, '');
            equal(varUrl, 'one=one&two=two&three=three');
        });

        test('will leave encoded paths alone', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params1, urlWtesthEncodedPath);
            var regex = new RegExp('^' + urlWtesthEncodedPath);
            ok(varUrl.match(regex));
        });


    // obj2FormData
    module('obj2FormData', {
        setup: function() {
        },
        teardown: function () {
        }});
        

        test('can construct a URL wtesth a basic object as param', function () {
            var formData = function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        return (data = []);
                    }
                };
            }();

            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a : { b: 'innerProp' }};
            var params3 = { a: function () { return 'funky'; }};
            equal(qq.obj2FormData(params1, formData).get('one'), 'one');
            equal(qq.obj2FormData(params1, formData).get('two'), 'two');
            equal(qq.obj2FormData(params1, formData).get('three'), 'three');

            formData.clear(); 
        });

        test('can construct a URL wtesth an embedded object as param', function () {
            var formData = function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        return (data = []);
                    }
                };
            }();
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a : { b: 'innerProp' }};
            var params3 = { a: function () { return 'funky'; }};
            equal(qq.obj2FormData(params2, formData).get('a[b]'), 'innerProp');
        });

        test('can construct a URL wtesth a function as param', function () {
            var formData = function () {
                var data = {};
                return {
                    append: function (k, v) {
                        data[decodeURIComponent(k)] = decodeURIComponent(v);
                    },
                    get: function (k) {
                        return data[k];
                    },
                    clear: function() {
                        return (data = []);
                    }
                };
            }();
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a : { b: 'innerProp' }};
            var params3 = { a: function () { return 'funky'; }};
            equal(qq.obj2FormData(params3, formData).get('a'), 'funky');
        });

    // obj2Inputs
    module('obj2Inputs', { 
        setup: function () { 
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a : { b: 'innerProp' }};
            var params3 = { a: function () { return 'funky'; }};
    }});
       
    // testing get/set/delete cookie(s)
    module('cookies')

        test('can perform CRUD on a cookie', function () {
            var cookie_name1 = 'qq|cookieName1';
            var cookie_val1 = 'cookieVal1';

            var cookie_name2 = 'qq|cookieName2';
            var cookie_val2 = 'cookieVal2';
        
            qq.setCookie(cookie_name1, cookie_val1, 1);
            qq.setCookie(cookie_name2, cookie_val2, 1);

            equal(qq.getCookie(cookie_name1), cookie_val1);
            equal(qq.getCookie(cookie_name2), cookie_val2);

            var matchingCookieNames = qq.getCookieNames(/^qq\|cookieName/).sort();
            equal(matchingCookieNames.length, 2);
            equal(matchingCookieNames[0], cookie_name1);
            equal(matchingCookieNames[1], cookie_name2);

            qq.deleteCookie(cookie_name1);
            equal(qq.getCookie(cookie_name1), undefined);
            qq.deleteCookie(cookie_name2);
            equal(qq.getCookie(cookie_name2), undefined);
        });

    // parseJson
    module('parseJSON')

        test('can parse JSON', function () {
            var object = { a: 'a', b: 'b'};
            var json = JSON.stringify(object)
            var parsedJson = JSON.parse(json);
            deepEqual(qq.parseJson(json), parsedJson); 
        });

    // isFileOrInput
    // @TODO: This is going to need some sort of DOM manipulation to work.
    module('isFileOrInput')

        test('should return true when comparing a File object created in another window', function () {
            $fixture.append("<iframe id='window1'></iframe>");
            $fixture.append("<iframe id='window2'></iframe>");

            var window1 = $fixture.find("#window1")[0];
            var window2 = $fixture.find("#window2")[0];

            var file1 = window1.contentWindow.File;
            ok(qq.isFileOrInput(file1));
        });

        test('should return false on a regular input element', function () {
            var $input = $fixture.append("<input id='bar'></input>");
            ok(!qq.isFileOrInput($input[0]), "must be a file input");
        });
    
        test('should return true for a file-input field', function () {
            var $input = $fixture.append("<input id='bar2' type='file'></input>");
            ok(qq.isFileOrInput($input[0]), "this is a file input");
        });
    
        test('should return false on a div element', function () {
            var $input = $fixture.append("<div id='foo'></div>");
            ok(!qq.isFileOrInput($input[0]), "div is not an input");
        });
    
    // isInput
    module('isInput')
    
        test('should return true on an input element', function () {

            $fixture.append("<input id='foo' type='file'></input>");
            var el = $("#foo")[0];
            ok(qq.isInput(el), "inputs are inputs");
        });
    
        test('should return false on a div', function () {
            $fixture.append("<div id='foo'></div>");
            var el = $('#foo')[0];
            ok(!qq.isInput(el), "divs are not inputs");
        });
    
    
    // isBlob
    module('isBlob')
        
        test('should identify BLOBs', function () {
            if (window.Blob) {
                var b = new window.Blob();
                ok(qq.isBlob(b));
            } else {
                ok.isUndefined(windw.Blob); 
            } 
        });
});
