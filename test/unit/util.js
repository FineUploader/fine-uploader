$(function () { 
    
    module('Util')

        test('hide - should hide an element.', function () {
            var el, $el, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = qq($el[0]);
            
            notEqual($el.css('display'), 'none');
            el.hide();
            equal($el.css('display'), 'none');
        });

        // test('attach - should attach an event to an element.', 1, function () {
        //     var el, $el, $fixture;
        //     $fixture = $("#qunit-fixture");
        //     $fixture.append("<div id='foo'></div>");
        //     $el = $fixture.find("#foo");
        //     el = $el[0];
        //     console.log($el[0]);
        //     
        //     qq(el).attach('click', function () {
        //         ok(true);
        //     });  
        //     // $el.click(function () {
        //     //     ok(true);
        //     // });

        //     //$el.trigger('click');
        //     $el.click();
        // });

        test('detach - should detach an event from an element.', function () {
            expect(0);
            var el, $el, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            $el = $fixture.find("#foo");
            el = qq($el[0]);

            var detacher = el.attach('click', function () {
                ok(false);
            });
            detacher();
            
            $el.trigger('click');
        }); 

        test('contains - should return true if the element contains itself', function () {
            var $fixture, $el, el;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            $el = $fixture.find("#foo");
            el = $el[0];
            ok(qq(el).contains(el));
        });

        test('contains - should return true if the element contains the descendant', function () {
            var $fixture, $el, el;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            $el = $fixture.find("#foo");
            el = $el[0];
            ok(qq($fixture[0]).contains(el));
        });

        test('contains - should return false if the element does not contain the descendant', function () {
            var $fixture, $el, el;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            $el = $fixture.find("#bar");
            el = $el[0];
            ok(!qq($fixture[0]).contains(el));
        });

        test('contains - #887 account for IE7 bug in Node.contains which results in an error', function () {
            var $fixture, el, el;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");

            $el = $fixture.find("#foo");
            el = $el[0];
            equal(qq(el).contains(null), false, 
                  "should return false when passed a `null` parameter");
            equal(qq(el).contains(undefined), false, 
                  "should return false when passed an `undefined` parameter");
        })

        test('insertBefore', function () {
            var el, $el, elB, $elB, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            $elB = $("#foo");
            elB = $elB[0];
            
            $el = $("<div/>").html("<div id='bar'></div>").contents();
            el = $el[0];

            // insert `el` before `elB`
            qq(el).insertBefore(elB);
            
            ok($fixture.find("#bar").length > 0);
        });

        test('remove', function () {
            var el, $el, elB, $elB, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            
            $el = $fixture.find("#foo");
            $el.append("<div id='bar'></div>");
            el = $el[0];

            $elB = $el.find("#bar");
            elB = $elB[0];

            qq(el).remove(elB);
            equal($fixture.find("#bar").length, 0);
        });

        // test('css', function () {
        //     var el, $el, $fixture;
        //     $fixture = $("#qunit-fixture");
        //     $fixture.append("<div id='foo'></div>");

        //     $el = $fixture.find("#foo");
        //     el = qq($el[0]);

        //     //qq(el).css({ display: 'block' });
        //     el.css({ display: 'block' });
        //     equal($("#foo").css('display'), 'block');

        //     el.css({ display: 'inline' });
        //     equal($("#foo").css('display'), 'inline');

        //     // @TODO: bug here?
        //     el.css({ float: 'left' });
        //     equal($("#foo").css('display'), 'inline');
        //     equal($("#foo").css('float'), 'left');
        //     //equal($("#foo").css('display'), 'inline');
        //     //equal($("#foo").css('float'), 'left');

        // });

        test('hasClass', function () {
            var el = document.createElement('div');
            $(el).addClass('derp');
            ok(qq(el).hasClass('derp'));

            ok(!qq(el).hasClass("Derp"));
        });

        test('addClass', function () {
            var el = document.createElement('div');     
            qq(el).addClass('derp');
            ok($(el).hasClass('derp'));
        });

        test('removeClass', function () {
            var el = document.createElement('div');
            $(el).addClass('derp');
            qq(el).removeClass('derp');
            ok(!$(el).hasClass('derp'));
        });

        test('getByClass', function () {
            var $fixture, results, expected;
            results = []
            $fixture = $("#qunit-fixture");
            var q = qq($fixture[0]);
            $fixture.append("<div class='foo'></div>");
            $fixture.append("<div class='bar'></div>");
            $fixture.append("<div class='foo bar'></div>");

            results = q.getByClass("foo");
            equal(results.length, 2);

            results = q.getByClass("bar");
            equal(results.length, 2);

            // results = q.getByClass("foo bar");
            // equal(results.length, 1);
        });

        test('children', function () {
            var $fixture, results, expected;
            results = []
            $fixture = $("#qunit-fixture");
            var q = qq($fixture[0]);
            $fixture.append("<div class='foo'></div>");
            $fixture.append("<div class='bar'></div>");
            $fixture.append("<div class='foo bar'></div>");
             
            results = q.children();
            equal(results.length, 3)
        });

        test('setText', function () {
            var el = document.createElement('p');
            qq(el).setText("Herp Derp");
            equal($(el).text(), "Herp Derp");
        });

        test('clearText', function () {
            var el = document.createElement('p');
            $(el).text("Herp Derp");
            qq(el).clearText();
            equal($(el).text(), "")
        });

        test('isObject - should return true for an empty Object', function() {
            ok(qq.isObject({})); 
        });

        test('isObject - should return true for a simple Object', function () {
            ok(qq.isObject({ foo: 'bar' }));
        });

        test('isObject - should return true for a newed up Object', function() {
            /* jshint -W010 */
            ok(qq.isObject(new Object())); 
        });

        test('isObject - should return false for a function', function () {
            ok(!qq.isObject(function(){})); 
        });

        test('isObject - should return false for null', function () {
            ok(!qq.isObject(null));
        });

        test('isObject - should return false for an array', function () {
            ok(!qq.isObject([]));
        });

        test('isObject - should return undefined for an undefined', function () {
            ok(!qq.isObject(undefined));
        });

        test ('isFunction - should return true for an empty simple function', function () {
            ok(qq.isFunction(function() {}));
        });

        test('isFunction - should return false for an Object', function () {
            ok(!qq.isFunction({})); 
        });

    // isArray
        test('isArray - should return true for an empty array', function () {
            ok(qq.isArray([]));
        });

        test('isArray - should return true for a basic array', function () {
            ok(qq.isArray([1, "foo", { herp: "derp" }]));
        });
        
        test('isArray - should return false for a string', function () {
            ok(!qq.isArray("Herp derp"));
        });

    // isString
         test('isString - should return true for the empty string', function () {
             ok(qq.isString(''));
         });

         test('isString - should return true for a string wtesth characters', function () {
             ok(qq.isString('Herp derp'));
         });

    // trimStr
         test('trimStr - can trim around string', function () {
             equal(qq.trimStr(' blah '), 'blah');
         });

         test('trimStr - can trim after string', function () {
             equal(qq.trimStr('blah '), 'blah');
         });

         test('trimStr - can trim before string', function () {
             equal(qq.trimStr(' blah'), 'blah');
         });

         test('trimStr - can trim wtesth nothing to trim', function () {
             equal(qq.trimStr('blah'), 'blah');
         });

         test('trimStr - can trim a string wtesth many spaces everywhere', function () {
             equal(qq.trimStr('bl a h'), 'bl a h');
         });

         test('trimStr - can trim the empty string', function () {
             equal(qq.trimStr(''), '');
         });

        test('isFile - can detect and identify a file if possible', function () {
            try {
                ok(qq.isFile(new File()));
            } catch (ex) {
                ok(!qq.supportedFeatures.supportsUploader);    
            }
        });

        test("isFile - can detect and identify an input of type file", function () {
            var input, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<input id='foo' type='file'></input>");
            input = $fixture.find("#foo")[0]
            ok(qq.isInput(input));
            ok(qq.isFileOrInput(input));
        });

    // extend
        test('extend - can extend simple objects', function () {
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

        test('extend - can extend nested objects', function () {
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

        test('extend - can extend non-nested objects', function () {
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
        test('indexOf - should return true for a string that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 'a'), 0);
        });

        test('indexOf - should return true for an object that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, obj), 1);
        });

        test('indexOf - should return true for a number that is present', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 3), 2);
        });

        test('indexOf - should return false for an object that is not present due to strict equals', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, { foo: 'bar' }), -1);
        });

        test('indexOf - should return false for an object that is not present at all', function () {
            var obj = { foo: 'bar' };
            var arr = ['a', obj, 3];
            equal(qq.indexOf(arr, 4), -1);
        });

    // getUniqueId
        test('getUniqueId - should not collide for 10000 generations', function () {
            var bucket = [];
            // generate a bucket of 1000 unique ids
            for (var i = 0; i < 10000; i++) {
                bucket[i] = qq.getUniqueId();
            }

            // check for duplicates
            bucket.sort();
            var last = bucket[0];
            for (var j = 1; j < bucket.length; j++) {
                notEqual(bucket[j], last);
                last = bucket[j];
            }
        });

    // each
        test('each - should provide value and testeration count ', function () {
            qq.each([0, 1, 2], function (i, num) {
                equal(i, num);
            });
        });

        test('each - can allow testerating over objects', function () {
            var answers = [];
            var obj = { one: 1, two: 2, three: 3 };
            obj.constructor.prototype.four = 4;

            qq.each(obj, function (key, value) { answers.push(key); });
            equal(answers.join(', '), 'one, two, three');

            answers = [];
            qq.each(obj, function (key, value) { answers.push(value); });
            equal(answers.join(', '), '1, 2, 3');
        });

        test('each - can handle a null properly', function () {
            var answers = 0;
            qq.each(null, function () { ++answers; });
            equal(0, answers);
        });

    // bind
        test('bind - can bind a function to a context', function () {
            var context = { foo: 'bar' };
            var func = function (arg) { return 'foo: ' + (this.foo || arg); };
            var bound = qq.bind(func, context);
            equal(bound(), 'foo: bar');
        });

        test('bind - can bind wtesthout a context', function () {
            var context = { foo: 'bar' };
            var func = function (arg) { return 'foo: ' + (this.foo || arg); };
            var bound = qq.bind(func, null, 'bar');
            equal(bound(), 'foo: bar');
        });

        // test('can bind a function to 0, empty string, and false', function () {});

    // obj2url
        test('obj2url - can construct a URL wtesth a basic object as param', function () {
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

        test('obj2url - can construct a URL wtesth a basic object as params', function () {
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

        test('obj2url - can construct a URL wtesth an embedded object as a param value', function () {
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

        test('obj2url - can construct a URL wtesth a function as a param value', function () {
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

        test('obj2url - can construct an empty URL wtesth params', function () {
            var baseUrl = 'http://mydomain.com/upload';
            var urlWtesthEncodedPath = 'http://mydomain.com/upload%20me';
            var params1 = { one: 'one', two: 'two', three: 'three' };
            var params2 = { a: 'this is a test' };
            var params3 = { a : { b: 'innerProp' }};
            var params4 = { a: function () { return 'funky'; }};
            var varUrl = qq.obj2url(params1, '');
            equal(varUrl, 'one=one&two=two&three=three');
        });

        test('obj2url - will leave encoded paths alone', function () {
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
        test('obj2formdata - can construct a URL wtesth a basic object as param', function () {
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

        test('obj2formdata - can construct a URL wtesth an embedded object as param', function () {
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

        test('obj2formdata - can construct a URL wtesth a function as param', function () {
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
       
        // testing get/set/delete cookie(s)
        test('cookies - can perform CRUD on a cookie', function () {
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
        test('parseJSON - can parse JSON', function () {
            var object = { a: 'a', b: 'b'};
            var json = JSON.stringify(object)
            var parsedJson = JSON.parse(json);
            deepEqual(qq.parseJson(json), parsedJson); 
        });


        // test("should work for a browser supporting the File API", function () {
        //     var blob, file, reader;
        //     try {
        //         blob = new Blob([1, 2, 3, 4, 5, 6, 7, 8], { type: 'application/octet-binary' });
        //         reader = new FileReader();
        //         file = reader.readAsBinaryString(blob);
        //         ok(qq.isFile(file));
        //     } catch (ex) {
        //        ok(true);  
        //     }
        // });
        
        // test('should return true when comparing a File object created in another window', function () {
        //     var frame1, frame2, file1, file2;
        //     $fixture.append("<iframe id='frame1'></iframe>");
        //     $fixture.append("<iframe id='frame2'></iframe>");

        //     frame1 = $fixture.find("#frame1")[0];
        //     frame2 = $fixture.find("#frame2")[0];

        //     try {
        //         file1 = new frame1.contentWindow.File;
        //         file2 = new frame2.contentWindow.File;

        //         file1.onload(function () {
        //              
        //         })
        //     } catch (ex) {
        //         ok(true);
        //     }

        //     ok(qq.isFile(file1));
        //     ok(qq.isFile(file2));
        // });

    // isFileOrInput
    // @TODO: This is going to need some sort of DOM manipulation to work.
        test('isFileOrInput - should return false on a regular input element', function () {
            var $input, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<input id='bar'></input>");
            $input = $fixture.find("#bar");
            ok(!qq.isFileOrInput($input[0]), "must be a file input");
        });
    
        test('isFileOrInput - should return true for a file-input field', function () {
            var $input, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<input id='bar2' type='file'></input>");
            $input = $fixture.find("#bar2");
            ok(qq.isFileOrInput($input[0]), "this is a file input");
        });
    
        test('isFileOrInput - should return false on a div element', function () {
            var $input, $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            $input = $fixture.find("#foo");
            ok(!qq.isFileOrInput($input[0]), "div is not an input");
        });
    
    // isInput
        test('isInput - should return true on an input element', function () {
            var $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<input id='foo' type='file'></input>");
            var el = $("#foo")[0];
            ok(qq.isInput(el), "inputs are inputs");
        });
    
        test('isInput - should return false on a div', function () {
            var $fixture;
            $fixture = $("#qunit-fixture");
            $fixture.append("<div id='foo'></div>");
            var el = $('#foo')[0];
            ok(!qq.isInput(el), "divs are not inputs");
        });
    
    // isBlob
        test('isBlob - should identify BLOBs', function () {
            try { 
                var blob = new Blob([1, 2, 3, 4, 5, 6, 7, 8], { type: 'application/octet-binary' });
                ok(qq.isBlob(blob));
            } catch (ex) {
                ok(true);                 
            }
        });

        // Dispose Support
        // @TODO: modularize
        test("DisposeSupport - should add disposers and dispose of them", function () {
            var disposer = new qq.DisposeSupport(); 
            disposer.addDisposer(function () {
                ok(true); 
            });

            disposer.dispose();
        });

        // test("DisposeSupport - should attach event handler and register de-attacher as disposer", function () {
        //     var $fixture, $el, el, disposer;
        //     disposer = new qq.DisposeSupport();
        //     $fixture = $("#qunit-fixture");
        //     el = document.createElement('div');
        //     $fixture.append(el);

        //     disposer.attach(el, 'click', function () { ok(true); });
        //     $(el).click();
        // });
});
