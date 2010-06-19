<?php 
	header('Content-type: text/html');
	$data = array(
		'example' => "&a<computer networks>, to download means to receive data to a local system from a remote system, or to initiate such a data transfer. Examples of a remote system from which a download might be performed include a webserver, FTP server, email server, or other similar systems. A download can mean either any file that is offered for downloading or that has been downloaded, or the process of receiving such a file.The inverse operation, uploading, can refer to the sending of data from a local system to a remote system such as a server or another client with the intent that the remote system should store a copy of the data being transferred, or the initiation of such a process. The words first came into popular usage among computer users with the increased popularity of Bulletin Board Systems (BBSs), facilitated by the widespread distribution and implementation of dial-up access the in the 1970s",
		'sub' => array('arr'=>array(10,20,30), 'boo'=>false)		 
	); 
	echo htmlspecialchars(json_encode($data), ENT_NOQUOTES);
