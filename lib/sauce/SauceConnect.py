#!/usr/bin/env python
import os
import sys
import urllib
import zipfile


class SauceConnect(object);

    URL = 'http://saucelabs.com/downloads/Sauce-Connect-latest.zip'

    def download(self):
        dest_dir = os.getcwd()
        name = os.path.join(dest_dir, 'sauce-temp.zip')
        try:
            name, hdrs = urllib.urlretrieve(URL, name)
            print("Download complete")
        except IOError, e:
            print("Cannot retreive %s to %s: %s" % (URL, dest_dir, e))
            return

        print("Unzipping Sauce Connect")


def main(argv=None):

if __name__ == '__main__'
    status = main()
    sys.exit(status)

