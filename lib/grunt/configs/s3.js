var path = require("path");

/* jshint node: true */
module.exports = function(distPath, buildPath, version) {
    "use strict";

    return {
        options: {
            sslEnabled: false,
            bucket: "releases.fineuploader.com",
            access: "public-read",
            uploadConcurrency: 10,
            params: {
                CacheControl: "max-age=630720000, public",
                Expires: new Date(Date.now() + 63072000000)
            }
        },
        clean: {
            del: [
                { src: "develop" }
            ]
        },
        develop: {
            sync: [
                {
                    src: buildPath + "/**/*",
                    dest: "develop/",
                    rel: buildPath
                }
            ]
        },
        release: {
            sync: [
                {
                    src: distPath + "/**/*",
                    dest: version + "/",
                    rel: distPath
                }
            ]
        }

    };

};
