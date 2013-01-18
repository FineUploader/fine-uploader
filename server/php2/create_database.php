<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Create File Uploader Database</title>
</head>
<body>
<?php

$database = "file_uploader.sqlite";

try
{
	$pdo = new PDO("sqlite:" . $database);
}
catch(PDOException $e)
{
	die($e->getMessage());
}

$drop_table_sql = "DROP TABLE IF EXISTS files;";

try
{
	$pdo->exec($drop_table_sql);
}
catch(PDOException $e)
{
	die($e->getMessage());
}

$create_table_sql = <<<CREATE_TABLE_SQL

CREATE TABLE IF NOT EXISTS
	files
(
	id		INTEGER PRIMARY KEY ASC AUTOINCREMENT,
	uuid		TEXT,
	name		TEXT,
	upload_name	TEXT,
	uploaded_at	DATE DEFAULT (datetime('now','localtime')),
	deleted		BOOLEAN DEFAULT 0,
	deleted_at	TIMESTAMP,
	processed	BOOLEAN DEFAULT 0,
	processed_at	TIMESTAMP
);

CREATE_TABLE_SQL;

try
{
	$pdo->exec($create_table_sql);
}
catch(PDOException $e)
{
	die($e->getMessage());
}

?>
</body>
</html>
