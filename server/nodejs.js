/**
 * Node.JS server sample file for the cool ajax file uploader by Valums (http://valums.com/ajax-upload/).
 *
 * You have to install additional modules with:
 * npm install express
 * npm install node-uuid
 *
 * If you are using NginX as reverse proxy, please set this in your server block:
 * client_max_body_size    200M;
 * 
 * You have to run the server endpoint on port 80,
 * either by an reverse proxy upstream to this script
 * or by run this script directly on port 80,
 * because the ajax upload script can not handle port instruction in the action url correctly. :(
 *
 * @Author: Felix Gertz <dev@felixgertz.de> 2012
 */

var express = require('express'),
    fs = require('fs'),
    util = require('util'),
    uuid = require('node-uuid'),
    url = require('url'),
    app = express();

// Settings
var settings = {
    node_port: process.argv[2] || 3000,
    uploadpath: __dirname + '/uploads/'
};

// Configuration
app.configure(function(){
    // We need the bodyParser to form parsing old style uploads
    app.use(express.bodyParser());

    app.use(express.methodOverride());
    app.use(app.router);
});

// Route that takes the post upload request and sends the server response
app.post('/upload', function(req, res) {
    uploadFile(req, settings.uploadpath, function(data) {
        if(data.success)
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 200);
        else
            res.send(JSON.stringify(data), {'Content-Type': 'text/plain'}, 404);
    });
});


// Mainfunction to recieve and process the file upload data asynchronously
var uploadFile = function(req, targetdir, callback) {

    // Moves the uploaded file from temp directory to it's destination
    // and calls the callback with the JSON-data that could be returned.
    var moveToDestination = function(sourcefile, targetfile) {
        moveFile(sourcefile, targetfile, function(err) {
            if(!err)
                callback({success: true});
            else
                callback({success: false, error: err});
        });
    };

    // Direct async xhr stream data upload, yeah baby.
    if(req.xhr) {
        var fname = url.parse(req.url, true).query.qqfile;

        // Be sure you can write to '/tmp/'
        var tmpfile = '/tmp/'+uuid.v1();

        // Open a temporary writestream
        var ws = fs.createWriteStream(tmpfile);
        ws.on('error', function(err) {
            console.log("uploadFile() - req.xhr - could not open writestream.");
            callback({success: false, error: "Sorry, could not open writestream."});
        });
        ws.on('close', function(err) {
            moveToDestination(tmpfile, targetdir+fname);
        });

        // Writing filedata into writestream
        req.on('data', function(data) {
            ws.write(data);
        });
        req.on('end', function() {
            ws.end();
        });
    }

    // Old form-based upload
    else {
        moveToDestination(req.files.qqfile.path, targetdir+req.files.qqfile.name);
    }
};

// Moves a file asynchronously over partition borders
var moveFile = function(source, dest, callback) {
    var is = fs.createReadStream(source)

    is.on('error', function(err) {
        console.log('moveFile() - Could not open readstream.');
        callback('Sorry, could not open readstream.')
    });
    is.on('end', function() {
        fs.unlinkSync(source);
        callback();
    });
    
    var os = fs.createWriteStream(dest);
    os.on('error', function(err) {
        console.log('moveFile() - Could not open writestream.');
        callback('Sorry, could not open writestream.');
    });
    
    is.pipe(os);
};

// Starting the express server
app.listen(settings.node_port, '127.0.0.1');
console.log("Express server listening on %s:%d for uploads", '127.0.0.1', settings.node_port);
