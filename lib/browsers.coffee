# Browsers, for testing

browsers =
    [
      browserName: "chrome"
      platform: "Linux"
      version: "28"
    ,
      browserName: "firefox"
      platform: "Linux"
      version: "21"
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
    exports.sauceBrowsers = sauceBrowsers = do ->
        b = {}
        for browser in browsers
          key = "SL-#{browser.browserName.replace " ", "_"}-#{browser.version || ''}-#{browser.platform.replace " ", "_"}"
          key = key.replace " ", "_"
          b[key] =
            base: 'SauceLabs'
            browserName: browser.browserName
            version: browser.version
            platform: browser.platform
        return b

    exports.sauceBrowserKeys = do ->
        res = []
        for k of sauceBrowsers
          res.push k
        return res
