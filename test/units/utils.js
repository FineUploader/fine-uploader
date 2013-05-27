var assert = chai.assert
  , expect = chai.expect;

// isObject
describe('isObject', function() {

    it('should return true for an empty Object', function() {
        assert.isTrue(qq.isObject({})); 
    });

    it('should return true for a simple Object', function () {
        assert.isTrue(qq.isObject({ foo: 'bar' }));
    });

    it('should return true for a newed up Object', function() {
        assert.isTrue(qq.isObject(new Object())); 
    });

    it('should return false for a function', function () {
        assert.isFalse(qq.isObject(function(){})); 
    });

    it('should return false for null', function () {
        assert.isFalse(qq.isObject(null));
    });

    it('should return false for an array', function () {
        assert.isFalse(qq.isObject([]));
    });

    it('should return false for an undefined', function () {
        assert.isFalse(qq.isObject(undefined));
    });
});

describe('isFunction', function () {
    it ('should return true for an empty simple function', function () {
        assert.isTrue(qq.isFunction(function() {}));
    });

    it('should return false for an Object', function () {
        assert.isFalse(qq.isFunction({})); 
    });
});

describe('isArray', function () {
    it('should return true for an empty array', function () {
        assert.isTrue(qq.isArray([]));
    });

    it('should return true for a basic array', function () {
        assert.isTrue(qq.isArray([1, "foo", { herp: "derp" }]));
    });
    
    it('should return false for a string', function () {
        assert.isFalse(qq.isArray("Herp derp"));
    });

});

// isString
describe('isString', function () {
    it('should return true for the empty string', function () {
        assert.isTrue(qq.isString(''));
    });

    it('should return true for a string with characters', function () {
        assert.isTrue(qq.isString('Herp derp'));
    });
});

// trimStr
describe('trimStr', function () {
    it('can trim around string', function () {
        assert.equal(qq.trimStr(' blah '), 'blah');
    });

    it('can trim after string', function () {
        assert.equal(qq.trimStr('blah '), 'blah');
    });

    it('can trim before string', function () {
        assert.equal(qq.trimStr(' blah') , 'blah');
    });

    it('can trim with nothing to trim', function () {
        assert.equal(qq.trimStr('blah'), 'blah');
    });

    it('can trim a string with many spaces everywhere', function () {
        assert.equal(qq.trimStr('bl a h'), 'bl a h');
    });

    it('can trim the empty string', function () {
        assert.equal(qq.trimStr(''), '');
    });

});


// extend
describe('extend', function () {
    /**
    var testy = { 
                    one: 'one',
                    two: 'two',
                    three: 'three',
                    four: { a: 'a', b: 'b' }
                },
        five =  { five: 'five' },
        four_1 = { four: { c: 'c' }},
        four_2 = { four: { d: 'd' }};
    */
   var testy = {},
        five = {},
        four_1 = {},
        four_2 = {};

    beforeEach(function () {
        testy = 
            {   one: 'one', 
                two: 'two', 
                three: 'three', 
                four: {
                        a: 'a',
                        b: 'b'
            }};

        five = { five: 'five' };
        four_1 = { four: { c: 'c' }};
        four_2 = { four: { d: 'd' }};
    });

    it('can extend simple objects', function () {
        var new_testy = qq.extend(testy, five)
        assert.equal(new_testy.one, testy.one);
        assert.equal(new_testy.two, testy.two);
        assert.equal(new_testy.three, testy.three);
        assert.equal(new_testy.four, testy.four);
        assert.equal(new_testy.five, testy.five);
    });

    it('can extend nested objects', function () {
        var new_testy = qq.extend(testy, four_1, true);
        assert.equal(new_testy.one, testy.one);
        assert.equal(new_testy.two, testy.two);
        assert.equal(new_testy.three, testy.three);
        assert.equal(new_testy.four.a, testy.four.a);
        assert.equal(new_testy.four.b, testy.four.b);
        assert.equal(new_testy.four.c, testy.four.c);
    });

    it('can extend non-nested objects', function () {
        var new_testy = qq.extend(testy, four_2);
        assert.equal(new_testy.one, testy.one);
        assert.equal(new_testy.two, testy.two);
        assert.equal(new_testy.three, testy.three);
        assert.equal(new_testy.four.d, testy.four.d);
    });

});


// indexOf
describe('indexOf', function () {
        var obj = {},
            arr = [];

    before(function () {
        obj = { foo: 'bar' };
        arr = ['a', this.obj, 3];
    });

    it('should return true for a string that is present', function () {
        assert.equal(qq.indexOf(arr, 'a'), 0);
    });

    it('should return true for an object that is present', function () {
        assert.equal(qq.indexOf(arr, obj), 1);
    });

    it('should return true for a number that is present', function () {
        assert.equal(qq.indexOf(arr, 3), 2);
    });

    it('should return false for an object that is not present due to strict equals', function () {
        assert.equal(qq.indexOf(arr, { foo: 'bar' }), -1);
    });

    it('should return false for an object that is not present at all', function () {
        assert.equal(qq.indexOf(arr, 4), -1);
    });

});

