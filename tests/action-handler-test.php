<?php

usleep(300);

$fileName;

if (isset($_GET['qqfile'])){
    $fileName = $_GET['qqfile'];
    
	// xhr request
	$headers = apache_request_headers();
	if ((int)$headers['Content-Length'] == 0){
		die ('{error: "content length is zero"}');
	}
} elseif (isset($_FILES['qqfile'])){
    $fileName = basename($_FILES['qqfile']['name']);
    
	// form request
	if ($_FILES['qqfile']['size'] == 0){
		die ('{error: "file size is zero"}');
	}
} else {
	die ('{error: "file not passed"}');
}

if (count($_GET)){
	//return query params
	echo json_encode(array_merge($_GET, array('fileName'=>$fileName)));	
} else {
	die ('{error: "query params not passed"}');
}
