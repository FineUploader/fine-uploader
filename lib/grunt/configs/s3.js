var path = require("path");

/* jshint node: true */
module.exports = function(basePath, version) {
    "use strict";

    return {
        options: {
            bucket: "releases.fineuploader.com"
        },
        release: {
            sync: [
                {
                    src: basePath + "/**/*",
                    //src: path.join(basePath, '{*.zip,**/*.{js,css}}'),
                    dest: version + "/",
                    rel: basePath,
                    gzip: true
                }
            ]
        }

    };

};
