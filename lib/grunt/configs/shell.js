/* jshint node: true */
module.exports = function(paths, customBuildDest) {
    "use strict";
    return {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        version_custom_templates: {
            command: "find " + customBuildDest + "/ -type f -name '*.html' | xargs sed -i '' 's/{VERSION}/<%= pkg.version %>/'",
            options: {
                cwd: __dirname,
                stderr: true,
                stdout: true
            }
        },
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
