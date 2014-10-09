/* jshint node: true */
module.exports = function(basePath,version){
    "use strict";

    return {
        options: {
            bucket: "releases.fineuploader.com"
        },
        release: {
            upload: [
                {
                    src: basePath+'/**/*',
                    dest: version+'/',
                    rel: basePath,
                    gzip: true
                },
            ]
        }

    };

};
