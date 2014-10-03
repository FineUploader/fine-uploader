/* jshint node: true */
module.exports = function(paths, customBuildDest) {
    "use strict";
    return {
        allhead: {
            src: ["" + paths.build + "/*.{js,css}"],
            options: {
                position: "top",
                banner: "/*!\n* <%= pkg.title %>\n*\n* Copyright 2013, <%= pkg.author %> info@fineuploader.com\n*\n* Version: <%= pkg.version %>\n*\n* Homepage: http://fineuploader.com\n*\n* Repository: <%= pkg.repository.url %>\n*\n* Licensed under GNU GPL v3, see LICENSE\n*/ \n\n"
            }
        },
        allfoot: {
            src: ["" + paths.build + "/*.{js,css}"],
            options: {
                position: "bottom",
                banner: "/*! <%= grunt.template.today('yyyy-mm-dd') %> */\n"
            }
        },
        customhead: {
            files: {
                src: ["" + customBuildDest + "/src/*.{js,css}"]
            },
            options: {
                position: "top",
                banner: "/*!\n* <%= pkg.title %>\n*\n* Copyright 2013-2014, <%= pkg.author %> info@fineuploader.com\n*\n* Version: <%= pkg.version %>\n*\n* Homepage: http://fineuploader.com\n*\n* Repository: <%= pkg.repository.url %>\n*\n* Licensed under GNU GPL v3, see LICENSE\n*\n* Third-party credits:\n*   MegaPixImageModule (MIT)\n*       https://github.com/stomita/ios-imagefile-megapixel\n*       Copyright (c) 2012 Shinichi Tomita <shinichi.tomita@gmail.com>\n*\n*   CryptoJS\n*       code.google.com/p/crypto-js/wiki/License\n*       (c) 2009-2013 by Jeff Mott. All rights reserved.\n*/ \n\n"
            }
        },
        customfoot: {
            files: {
                src: ["" + customBuildDest + "/*.{js,css}"]
            },
            options: {
                position: "bottom",
                banner: "/*! <%= grunt.template.today('yyyy-mm-dd') %> */\n"
            }
        }
    };
};
