<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>File Uploader</title>
<link rel="stylesheet" type="text/css" href="fineuploader-3.3-IP.css" />
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
<script type="text/javascript" src="jquery.fineuploader-3.3-IP.js"></script>
<script type="text/javascript">

var uploader = null;

$(function(){

	$("#fine-uploader-button").on("click", function(){
		uploader.fineUploader("uploadStoredFiles");
		return false;
	});


	uploader = $("#fine-uploader").fineUploader({
		request: {
			endpoint: "upload.php",
		},
		maxConnections: 1,
		multiple: true,
		autoUpload: false,
		validation: {
			// 250 MB
			sizeLimit: 250 * 1024 * 1024,
			allowedExtensions: ["jpeg", "jpg", "gif", "png", "exe", "msi", "zip"]
		},
		deleteFile: {
			enabled: true,
			forceConfirm: true
		},
		debug: true,
	}).on("delete", function(event, id){
		var uuid = uploader.fineUploader("getUuid", id);
		$.ajax({type: "post", url: "delete.php", data: { qquuid: uuid}});
	});

});

</script>
</head>
<body>
<div id="fine-uploader"></div>
<button id="fine-uploader-button">Upload</button>
</body>
</html>
