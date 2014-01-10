/* globals assert, qq, before, beforeEach, afterEach */
var $fixture;

(function() {
    "use strict";

    qq.override(assert, function(super_) {
        var expected = -1,
            hit = 0,
            done;

        function checkIfDone() {
            if (expected >= 0) {
                if (hit === expected) {
                    done();
                }
                else if (hit > expected) {
                    assert.ok(false, "Too many assertions!");
                }
            }
        }

        return {
            expect: function(assertsExpected, doneCallback) {
                expected = assertsExpected;
                done = doneCallback;
            },

            reset: function() {
                expected = -1;
                hit = 0;
            },

            ok: function() {
                hit++;
                super_.ok.apply(this, arguments);
                checkIfDone();
            },

            equal: function() {
                hit++;
                super_.equal.apply(this, arguments);
                checkIfDone();
            },

            deepEqual: function() {
                hit++;
                super_.deepEqual.apply(this, arguments);
                checkIfDone();
            }
        };
    });

    before(function() {
        // "Turn off" the before unload handler since this may cause the tests to stall when run in a browser
        qq.FineUploaderBasic.prototype._preventLeaveInProgress = function() {};
        qq.s3.FineUploaderBasic.prototype._preventLeaveInProgress = function() {};
    });

    beforeEach(function() {
        assert.reset();
        $fixture = $("<div id='mocha-fixture'></div>");
        $fixture.appendTo("body");
        return $fixture;
    });

    afterEach(function () {
        $fixture.empty();
        return $fixture.remove();
    });
}());
