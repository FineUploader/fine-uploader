#!/usr/bin/env node

/*
* Simple express server for localized testing.
*/
var express = require('express')
  , fs = require('fs')
  , http = require('http')
  , app = express();

var settings = {
    port: 3000,
    uploadPath: __dirname + '/uploads/',
    vendorPath: __dirname + '/vendor/',
    unitsPath: __dirname + '/units/',
    integrationsPath: __dirname + '/integrations/',
    sourcePath: __dirname + '/../fine-uploader/', 
};

// Options and whatnot
app.set('port', process.env.PORT || settings.port)
   .use(app.router)
   .use(express.errorHandler())
   .use(express.logger('dev'))
   .use(express.cookieParser())
   .use(express.bodyParser({ keepExtensions: true, uploadDir: settings.uploadPath }))
   .engine('.html', require('jade').__express)
   .engine('.jade', require('jade').__express);

// Static URLS
app.use('/uploads', express.static(settings.uploadPath));
app.use('/vendor', express.static(settings.vendorPath));
app.use('/units', express.static(settings.unitsPath));
app.use('/integrations', express.static(settings.integrationsPath));
app.use('/fine-uploader', express.static(settings.sourcePath));

// Routes
app.get("/", function (req, res) {
    res.redirect(200, "/tests");
});

app.get('/tests', function (req, res) {
    res.render(__dirname + '/index.jade');
});

app.get('/tests/unit', function (req, res) {
    res.render(settings.unitsPath + 'index.jade');
});

app.get('/tests/integration', function (req, res) {
    res.render(settings.integrationsPath + 'index.jade');
});

app.get('/tests/integration/:type', function (req, res) {
    var type = req.param('type');
    if (type)
        res.render(settings.integrationsPath + type + '.jade');
});

// CORS
// app.use(function (req, res) {
//     res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
//     res.set('Access-Control-Allow-Credentials', 'true');
//     res.set('Access-Control-Allow-Origin', '*');
// });


app.options("/uploads", function (req, res, next) {
    res.set("Access-Control-Allow-Origin", 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'POST,DELETE');
    res.set('Access-Control-Allow-Headers', 'x-request-with, cache-control, content-type');

})
app.post("/uploads", function (req, res, next) {

    var savePath = settings.uploadPath;
    var filename;
    if (req.files && req.files.qqfile)
        filename = req.files.qqfile.name;

    var isiFrame = req.get('X-Requested-With') == null || !req.get('X-Requested-With') === ('XMLHttpRequest');

    res.set('Content-type', (isiFrame ? 'text/html' : 'text/plain'));
    
    if (request.files.length > 0) {
        for (var i = 0; i < request.files.length; i++) {
            fs.rename(request.files.qqfile.path, savePath + fileName, function (err) {
                if (err != null) {
                    console.log(">> Error!: " + error);
                    response.send(JSON.stringify({ success: false, error: err }), { 'Content-type': 'application/json' }, 200);
                }
                else {
                    response.send(JSON.stringify({ success: true }), { 'Content-type': 'application/json' }, 200);
                    console.log('File Uploaded! ' + savePath + filename);
                }});
        }
    }
});

app.delete('/uploads/:uuid', function (req, res) {
    var filename = settings.uploadPath + uuid;

    fs.unlink(filename, function (err) {
        if (err != null) {
            console.log(">> Error!: " + error);
            response.send(JSON.stringify({}), { 'Content-type': 'application/json' }, 404);
        }
        else {
            console.log("File Deleted! " + filename);
            response.send(JSON.stringify({ success: true }), { 'Content-type': 'application/json' } , 200);
        }});
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("## node.js Server Listening on Port: " + app.get('port'));
    console.log("\n> TESTS");
    console.log("http://localhost:3000/tests");
    console.log(" unit: http://localhost:3000/tests/unit");
    console.log(" integration: http://localhost:3000/tests/integration");
    console.log("\n> UPLOADS");
    console.log("POST     -> http://localhost:3000/uploads");
    console.log("DELETE   -> http://localhost:3000/uploads/<uuid>");
    fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8')
});
