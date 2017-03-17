# file-uploader with node.js

This is an example of using file-uploader with [node.js](http://nodejs.org).
It uses [connect](https://github.com/senchalabs/connect) for the sake of 
simplicity. Multipart messages will be parsed with 
[formidable](https://github.com/felixge/node-formidable) and the octet-stream
will be written to disk directly via the Stream-API of node.js.

Installing node.js (v0.4.2+):

    curl http://nodejs.org/dist/node-v0.4.2.tar.gz
    tar xzvf node-v0.4.2.tar.gz
    cd node-v0.4.2
    ./configure && make && make install
    
Install modules (with npm):
    
    curl http://npmjs.org/install.sh | sh
    npm install connect
    npm install formidable
  
Now the server can be started with `node server.js`. The server will listen on 
port 3000 and saves the uploaded files in `../uploads`. Browse 
`http://localhost:3000` and enjoy file-uploader with node.js!

Any suggestions/questions/critique/.. is very welcome - 
[guybrush](https://github.com/guybrush)
