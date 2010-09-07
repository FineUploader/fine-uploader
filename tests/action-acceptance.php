<?php

usleep(100000);

$fileName;
$fileSize;

if (isset($_GET['qqfile'])){
    $fileName = $_GET['qqfile'];
    
	// xhr request
	$headers = apache_request_headers();
	$fileSize = (int)$headers['Content-Length'];
} elseif (isset($_FILES['qqfile'])){
    $fileName = basename($_FILES['qqfile']['name']);
    $fileSize = $_FILES['qqfile']['size'];
} else {
	die ('{error: "server-error file not passed"}');
}

if ($fileName == '4text.txt'){
    die ('jsgkdfgu4eyij');
}

if ($fileSize == 0){
    die ('{error: "server-error file size is zero"}');
}

if ($fileSize < 10){
    die ('{error: "server-error file size is smaller than 10 bytes"}');
}

if ($fileSize > 9 * 1024){
    die ('{error: "server-error file size is bigger than 9kB"}');
}

if (count($_GET)){	
    array_merge($_GET, array('fileName'=>$fileName));
    
    $response = array_merge($_GET, array('success'=>true, 'fileName'=>$fileName));
    
    // to pass data through iframe you will need to encode all html tags		
	echo htmlspecialchars(json_encode($response), ENT_NOQUOTES);	
} else {
	die ('{error: "server-error  query params not passed"}');
}
