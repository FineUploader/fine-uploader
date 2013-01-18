<?php

// -----

// upload directory, e.g. "upload"
$upload_directory = "upload";

// valid extensions, e.g. array("jpeg", "xml", "bmp")
$valid_extensions = array("jpeg", "jpg", "gif", "png", "pdf", "exe", "msi", "zip");

// max file size in bytes, e.g. 262144000 or "250M"
$max_file_size = "250M";

// -----

require("file-uploader.php");

// -----

$database = "file_uploader.sqlite";

// -----

function update_database($uploader, $database)
{
	$pdo = new PDO("sqlite:" . $database);

	$name = $uploader->getName();

	$uuid = $uploader->getUuid();

	$upload_name = $uploader->getUploadName();

	$insert_sql = "INSERT INTO files (name,uuid,upload_name) VALUES ('$name','$uuid','$upload_name')";

	$pdo->query($insert_sql);
}

// -----

try
{
	$uploader = new qqFileUploader($upload_directory, $valid_extensions, $max_file_size);

	if($uploader->process())
	{
		update_database($uploader, $database);

		$response = array("success" => true);
	}
	else
	{
		$response = array("error" => $uploader->getMessage());
	}
}
catch(Exception $e)
{
	$response = array("error" => $e->getMessage());
}

// -----

header("Content-Type: text/plain");

echo htmlspecialchars(json_encode($response), ENT_NOQUOTES);

?>
