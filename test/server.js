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
app.configure( function () {
    app.use(express.bodyParser({ uploadDir: settings.uploadPath }));
    app.set('port', process.env.PORT || settings.port);
    app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.engine('.jade', require('jade').__express);
    app.use(app.router);
    
    // Static URLS
    app.use('/uploads', express.directory(settings.uploadPath));
    app.use('/vendor', express.static(settings.vendorPath));
    app.use('/units', express.static(settings.unitsPath));
    app.use('/integrations', express.static(settings.integrationsPath));
    app.use('/fine-uploader', express.static(settings.sourcePath));

})

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


// app.options("/uploads", function (req, res, next) {
//     res.set("Access-Control-Allow-Origin", 'http://localhost:3000');
//     res.set('Access-Control-Allow-Methods', 'POST,DELETE');
//     res.set('Access-Control-Allow-Headers', 'x-request-with, cache-control, content-type');
// 
// })

app.post("/uploads", function (req, res, next) {

    var savePath = settings.uploadPath;
    var filename, uuid, totalFileSize;

    //var isiFrame = req.get('X-Requested-With') == null || !req.get('X-Requested-With') === ('XMLHttpRequest');
    var isiFrame = req.xhr === false;

    //console.log(res);

    // is CORS and not XHR
    //res.set('Content-type', (isiFrame ? 'text/html' : 'text/plain'));

    if (req.body) {
        uuid = req.body.qquuid;
        totalFileSize = req.body.qqtotalfilesize;
    }

    if (req.files.qqfile) {
            var exists = fs.existsSync(req.files.qqfile.path);
            fs.rename(req.files.qqfile.path, settings.uploadPath + uuid, function (err) { 
                if (!exists) {
                    console.log(">> Error!: " + error);
                    res.send(JSON.stringify({ success: false, error: err }), { 'Content-type': 'application/json' }, 200);
                }
                else {
                    console.log('File Uploaded! ' + settings.uploadPath + uuid);
                    res.send(JSON.stringify({ success: true, newUuid: uuid }), { 'Content-type': 'application/json' }, 200);
                }
        });
    } else {
        res.send(JSON.stringify({ success: false, error: "No file sent!" }, { "Content-type": "application/json" }, 200));
    }

});

app.get('/uploads/:uuid', function (req, res) {
    var filename = settings.uploadPath + req.params.uuid;
    fs.readFile(filename, function (err, data) {
        if (err != null) {
            console.log(">> Error!: " + err);
            res.send(JSON.stringify({}), { 'Content-type': 'application/json' }, 404);
        }
        else {
            console.log("File Deleted! " + filename);
            res.send(JSON.stringify({ success: true }), { 'Content-type': 'application/json' } , 200);
        }});
});

app.delete('/uploads/:uuid', function (req, res) {
    var filename = settings.uploadPath + req.params.uuid;

    fs.unlink(filename, function (err) {
        if (err != null) {
            console.log(">> Error!: " + err);
            res.send(JSON.stringify({}), { 'Content-type': 'application/json' }, 404);
        }
        else {
            console.log("File Deleted! " + filename);
            res.send(JSON.stringify({ success: true }), { 'Content-type': 'application/json' } , 200);
        }});
});