// getUniqueId
describe('getUniqueId', function () { 
    
    it('should not collide for 10000 generations', function () {
        var bucket = [];
        // generate a bucket of 1000 unique ids
        for (var i = 0; i < 10000; i++) {
            bucket[i] = qq.getUniqueId();
        }

        // check for duplicates
        bucket.sort();
        var last = bucket[0];
        for (var i = 1; i < bucket.length; i++) {
            assert.notEqual(bucket[i], last);
            last = bucket[i];
        }
    });
});


// each
describe('each', function () {
    
    it('should provide value and iteration count ', function () {
        qq.each([0, 1, 2], function (i, num) {
            assert.equal(i, num);
        });
    });

    it('can allow iterating over objects', function () {
        var answers = [];
        var obj = { one: 1, two: 2, three: 3 };
        obj.constructor.prototype.four = 4;

        qq.each(obj, function (key, value) { answers.push(key); });
        assert.equal(answers.join(', '), 'one, two, three');

        var answers = [];
        qq.each(obj, function (key, value) { answers.push(value); });
        assert.equal(answers.join(', '), '1, 2, 3');
    });

    it('can handle a null properly', function () {
        var answers = 0;
        qq.each(null, function () { ++answers; });
        assert.equal(0, answers);
    });

});

// bind
describe('bind', function () {
    
    beforeEach(function () {
        this.context = { foo: 'bar' };
        this.func = function (arg) { return 'foo: ' + (this.foo || arg); };
    });

    it('can bind a function to a context', function () {
        var bound = qq.bind(this.func, this.context);
        assert.equal(bound(), 'foo: bar');
    });

    it('can bind without a context', function () {
        var bound = qq.bind(this.func, null, 'bar');
        assert.equal(bound(), 'foo: bar');
    });

    it('can bind a function to 0, empty string, and false', function () {
        var func = function (ctx, msg) { assert.equal(this, ctx, msg); };
        qq.bind(func, 0, 0)();
        qq.bind(func, '', '')();
        qq.bind(func, false, false)();
    });

});

// obj2url
describe('obj2url', function () {
    before(function () {
        this.baseUrl = 'http://mydomain.com/upload';
        this.urlWithEncodedPath = 'http://mydomain.com/upload%20me';
        this.params1 = { one: 'one', two: 'two', three: 'three' };
        this.params2 = { a: 'this is a test' };
        this.params3 = { a : { b: 'innerProp' }};
        this.params4 = { a: function () { return 'funky'; }};
    });

    it('can construct a URL with a basic object as param', function () {
        var varUrl = qq.obj2url(this.params2, this.baseUrl);
        var controlUrl = $.url(varUrl);

        assert.equal(controlUrl.param('a'), 'this is a test');
    });

    it('can construct a URL with a basic object as params', function () {
        var varUrl = qq.obj2url(this.params1, this.baseUrl);
        var controlUrl = $.url(varUrl);

        assert.equal(controlUrl.param('one'), 'one');
        assert.equal(controlUrl.param('two'), 'two');
        assert.equal(controlUrl.param('three'), 'three');
    });

    it('can construct a URL with an embedded object as a param value', function () {
        var varUrl = qq.obj2url(this.params3, this.baseUrl);
        var controlUrl = $.url(varUrl);

        assert.equal(controlUrl.param('a').b, 'innerProp');
    });

    it('can construct a URL with a function as a param value', function () {
        var varUrl = qq.obj2url(this.params4, this.baseUrl);
        var controlUrl = $.url(varUrl);

        assert.equal(controlUrl.param('a'), 'funky');
    });

    it('can construct an empty URL with params', function () {
        var varUrl = qq.obj2url(this.params1, '');
        assert.equal(varUrl, 'one=one&two=two&three=three');
    });

    it('will leave encoded paths alone', function () {
        var varUrl = qq.obj2url(this.params1, this.urlWithEncodedPath);
        var regex = new RegExp('^' + this.urlWithEncodedPath);
        assert.match(varUrl, regex);
    });
});


