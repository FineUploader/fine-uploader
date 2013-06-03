pavlov.specify("util.js", function() {

    // isObject
    describe('isObject', function() {

        it('should return true for an empty Object', function() {
            ok(qq.isObject({})); 
        });

        it('should return true for a simple Object', function () {
            ok(qq.isObject({ foo: 'bar' }));
        });

        it('should return true for a newed up Object', function() {
            ok(qq.isObject(new Object())); 
        });

        it('should return false for a function', function () {
            ok(!qq.isObject(function(){})); 
        });

        it('should return false for null', function () {
            ok(!qq.isObject(null));
        });

        it('should return false for an array', function () {
            ok(!qq.isObject([]));
        });

        it('should return undefined for an undefined', function () {
            equal(qq.isObject(undefined), undefined);
        });
    });

    // isFunction
    describe('isFunction', function () {

        it ('should return true for an empty simple function', function () {
            ok(qq.isFunction(function() {}));
        });

        it('should return false for an Object', function () {
            ok(!qq.isFunction({})); 
        });
    });

    // isArray
    describe('isArray', function () {
        it('should return true for an empty array', function () {
            ok(qq.isArray([]));
        });

        it('should return true for a basic array', function () {
            ok(qq.isArray([1, "foo", { herp: "derp" }]));
        });
        
        it('should return false for a string', function () {
            ok(!qq.isArray("Herp derp"));
        });

    });

    // isString
    describe('isString', function () {
        it('should return true for the empty string', function () {
            ok(qq.isString(''));
        });

        it('should return true for a string with characters', function () {
            ok(qq.isString('Herp derp'));
        });
    });

    // trimStr
    describe('trimStr', function () {
        it('can trim around string', function () {
            equal(qq.trimStr(' blah '), 'blah');
        });

        it('can trim after string', function () {
            equal(qq.trimStr('blah '), 'blah');
        });

        it('can trim before string', function () {
            equal(qq.trimStr(' blah') , 'blah');
        });

        it('can trim with nothing to trim', function () {
            equal(qq.trimStr('blah'), 'blah');
        });

        it('can trim a string with many spaces everywhere', function () {
            equal(qq.trimStr('bl a h'), 'bl a h');
        });

        it('can trim the empty string', function () {
            equal(qq.trimStr(''), '');
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

        before(function () {
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
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four, testy.four);
            deepEqual(new_testy.five, testy.five);
        });

        it('can extend nested objects', function () {
            var new_testy = qq.extend(testy, four_1, true);
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four.a, testy.four.a);
            deepEqual(new_testy.four.b, testy.four.b);
            deepEqual(new_testy.four.c, testy.four.c);
        });

        it('can extend non-nested objects', function () {
            var new_testy = qq.extend(testy, four_2);
            deepEqual(new_testy.one, testy.one);
            deepEqual(new_testy.two, testy.two);
            deepEqual(new_testy.three, testy.three);
            deepEqual(new_testy.four.d, testy.four.d);
        });

    });


    // indexOf
    describe('indexOf', function () {
            var obj = {},
                arr = [];

        before(function () {
            obj = { foo: 'bar' };
            arr = ['a', obj, 3];
        });

        it('should return true for a string that is present', function () {
            equal(qq.indexOf(arr, 'a'), 0);
        });

        it('should return true for an object that is present', function () {
            equal(qq.indexOf(arr, obj), 1);
        });

        it('should return true for a number that is present', function () {
            equal(qq.indexOf(arr, 3), 2);
        });

        it('should return false for an object that is not present due to strict equals', function () {
            equal(qq.indexOf(arr, { foo: 'bar' }), -1);
        });

        it('should return false for an object that is not present at all', function () {
            equal(qq.indexOf(arr, 4), -1);
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
                notEqual(bucket[i], last);
                last = bucket[i];
            }
        });
    });


    // each
    describe('each', function () {
        
        it('should provide value and iteration count ', function () {
            qq.each([0, 1, 2], function (i, num) {
                equal(i, num);
            });
        });

        it('can allow iterating over objects', function () {
            var answers = [];
            var obj = { one: 1, two: 2, three: 3 };
            obj.constructor.prototype.four = 4;

            qq.each(obj, function (key, value) { answers.push(key); });
            equal(answers.join(', '), 'one, two, three');

            var answers = [];
            qq.each(obj, function (key, value) { answers.push(value); });
            equal(answers.join(', '), '1, 2, 3');
        });

        it('can handle a null properly', function () {
            var answers = 0;
            qq.each(null, function () { ++answers; });
            equal(0, answers);
        });

    });

    // bind
    describe('bind', function () {
        
        var context, func;

        before(function () {
            context = { foo: 'bar' };
            func = function (arg) { return 'foo: ' + (this.foo || arg); };
        });

        it('can bind a function to a context', function () {
            var bound = qq.bind(func, context);
            equal(bound(), 'foo: bar');
        });

        it('can bind without a context', function () {
            var bound = qq.bind(func, null, 'bar');
            equal(bound(), 'foo: bar');
        });

        it('can bind a function to 0, empty string, and false', function () {
            var func = function (ctx, msg) { equal(this, ctx, msg); };
            qq.bind(func, 0, 0)();
            qq.bind(func, '', '')();
            qq.bind(func, false, false)();
        });

    });

    // obj2url
    describe('obj2url', function () {
        var baseUrl, urlWithEncodedPath, params1, params2, params3, params4;

        before(function () {
            baseUrl = 'http://mydomain.com/upload';
            urlWithEncodedPath = 'http://mydomain.com/upload%20me';
            params1 = { one: 'one', two: 'two', three: 'three' };
            params2 = { a: 'this is a test' };
            params3 = { a : { b: 'innerProp' }};
            params4 = { a: function () { return 'funky'; }};
        });

        it('can construct a URL with a basic object as param', function () {
            var varUrl = qq.obj2url(params2, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a'), 'this is a test');
        });

        it('can construct a URL with a basic object as params', function () {
            var varUrl = qq.obj2url(params1, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('one'), 'one');
            equal(controlUrl.param('two'), 'two');
            equal(controlUrl.param('three'), 'three');
        });

        it('can construct a URL with an embedded object as a param value', function () {
            var varUrl = qq.obj2url(params3, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a').b, 'innerProp');
        });

        it('can construct a URL with a function as a param value', function () {
            var varUrl = qq.obj2url(params4, baseUrl);
            var controlUrl = purl(varUrl);

            equal(controlUrl.param('a'), 'funky');
        });

        it('can construct an empty URL with params', function () {
            var varUrl = qq.obj2url(params1, '');
            equal(varUrl, 'one=one&two=two&three=three');
        });

        it('will leave encoded paths alone', function () {
            var varUrl = qq.obj2url(params1, urlWithEncodedPath);
            var regex = new RegExp('^' + urlWithEncodedPath);
            ok(varUrl.match(regex));
        });
    });


    // obj2FormData
    describe('obj2FormData', function () {
        
        var formData, params1, params2, params3;
        before(function () {
            
            formData = function () {
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

            params1 = { one: 'one', two: 'two', three: 'three' };
            params2 = { a : { b: 'innerProp' }};
            params3 = { a: function () { return 'funky'; }};
        });

        after(function () {
            formData.clear();
        });

        it('can construct a URL with a basic object as param', function () {
            equal(
                qq.obj2FormData(params1, formData).get('one'), 'one');
            equal(
                qq.obj2FormData(params1, formData).get('two'), 'two');
            equal(
                qq.obj2FormData(params1, formData).get('three'), 'three');
        });

        it('can construct a URL with an embedded object as param', function () {
            equal(qq.obj2FormData(params2, formData).get('a[b]'), 'innerProp');
        });

        it('can construct a URL with a function as param', function () {
            equal(qq.obj2FormData(params3, formData).get('a'), 'funky');
        });
    });

    // obj2Inputs
    describe('obj2Inputs', function () {
       
        var params1, params2, params3;
        before(function () {
            params1 = { one: 'one', two: 'two', three: 'three' };
            params2 = { a : { b: 'innerProp' }};
            params3 = { a: function () { return 'funky'; }};
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
            deepEqual(qq.parseJson(json), parsedJson); 
        });
    });

    // isFileOrInput
    // @TODO: This is going to need some sort of DOM manipulation to work.
    describe('isFileOrInput', function () {
    
        var file1, frame1, frame2, window1, window2;
    
        after(function () {
            delete file, frame1, frame2, window1, window2; 
        });

        before(function () {
          $fixture.append("<iframe id='window1'></iframe>");
          $fixture.append("<iframe id='window2'></iframe>");
        });

        it('should return true when comparing a File object created in another window', function () {
            
            console.log($fixture);
            window1 = $fixture.find("#window1")[0];
            window2 = $fixture.find("#window2")[0];

            file1 = window1.contentWindow.File;
            ok(qq.isFileOrInput(file1));
        });

        // it('should return false on a regular input element', function () {
        //     //$('#fixture').append("<input id='bar'/>");
        //     var input = document.createElement('input');
        //     input.id('bar');
        //     ok(!qq.isFileOrInput(input), "must be a file input");
        // });
    
        // it('should return true for a file-input field', function () {
        //     var input = document.createElement('input');
        //     input.id('bar2');
        //     input.type('file');
        //     ok(qq.isFileOrInput(input), "this is a file input");
        // 
        // });
    
        // it('should return false on a div element', function () {
        //     var input = document.createElement('div');
        //     input.id('foo');
        //     ok(!qq.isFileOrInput(input), "div is not an input");
        // });
     
    });
    // isInput
    // describe('isInput', function () {
    //     var fixture = $("#fixture");
    // 
    //     beforeEach(function () {
    //         fixture.empty();
    //     });
    // 
    //     it('should return true on an input element', function () {
    //         $('#fixture').append("<input id='foo' type='file'></input>");
    //         var el = $("#foo")[0];
    //         ok(qq.isInput(el), "inputs are inputs");
    //     });
    // 
    //     it('should return false on a div', function () {
    //         $("#fixture").append("<div id='foo'></div>");
    //         var el = $('#foo')[0];
    //         ok(!qq.isInput(el), "divs are not inputs");
    //     });
    // 
    //     after(function () {
    //         $("#fixture").empty(); 
    //     });
    // });
     
    // isBlob
    // describe('isBlob', function () {
    //     
    //     it('should identify BLOBs', function () {
    //     if (window.Blob) {
    //         var b = new window.Blob();
    //         assert(qq.isBlob(b));
    //     } else {
    //         assert.isUndefined(windw.Blob); 
    //     } 
    //     });
    // });
});
//});
