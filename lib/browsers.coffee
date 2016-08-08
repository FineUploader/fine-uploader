# Browsers, for testing

browsers =
    [
        browserName: "chrome"
        platform: "Linux"
        version: "28"
    ,
        browserName: "firefox"
        platform: "Linux"
        version: "26"
    ,
        browserName: "android"
        platform: "Linux"
        version: "4.0"
    ,
        browserName: "safari"
        platform: "OS X 10.8"
        version: "6"
    ,
        browserName: "safari"
        platform: "OS X 10.6"
        version: "5"
    ,
        browserName: "iphone"
        platform: "OS X 10.8"
        version: "6"
    ,
#        browserName: "iphone"
#        platform: "OS X 10.9"
#        version: "7"
#    ,
        browserName: "internet explorer"
        platform: "Windows 8.1"
        version: "11"
    ,
        browserName: "internet explorer"
        platform: "Windows 8"
        version: "10"
    ,
        browserName: "internet explorer"
        platform: "Windows 7"
        version: "9"
    ,
        browserName: "internet explorer"
        platform: "Windows 7"
        version: "8"
    ,
        browserName: "internet explorer"
        platform: "Windows XP"
        version: "7"
    ]

if (exports)
    exports.modules = browsers