// obj2FormData
describe('obj2FormData', function () {
    
    before(function () {
        
        this.formData = function () {
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

        this.params1 = { one: 'one', two: 'two', three: 'three' };
        this.params2 = { a : { b: 'innerProp' }};
        this.params3 = { a: function () { return 'funky'; }};
    });

    after(function () {
        this.formData.clear();
    });

    it('can construct a URL with a basic object as param', function () {
        assert.equal(
            qq.obj2FormData(this.params1, this.formData).get('one'), 'one');
        assert.equal(
            qq.obj2FormData(this.params1, this.formData).get('two'), 'two');
        assert.equal(
            qq.obj2FormData(this.params1, this.formData).get('three'), 'three');
    });

    it('can construct a URL with an embedded object as param', function () {
        assert.equal(qq.obj2FormData(this.params2, this.formData).get('a[b]'), 'innerProp');
    });

    it('can construct a URL with a function as param', function () {
        assert.equal(qq.obj2FormData(this.params3, this.formData).get('a'), 'funky');
    });
});

// obj2Inputs
describe('obj2Inputs', function () {
   
    before(function () {
        this.params1 = { one: 'one', two: 'two', three: 'three' };
        this.params2 = { a : { b: 'innerProp' }};
        this.params3 = { a: function () { return 'funky'; }};
    });

});

// testing get/set/delete cookie(s)
describe('cookies', function () {
        var cookie_name1, cookie_name2,
            cookie_val1,  cookie_val2;

    before(function () {
        cookie_name1 = 'qq|cookieName1';
        cookie_val1 = 'cookieVal1';

        cookie_name2 = 'qq|cookieName2';
        cookie_val2 = 'cookieVal2';
    });

    it('can perform CRUD on a cookie', function () {
        qq.setCookie(cookie_name1, cookie_val1, 1);
        qq.setCookie(cookie_name2, cookie_val2, 1);

        assert.equal(qq.getCookie(cookie_name1), cookie_val1);
        assert.equal(qq.getCookie(cookie_name2), cookie_val2);

        var matchingCookieNames = qq.getCookieNames(/^qq\|cookieName/).sort();
        assert.equal(matchingCookieNames.length, 2);
        assert.equal(matchingCookieNames[0], cookie_name1);
        assert.equal(matchingCookieNames[1], cookie_name2);

        qq.deleteCookie(cookie_name1);
        assert.isUndefined(qq.getCookie(cookie_name1));
        qq.deleteCookie(cookie_name2);
        assert.isUndefined(qq.getCookie(cookie_name2));
    });
});

// parseJson
describe('parseJSON', function () {
    var json, parsedJson, object;

    before(function () {
        object = { a: 'a', b: 'b'};
        json = JSON.stringify(object)
        parsedJson = JSON.parse(json);
    }); 

    it('can parse JSON', function () {
        assert.deepEqual(qq.parseJson(json), parsedJson); 
    });
});

// isFileOrInput
// @TODO: This is going to need some sort of DOM manipulation to work.
describe('isFileOrInput', function () {

    beforeEach(function() {
        $('#fixture').empty();
    });

    it('should return false on a regular input element', function () {
        $('#fixture').append("<input id='bar'/>");
        var el = $('#bar')[0];
        assert.isFalse(qq.isFileOrInput(el), "must be a file input");
    });

    it('should return true for a file-input field', function () {
        $('#fixture').append("<input id='bar2' type='file'/>");
        var el = $('#bar2')[0];
        assert.isTrue(qq.isFileOrInput(el), "this is a file input");
    
    });

    it('should return false on a div element', function () {
        $("#fixture").append("<div id='foo'></div>");
        var el = $('#foo')[0];
        assert.isFalse(qq.isFileOrInput(el), "div is not an input");
    });

    after(function () {
        $('#fixture').empty();
    });
});
 
// isInput
describe('isInput', function () {
    var fixture = $("#fixture");

    beforeEach(function () {
        fixture.empty();
    });

    it('should return true on an input element', function () {
        $('#fixture').append("<input id='foo' type='file'></input>");
        var el = $("#foo")[0];
        assert.isTrue(qq.isInput(el), "inputs are inputs");
    });

    it('should return false on a div', function () {
        $("#fixture").append("<div id='foo'></div>");
        var el = $('#foo')[0];
        assert.isFalse(qq.isInput(el), "divs are not inputs");
    });

    after(function () {
        $("#fixture").empty(); 
    });
});
 
// isBlob
describe('isBlob', function () {
    
    it('should identify BLOBs', function () {
    if (window.Blob) {
        var b = new window.Blob();
        assert(qq.isBlob(b));
    } else {
        assert.isUndefined(windw.Blob); 
    } 
    });
});

// isXhrUploadSupported
// @TODO: This is going to need to be tested based on which browser is being used.
// describe('isXhrUploadSupported', function () {
// 
// });
// 
// // isFolderDropSupported
// @TODO: This is going to need to be tested based on which browser is being used.
// describe('isFolderDropSupported', function () {
// 
// });
// 
// // isFileChunkingSupported
// @TODO: This is going to need to be tested based on which browser is being used.
// describe('isFileChunkingSupported', function () {
// 
// });
