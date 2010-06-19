test("module without setup/teardown (default)", function() {
	expect(1);
	ok(true);
});

test("expect in test", 3, function() {
	ok(true);
	ok(true);
	ok(true);
});

test("expect in test", 1, function() {
	ok(true);
});

module("setup test", {
	setup: function() {
		ok(true);
	}
});

test("module with setup", function() {
	expect(2);
	ok(true);
});

var state;

module("setup/teardown test", {
	setup: function() {
		state = true;
		ok(true);
	},
	teardown: function() {
		ok(true);
	}
});

test("module with setup/teardown", function() {
	expect(3);
	ok(true);
});

module("setup/teardown test 2");

test("module without setup/teardown", function() {
	expect(1);
	ok(true);
});

if (typeof setTimeout !== 'undefined') {
state = 'fail';

module("teardown and stop", {
	teardown: function() {
		equals(state, "done", "Test teardown.");
	}
});

test("teardown must be called after test ended", function() {
	expect(1);
	stop();
	setTimeout(function() {
		state = "done";
		start();
	}, 13);
});
} // end setTimeout tests

if (typeof asyncTest !== 'undefined') {
module("asyncTest");

asyncTest("asyncTest", function() {
	expect(2);
	ok(true);
	setTimeout(function() {
		state = "done";
		ok(true);
		start();
	}, 13);
});

asyncTest("asyncTest", 2, function() {
	ok(true);
	setTimeout(function() {
		state = "done";
		ok(true);
		start();
	}, 13);
});
} // end asyncTest tests

module("save scope", {
	setup: function() {
		this.foo = "bar";
	},
	teardown: function() {
		same(this.foo, "bar");
	}
});
test("scope check", function() {
	expect(2);
	same(this.foo, "bar");
});

module("simple testEnvironment setup", {
	foo: "bar",
	bugid: "#5311" // example of meta-data
});
test("scope check", function() {
	same(this.foo, "bar");
});
test("modify testEnvironment",function() {
	this.foo="hamster";
});
test("testEnvironment reset for next test",function() {
	same(this.foo, "bar");
});

module("testEnvironment with object", {
	options:{
		recipe:"soup",
		ingredients:["hamster","onions"]
	}
});
test("scope check", function() {
	same(this.options, {recipe:"soup",ingredients:["hamster","onions"]}) ;
});
test("modify testEnvironment",function() {
	// since we do a shallow copy, the testEnvironment can be modified
	this.options.ingredients.push("carrots");
});
test("testEnvironment reset for next test",function() {
	same(this.options, {recipe:"soup",ingredients:["hamster","onions","carrots"]}, "Is this a bug or a feature? Could do a deep copy") ;
});


module("testEnvironment tests");

function makeurl() {
  var testEnv = QUnit.current_testEnvironment;
  var url = testEnv.url || 'http://example.com/search';
  var q   = testEnv.q   || 'a search test';
  return url + '?q='+encodeURIComponent(q);
}

test("makeurl working",function() {
	equals( QUnit.current_testEnvironment, this, 'The current testEnvironment is global');
  equals( makeurl(), 'http://example.com/search?q=a%20search%20test', 'makeurl returns a default url if nothing specified in the testEnvironment');
});

module("testEnvironment with makeurl settings",{
  url:'http://google.com/',
  q:'another_search_test'
});
test("makeurl working with settings from testEnvironment",function() {
  equals( makeurl(), 'http://google.com/?q=another_search_test', 'rather than passing arguments, we use test metadata to form the url');
});
test("each test can extend the module testEnvironment", {
	q:'hamstersoup'
}, function() {
	equals( makeurl(), 'http://google.com/?q=hamstersoup', 'url from module, q from test');	
});

module("jsDump");
test("jsDump output", function() {
	equals( QUnit.jsDump.parse([1, 2]), "[ 1, 2 ]" );
	equals( QUnit.jsDump.parse({top: 5, left: 0}), "{ \"top\": 5, \"left\": 0 }" );
	equals( QUnit.jsDump.parse(document.getElementById("qunit-header")), "<h1 id=\"qunit-header\"></h1>" );
	equals( QUnit.jsDump.parse(document.getElementsByTagName("h1")), "[ <h1 id=\"qunit-header\"></h1> ]" );
})
