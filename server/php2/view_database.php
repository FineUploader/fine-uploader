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

try
{
	$files = $pdo->query("SELECT * FROM files");
}
catch(PDOException $e)
{
	die($e->getMessage());
}

?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>View File Uploader Database</title>
<style>

body
{
	background-color: #ffffff;
}

table
{
	margin: 20px;
	text-align: left;
	border-collapse: collapse;
	border: 1px solid #999999;
	font-size: 12px;
}

thead
{
	background-color: #cccccc;
}

th
{
	padding: 15px 10px 10px 10px;
	font-weight: bold;
	font-size: 14px;
	color: #000000;
}

tbody
{
	background-color: #ffffff;
}

tbody tr
{
	cursor: pointer;
	background-color: #dddddd;
}

tbody tr.odd
{
	color: #000000;
	background-color: #eeeeee;
}

tbody tr:hover td
{
	border-top: 1px dashed #666666;
	border-bottom: 1px dashed #666666;
	background: #ffffff;
	color: #333333;
}

tbody td
{
	padding: 10px;
	border-top: 1px dashed #ffffff;
	color: #666666;
}

tfoot
{
	background-color: #dddddd;
}

tfoot td
{
	border-top: 1px dashed #ffffff;
	padding: 10px;
	font-style: italic;
	font-size: 12px;
	color: #000000;
}

</style>
</head>
<body>
<?php

$fields = array(
	"id",
	"uuid",
	"name",
	"upload_name",
	"uploaded_at",
	"deleted",
	"deleted_at",
	"processed",
	"processed_at",
);

?>
<table summary="View File Uploader Database">
<thead>
<tr>
<?php

foreach($fields as $field)
{
	echo "<th scope=\"col\">$field</th>\n";
}

?>
</tr>
</thead>
<tfoot>
<tr>
<td colspan="<?php echo count($fields); ?>">View File Uploader Database</td>
</tr>
</tfoot>
<tbody>
<?php

$count = 0;

foreach($files as $file)
{
	if($count % 2)
	{
		echo "<tr>\n";
	}
	else
	{
		echo "<tr class=\"odd\">\n";
	}

	foreach($fields as $field)
	{
		echo "<td>";
		echo $file[$field];
		echo "</td>\n";
	}

	echo "</tr>\n";

	$count++;
}

?>
</tbody>
</table>
</body>
</html>
