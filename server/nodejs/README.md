# file-uploader with node.js

This is an example of using file-uploader with [node.js](http://nodejs.org).

*Note:* One could just use [formidable](https://github.com/felixge/node-formidable) 
to upload files and send the upload-% from server to client (websockets, 
longpoll, what ever). Which might be the better option. This is just for those, 
who want a ready-to-use client-side implementation of an feature-rich 
upload-button, which comes with file-uploader.

Installing node.js:

    curl http://nodejs.org/dist/node-v0.3.3.tar.gz
    tar xzvf node-v0.3.3.tar.gz
    cd node-v0.3.3
    ./configure && make && make install
    
Install modules (with npm):
    
    curl http://npmjs.org/install.sh | sh
    npm install connect
  
Now the server can be started with `node server.js`. The server will listen on 
port 3000 and saves the uploaded files in `../uploads`. Browse 
`http://localhost:3000` and enjoy file-uploader with node.js!