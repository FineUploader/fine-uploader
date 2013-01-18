<?php

// -----

$database = "file_uploader.sqlite";

$upload_directory = "upload";

$uuid_name = "qquuid";

// -----

function respond($response)
{
	header("Content-Type: text/plain");

	echo htmlspecialchars(json_encode($response), ENT_NOQUOTES);

	exit;
}

// -----

if(!isset($_REQUEST[$uuid_name]))
{
	respond(array("error" => "Can't identify file."));
}

$uuid = $_REQUEST[$uuid_name];

// -----

try
{
	$pdo = new PDO("sqlite:" . $database);
}
catch(PDOException $e)
{
	respond(array("error" => $e->getMessage()));
}

$select_sql = "SELECT * FROM files WHERE (uuid = '$uuid')";

try
{
	$files = $pdo->query($select_sql);
}
catch(PDOException $e)
{
	respond(array("error" => $e->getMessage()));
}

// -----

if(count($files) == 0)
{
	respond(array("error" => "No files."));
}

if(count($files) > 1)
{
	respond(array("error" => "Too many files."));
}

// -----

foreach($files as $file)
{
	$filename = $file["upload_name"];

	// -----

	if(!file_exists($upload_directory . DIRECTORY_SEPARATOR . $filename))
	{
		respond(array("error" => "File does not exist."));
	}

	if(!unlink($upload_directory . DIRECTORY_SEPARATOR . $filename))
	{
		respond(array("error" => "Can't delete file."));
	}

	// -----

	$update_sql = "UPDATE files SET deleted=1,deleted_at=datetime('now','localtime') WHERE (uuid='$uuid')";

	try
	{
		$pdo->query($update_sql);
	}
	catch(PDOException $e)
	{
		respond(array("error" => $e->getMessage()));
	}
}

// -----

respond(array("success" => true));

?>
