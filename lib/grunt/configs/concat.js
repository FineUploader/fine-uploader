/* jshint node: true */
var path = require("path"),
    fineUploaderModules = require("../../modules");

module.exports = function(paths) {
    "use strict";

    var jsBanner = (
            "(function(global) {\n"
        ),

        jsFooter = (
            "if (typeof define === 'function' && define.amd) {\n" +
            "   define(function() {\n" +
            "       return qq;\n" +
            "   });\n" +
            "}\n" +
            "else if (typeof module !== 'undefined' && module.exports) {\n" +
            "   module.exports = qq;\n" +
            "}\n" +
            "else {\n" +
            "   global.qq = qq;\n" +
            "}\n" +
            "}(window));\n"
        ),

        jsOptions = {
            banner: jsBanner,
            footer: jsFooter
        }

    return {
        core: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuTraditional"),
            dest: "" + paths.build + "/<%= pkg.name %>.js"
        },
        coreS3: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuS3"),
            dest: "" + paths.build + "/s3.<%= pkg.name %>.js"
        },
        coreAzure: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuAzure"),
            dest: "" + paths.build + "/azure.<%= pkg.name %>.js"
        },
        jquery: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuTraditionalJquery"),
            dest: "" + paths.build + "/jquery.<%= pkg.name %>.js"
        },
        jqueryS3: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuS3Jquery"),
            dest: "" + paths.build + "/s3.jquery.<%= pkg.name %>.js"
        },
        jqueryAzure: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuAzureJquery"),
            dest: "" + paths.build + "/azure.jquery.<%= pkg.name %>.js"
        },
        all: {
            options: jsOptions,
            src: fineUploaderModules.mergeModules(true, "fuAll"),
            dest: paths.build + "/all.<%= pkg.name %>.js"
        },
        css: {
            src: fineUploaderModules.mergeModules(true, "fuCss"),
            dest: "" + paths.build + "/<%= pkg.name %>-new.css"
        },
        cssGallery: {
            src: fineUploaderModules.mergeModules(true, "fuCssGallery"),
            dest: "" + paths.build + "/<%= pkg.name %>-gallery.css"
        },
        cssLegacy: {
            src: fineUploaderModules.mergeModules(true, "fuCssLegacy"),
            dest: "" + paths.build + "/<%= pkg.name %>.css"
        }
    };
};
