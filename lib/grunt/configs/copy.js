/* jshint node: true */
module.exports = function(paths) {
    "use strict";
    return {
        dist: {
            files: [
                {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.js", "!all.*", "!s3.*", "!azure.*", "!*.min.js", "!jquery*", "!*iframe*"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/",
                    ext: ".js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["all.*", "!s3.*.js", "!*.min.js", "!s3.jquery*", "!azure.jquery*", "!*iframe*"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["!all.*", "s3.*.js", "!*.min.js", "!s3.jquery*", "!azure.jquery*", "!*iframe*"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["!all.*", "azure.*.js", "!*.min.js", "!azure.jquery*", "!s3.jquery*", "!*iframe*"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.js", "!all.*", "!s3.*", "!azure.*", "!jquery*"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/",
                    ext: ".min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["all.*.min.js"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["s3.*.min.js", "!s3.jquery*"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["azure.*.min.js", "!azure.jquery*"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["jquery*js", "!s3.*", "!azure.*", "!*.min.js"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["s3.jquery*js", "!*.min.js"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/",
                    ext: ".jquery.<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["azure.jquery*js", "!*.min.js"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>/",
                    ext: ".jquery.<%= pkg.name %>.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["jquery*min.js"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/",
                    ext: ".<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["s3.jquery*min.js"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/",
                    ext: ".jquery.<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["azure.jquery*min.js"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>/",
                    ext: ".jquery.<%= pkg.name %>.min.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: "./" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/",
                    ext: ".xss.response.js"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: "./",
                    src: ["LICENSE"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>/"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.min.css"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>",
                    ext: ".min.css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.build,
                    src: ["*.css", "!*.min.css"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>",
                    ext: ".css"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/all.<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/s3.<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/azure.<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/jquery.<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/s3.jquery.<%= pkg.name %>/templates/"
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: "" + paths.dist + "/azure.jquery.<%= pkg.name %>/templates/"
                }
            ]
        },
        build: {
            files: [
                {
                    expand: true,
                    cwd: "" + paths.src + "/js/",
                    src: ["iframe.xss.response.js"],
                    dest: paths.build
                }, {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: paths.build
                }, {
                    expand: true,
                    cwd: paths.html,
                    src: ["*.html"],
                    dest: paths.build
                }
            ]
        },
        test: {
            expand: true,
            flatten: true,
            src: ["" + paths.build + "/*"],
            dest: "" + paths.test + "/_temp"
        },
        images: {
            files: [
                {
                    expand: true,
                    cwd: paths.src,
                    src: ["*.gif", "placeholders/*.png"],
                    dest: paths.build
                }
            ]
        },
        templates: {
            files: [
                {
                    expand: true,
                    cwd: paths.src + "/html",
                    src: ["*.html"],
                    dest: paths.build
                }
            ]
        }
    };
};
