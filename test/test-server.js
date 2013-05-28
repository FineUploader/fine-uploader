#!/usr/bin/env node

/*
* Simple express server for phantom.js
*/
var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , util = require('util')
  , url = require('url')
  , jade = require('jade')
  , app = express()
  , index;

var settings = {
    staticPath: __dirname + '/../',
    uploadPath: __dirname + '/uploads/',
    vendorPath: __dirname + '/vendor/',
    fixturesPath: __dirname + '/fixtures/',
    sourcePath: __dirname + '/../client/', 
    testsPath: __dirname + '/units/',
    port: 3000
};
console.log(settings);

app.set('port', process.env.PORT || 3000)
   .use(express.errorHandler())
   .set('views', settings.fixturesPath)
   .use(app.router)
   .use(express.bodyParser({ keepExtensions: true, uploadDir: settings.uploadPath }))
   .use(express.logger('dev'))
   .use(express.cookieParser())
   .engine('.html', require('jade').__express);
app.use('/client', express.static(settings.sourcePath));
app.use('/vendor', express.static(settings.vendorPath));
app.use('/units', express.static(settings.testsPath));
app.use('/uploads', express.static(settings.uploadPath));

app.get("/", function (req, res) {
    res.render(__dirname + '/fixtures/index.jade');
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("## Test Server Listening on Port: " + app.get('port'));
    console.log("\nhttp://localhost:3000/test/fixtures\n");
    fs.writeFileSync(__dirname + '/pid.txt', process.pid, 'utf-8')
});
