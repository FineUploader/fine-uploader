var path = require("path");

/* jshint node: true */
module.exports = function(paths, version) {
    "use strict";

    return {
        options: {
            bucket: "releases.fineuploader.com"
        },
        master: {
            upload: [
                {
                    src: paths.dist + "/**/*",
                    //src: path.join(basePath, '{*.zip,**/*.{js,css}}'),
                    dest: version + "/",
                    rel: paths.dist,
                    gzip: true
                }
            ]
        },
        develop: {
            sync: [
                {
                    src: paths.dist + "/**/*",
                    //src: path.join(basePath, '{*.zip,**/*.{js,css}}'),
                    dest: "develop/" + version + "/",
                    rel: paths.dist,
                    gzip: true
                }
            ]
        }

    };

};
