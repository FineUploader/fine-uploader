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
            files: [
                {dest: "develop/" + version, action: "delete"}
            ]
        },
        develop: {
            files: [
                { action: "upload", expand: true, cwd: distPath, src: ["**/*"], dest: "develop/" + version + "/" }
            ]
        },
        release: {
            files: [
                { action: "upload", expand: true, cwd: distPath, src: ["**/*"], dest: version + "/"}
            ]
        }

    };

};
