<?php

// Example of how to use this uploader class

// Inlude the uploader class
require_once '../../server/php/qqFileUploader.php';

$uploader = new qqFileUploader();

// Specify the list of valid extensions, ex. array("jpeg", "xml", "bmp")
$uploader->allowedExtensions = array();

// Specify max file size in bytes.
$uploader->sizeLimit = 10 * 1024 * 1024;

// Specify the input name set in the javascript.
$uploader->inputName = 'qqfile';

// If you want to use resume feature for uploader, specify the folder to save parts.
$uploader->chunksFolder = 'chunks/';

// Call handleUpload() with the name of the folder, relative to PHP's getcwd()
$result = $uploader->handleUpload('uploads/');
$result['uploadName'] = $uploader->getUploadName();

// To save the upload with a random name, specify the second parameter
// $result = $uploader->handleUpload('uploads/', md5(mt_rand());

header("Content-Type: text/plain");
echo json_encode($result);