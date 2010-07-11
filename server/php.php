<?php
// THIS IS JUST AN EXAMPLE, PLEASE DO NOT USE
// IN PRODUCTION WITHOUT CHECKING/MODIFICATIONS

class UploadFileXhr {
	function save($path){
		$input = fopen("php://input", "r");
		$fp = fopen($path, "w");
		while ($data = fread($input, 1024)){
			fwrite($fp,$data);
		}
		fclose($fp);
		fclose($input);			
	}
	function getName(){
		return $_GET['name'];
	}
	function getSize(){
		$headers = apache_request_headers();
		return (int)$headers['Content-Length'];
	}
}

class UploadFileForm {	
  function save($path){
		move_uploaded_file($_FILES['qqfile']['tmp_name'], $path);
	}
	function getName(){
		return $_FILES['qqfile']['name'];
	}
	function getSize(){
		return $_FILES['qqfile']['size'];
	}
}

function handleUpload(){
	$uploaddir = 'uploads/';
	$maxFileSize = 100 * 1024 * 1024;
		
	if (isset($_GET['qqfile'])){
		$file = new UploadFileXhr();
	} elseif (isset($_FILES['qqfile'])){
		$file = new UploadFileForm();
	} else {
		return array(success=>false);
	}	

	$size = $file->getSize();
	if ($size == 0){
		return array(success=>false, error=>"File is empty.");
	}				
	if ($size > $maxFileSize){
		return array(success=>false, error=>"File is too large.");
	}
		
	$pathinfo = pathinfo($file->getName());
	$filename = $pathinfo['filename'];			
	$ext = $pathinfo['extension'];
	
	// if you limit file extensions on the client side,
	// you should check file extension here too
			
	while (file_exists($uploaddir . $filename . '.' . $ext)){
		$filename .= rand(10, 99);			
	}	
		
	$file->save($uploaddir . $filename . '.' . $ext);
	
	return array(success=>true);
}


$result = handleUpload();

// to pass data through iframe you will need to encode all html tags
echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);