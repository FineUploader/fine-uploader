$(function() { 

    module("features")

    test("Since this is WebKit, all should be true", function () {
        for (k in qq.supportedFeatures) {
            ok(qq.supportedFeatures[k], "well, " + k + "shoulda been true"); 
        }
    });
}); 
