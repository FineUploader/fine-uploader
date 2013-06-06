#!/usr/bin/env node

/*
* Simple express server for localized testing.
*/
var express = require('express')
  , fs = require('fs')
  , http = require('http')
  , app = express();

var baseDir = __dirname + '/..';
var settings = {
    port: 3000,
    paths: {
        uploads: baseDir + '/uploads',
        vendor: baseDir + '/vendor',
        build: baseDir + '/../build',
        specs: baseDir + '/specs',
        source: baseDir + '/../client/js'
    }
};

// Options and whatnot
app.configure(function () {
    app.use(express.bodyParser({ uploadDir: settings.paths.uploads }));
    app.set('port', settings.port);
    app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    
    // Static URLS
    app.use(baseDir, express.static(baseDir));
    app.use('/tests/vendor', express.static(settings.paths.vendor));
    app.use('/tests/specs', express.static(settings.paths.specs));
    app.use('/build', express.static(settings.paths.build));

});

http.createServer(app).listen(app.get('port'), function () {
    console.log("## node.js Server Listening on Port: " + app.get('port'));
    //console.log("\n> TESTS");
    //console.log("http://localhost:3000/tests");
    //console.log(" unit: http://localhost:3000/tests/unit");
    //console.log(" integration: http://localhost:3000/tests/integration");
    //console.log("\n> UPLOADS");
    //console.log("POST     -> http://localhost:3000/uploads");
    //console.log("DELETE   -> http://localhost:3000/uploads/<uuid>");
    fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8')
});

// Routes
app.get("/", function (req, res) {
    res.redirect(200, "/tests");
});

app.get('/tests', function (req, res) {
    res.set('Content-Type', 'text/html');
    res.send(fs.readFileSync(baseDir + '/index.html'));
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

    var savePath = settings.paths.uploads;
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
            fs.rename(req.files.qqfile.path, settings.paths.uploads + "/" + uuid, function (err) { 
                if (!exists) {
                    console.log(">> Error!: " + error);
                    res.send(JSON.stringify({ success: false, error: err }), { 'Content-type': 'application/json' }, 200);
                }
                else {
                    console.log('File Uploaded! ' + settings.paths.uploads + "/" + uuid);
                    res.send(JSON.stringify({ success: true }), { 'Content-type': 'application/json' }, 200);
                    //res.send(JSON.stringify({ success: true, newUuid: uuid }), { 'Content-type': 'application/json' }, 200);
                }
        });
    } else {
        res.send(JSON.stringify({ success: false, error: "No file sent!" }, { "Content-type": "application/json" }, 200));
    }

});

app.get('/uploads/:uuid', function (req, res) {
    var filename = settings.paths.uploads + "/" + req.params.uuid;
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
    var filename = settings.paths.uploads + "/" + req.params.uuid;

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

