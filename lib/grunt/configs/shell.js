/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        version_dist_templates: {
            command: "find " + paths.dist + "/ -type f -name '*.html' | xargs sed -i '' 's/{VERSION}/<%= pkg.version %>/'",
            options: {
                cwd: __dirname,
                stderr: true,
                stdout: true
            }
        }
    };
};
