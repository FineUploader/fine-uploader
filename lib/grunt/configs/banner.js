/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        allhead: {
            src: ["" + paths.build + "/*.{js,css}"],
            options: {
                position: "top",
                banner: "/*!\n* <%= pkg.title %>\n*\n* Copyright 2015, <%= pkg.author %> info@fineuploader.com\n*\n* Version: <%= pkg.version %>\n*\n* Homepage: http://fineuploader.com\n*\n* Repository: <%= pkg.repository.url %>\n*\n* Licensed only under the Widen Commercial License (http://fineuploader.com/licensing).\n*/ \n\n"
            }
        },
        allfoot: {
            src: ["" + paths.build + "/*.{js,css}"],
            options: {
                position: "bottom",
                banner: "/*! <%= grunt.template.today('yyyy-mm-dd') %> */\n"
            }
        }
    };
};
