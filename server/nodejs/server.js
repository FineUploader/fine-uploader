  //
 // file-uploader node.js-demo
//

var connect = require('connect') 
  , util = require('util')
  , fs = require('fs')
  , formidable = require('formidable')
  , uploadDir = __dirname+'/../uploads/'
  , port = 3000
  , body, form, uploader
  
uploader = function(req, res, next) {
  if (req.headers['content-type'].match(/multipart\/form-data/i)) {
    form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.uploadDir = uploadDir
    form.parse(req, function(err, fields, files){
      if (err) body = JSON.stringify({error:err})
      else body = JSON.stringify({success:true})
      res.writeHead(200, 
        { 'Content-Type':'text/html'
        , 'Content-Length':body.length
        })
      res.end(body)
    })
  }
  else if (req.headers['content-type'].match(/application\/octet-stream/i)) {
    var fileStream = fs.createWriteStream(uploadDir+req.headers['x-file-name'])
    //fileStream.setMaxListeners(100)
    req.on('data',function(chunk) {
      req.pause()
      fileStream.write(chunk)
      fileStream.on('drain',function() {
        req.resume()
      })
    })
    req.on('end',function() {
      req.resume()
      fileStream.destroySoon()
      body = JSON.stringify({success:true})
      res.writeHead(200, 
        { 'Content-Type':'text/html'
        , 'Content-Length':body.length
        })
      res.end(body)
    })
    fileStream.on('error', function(err){
      body = JSON.stringify({error:err})
      res.writeHead(200, 
        { 'Content-Type':'text/html'
        , 'Content-Length':body.length
        })
      res.end(body)
    })
  }
}                                                

var server = module.exports = connect
  ( connect.static(__dirname+'/../../client')
  , connect.static(__dirname+'/public')
  , connect.router(function(app){app.post('/upload', uploader)})
  ).listen(port)

console.log('Connect server listening on port %s.', port)
                                                                  
