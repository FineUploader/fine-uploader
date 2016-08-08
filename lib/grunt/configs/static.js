/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        server: {
            options: {
                port: 3000,
                base: paths.test + "/unit/resources",
                headers: {
                    "Access-Control-Allow-Origin": "*"
                }
            }
        }
    };
};
