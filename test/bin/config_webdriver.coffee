module.exports = (grunt) ->
    browsers = [
        browserName: "firefox"
        version: "19"
        platform: "Linux"

        browserName: "chrome"
        platform: "Linux"

        browserName: "internet explorer"
        version: "10"
        platform: "Windows 8"

        browserName: "internet explorer"
        version: "9"
        platform: "Windows 7"

        browserName: "internet explorer"
        version: "8"
        platform: "Windows 7"

        browserName: "internet explorer"
        version: "7"
        platform: "Windows XP"

        browserName: "safari"
        version: "5"
        platform: "OS X 10.6"

        browserName: "iphone"
        version: "6"
        platform:"OS X 10.8"
        
        browserName: "android"
        version: "4.0"
        platform: "Linux"
    ]

    grunt.initConfig
        connect: 
            server:
                options:
                    base: "",
                    port: 9999
        watch:




