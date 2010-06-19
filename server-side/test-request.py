import urllib.request

headers = {}#{'Content-Length':'66'}
request = urllib.request.Request("http://localhost/file-upload-widget/server-side/php.php?name=[1,2]",'content', headers);
response = urllib.request.urlopen(request);
print (response.read());