<?php 
	header('Content-type: text/html');
	
	$data = str_repeat("a", 5000);
	 
	echo htmlspecialchars(json_encode($data), ENT_NOQUOTES);
