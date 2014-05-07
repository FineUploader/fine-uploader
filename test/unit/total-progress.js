/* globals describe, it, assert */
if (qq.supportedFeatures.progressBar) {
    describe("total progress tests", function() {
        "use strict";

        describe("module tests", function() {
            it("updates total progress when a file has been added or when size has changed", function() {
                var actualFileSizes = {
                        0: 123,
                        1: 456,
                        2: 789,
                        3: -1
                    },
                    actualTotalProgressUpdates = [],
                    expectedTotalProgressUpdates = [
                        {loaded: 0, total: actualFileSizes[0]},
                        {loaded: 0, total: actualFileSizes[0] + actualFileSizes[1]},
                        {loaded: 0, total: actualFileSizes[0]},
                        {loaded: 0, total: actualFileSizes[0] + actualFileSizes[2]}

                    ],

                    onTotalProgress = function(loaded, total) {
                        actualTotalProgressUpdates.push({loaded: loaded, total: total});
                    },

                    getSize = function(id) {
                        return actualFileSizes[id];
                    },

                    tp = new qq.TotalProgress(onTotalProgress, getSize);

                tp.onStatusChange(0, null, qq.status.SUBMITTING);
                tp.onStatusChange(0, qq.status.SUBMITTING, qq.status.SUBMITTED);

                tp.onStatusChange(1, null, qq.status.SUBMITTING);
                tp.onStatusChange(1, qq.status.SUBMITTING, qq.status.REJECTED);

                tp.onStatusChange(2, null, qq.status.SUBMITTING);
                tp.onStatusChange(2, qq.status.SUBMITTING, qq.status.SUBMITTED);

                tp.onStatusChange(3, null, qq.status.SUBMITTING);
                tp.onStatusChange(3, qq.status.SUBMITTING, qq.status.SUBMITTED);

                actualFileSizes[3] = 333;
                tp.onNewSize(3);
                expectedTotalProgressUpdates.push(
                    {loaded: 0, total: actualFileSizes[0] + actualFileSizes[2] + actualFileSizes[3]}
                );

                assert.deepEqual(actualTotalProgressUpdates, expectedTotalProgressUpdates);
            });

            it("updates total progress when a file has been canceled", function() {
                var actualFileSizes = {
                        0: 123,
                        1: 456
                    },
                    actualTotalProgressUpdates = [],
                    expectedTotalProgressUpdates = [
                        {loaded: 0, total: actualFileSizes[0]},
                        {loaded: 10, total: actualFileSizes[0]},
                        {loaded: 10, total: actualFileSizes[0] + actualFileSizes[1]},
                        {loaded: 0, total: actualFileSizes[1]}
                    ],

                    onTotalProgress = function(loaded, total) {
                        actualTotalProgressUpdates.push({loaded: loaded, total: total});
                    },

                    getSize = function(id) {
                        return actualFileSizes[id];
                    },

                    tp = new qq.TotalProgress(onTotalProgress, getSize);

                tp.onStatusChange(0, null, qq.status.SUBMITTING);
                tp.onStatusChange(0, qq.status.SUBMITTING, qq.status.SUBMITTED);
                tp.onIndividualProgress(0, 10, actualFileSizes[0]);

                tp.onStatusChange(1, null, qq.status.SUBMITTING);
                tp.onStatusChange(1, qq.status.SUBMITTING, qq.status.SUBMITTED);

                tp.onStatusChange(0, qq.status.SUBMITTED, qq.status.CANCELED);

                assert.deepEqual(actualTotalProgressUpdates, expectedTotalProgressUpdates);
            });
        });

        it("updates total progress when individual files progress", function() {
            var actualFileSizes = {
                    0: 123,
                    1: 456
                },
                actualTotalProgressUpdates = [],
                expectedTotalProgressUpdates = [
                    {loaded: 0, total: actualFileSizes[0]},
                    {loaded: 0, total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: 10, total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: 20, total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: 35, total: actualFileSizes[0] + actualFileSizes[1]}
                ],

                onTotalProgress = function(loaded, total) {
                    actualTotalProgressUpdates.push({loaded: loaded, total: total});
                },

                getSize = function(id) {
                    return actualFileSizes[id];
                },

                tp = new qq.TotalProgress(onTotalProgress, getSize);

            tp.onStatusChange(0, null, qq.status.SUBMITTING);
            tp.onStatusChange(1, null, qq.status.SUBMITTING);

            tp.onStatusChange(0, qq.status.SUBMITTING, qq.status.SUBMITTING);
            tp.onIndividualProgress(0, 10, actualFileSizes[0]);
            tp.onIndividualProgress(0, 20, actualFileSizes[0]);

            tp.onStatusChange(1, qq.status.SUBMITTING, qq.status.SUBMITTING);
            tp.onIndividualProgress(1, 15, actualFileSizes[1]);

            assert.deepEqual(actualTotalProgressUpdates, expectedTotalProgressUpdates);
        });

        it("limits total progress to specific batches of files", function() {
            var actualFileSizes = {
                    0: 123,
                    1: 456,
                    2: 333
                },
                actualTotalProgressUpdates = [],
                expectedTotalProgressUpdates = [
                    {loaded: 0, total: actualFileSizes[0]},
                    {loaded: actualFileSizes[0] - 1, total: actualFileSizes[0]},
                    {loaded: actualFileSizes[0] - 1, total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: actualFileSizes[0] - 1 + actualFileSizes[1] - 1, total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: actualFileSizes[0] + actualFileSizes[1], total: actualFileSizes[0] + actualFileSizes[1]},
                    {loaded: 0, total: actualFileSizes[2]}
                ],

                onTotalProgress = function(loaded, total) {
                    actualTotalProgressUpdates.push({loaded: loaded, total: total});
                },

                getSize = function(id) {
                    return actualFileSizes[id];
                },

                tp = new qq.TotalProgress(onTotalProgress, getSize);

            tp.onStatusChange(0, null, qq.status.SUBMITTING);
            tp.onStatusChange(0, qq.status.SUBMITTING, qq.status.SUBMITTED);
            tp.onIndividualProgress(0, actualFileSizes[0] - 1, actualFileSizes[0]);

            tp.onStatusChange(1, null, qq.status.SUBMITTING);
            tp.onStatusChange(1, qq.status.SUBMITTING, qq.status.SUBMITTED);
            tp.onIndividualProgress(1, actualFileSizes[1] - 1, actualFileSizes[1]);

            tp.onAllComplete([0], [1], []);

            tp.onStatusChange(2, null, qq.status.SUBMITTING);
            tp.onStatusChange(2, qq.status.SUBMITTING, qq.status.SUBMITTED);

            assert.deepEqual(actualTotalProgressUpdates, expectedTotalProgressUpdates);
        });
    });
}
