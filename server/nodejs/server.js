  //
 // file-uploader node.js-demo
//

var connect = require('connect') 
  , fs = require('fs')
  , uploadDir = __dirname+'/../uploads/'
  , port = 3000
  , body, fileStream, server, socket, uploader
  
uploader = function(req, res, next) {
  if (req.headers['content-type'].match(/application\/octet-stream/i)) {
    fileStream = fs.createWriteStream(uploadDir+req.headers['x-file-name'])
    req.pipe(fileStream)
    req.on('end', function() {
      body = '{"success":"true"}'
      res.writeHead(200, 
        { 'Content-Type':'text/plain'
        , 'Content-Length':body.length
        })
      res.end(body)
    })
  }
}                                                
  
server = module.exports = connect.createServer
  ( connect.staticProvider({root: __dirname+'/public', cache:true})
  , connect.staticProvider({root: __dirname+'/../../client', cache:true})
  , connect.router(function(app){app.post('/upload', uploader)})
  ).listen(port)

console.log('Connect server listening on port %s.', port)
                                                                  
