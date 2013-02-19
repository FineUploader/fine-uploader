<?php

namespace app\controllers;


class FineUploadController extends \lithium\action\Controller
{
	/*
	 * This example code demonstrates how to integrate Fine
	 * Uploader using an action inside a Lithium controller.
	 *
	 * Normally this would be called from JavaScript on your page.
	 *
	 */
	public function upload() {

		$this->_render['layout'] = false; // no layout
		$this->_render['type'] = 'json';

		$tempfilepath = tempnam(sys_get_temp_dir());

		if ($this->request->is('ajax')) {
			// i.e. do HTML5 streaming upload
			$pathinfo = pathinfo($_GET['qqfile']);
			$filename = $pathinfo['filename'];
			$ext = @$pathinfo['extension'];
			$ext = ($ext == '') ? $ext : '.' . $ext;
			$uploadname = $filename . $ext;
			$input = fopen('php://input', 'r');
			$temp = fopen($tempfilepath, 'w');
			$realsize = stream_copy_to_stream($input, $temp); // write stream to temp file
			@chmod($tempfilepath, 0644);
			fclose($input);
			if ($realsize != (int)$_SERVER['CONTENT_LENGTH']) {
				$results = array('error' => 'Could not save upload file.');
			} else {
				$results = array('success' => true);
			}
		}
		else
		{
			// else do regular POST upload (i.e. for old non-HTML5 browsers)
			$size = $_FILES['qqfile']['size'];
			if ($size == 0) {
				return array('error' => 'File is empty.');
			}
			$pathinfo = pathinfo($_FILES['qqfile']['name']);
			$filename = $pathinfo['filename'];
			$ext = @$pathinfo['extension'];
			$ext = ($ext == '') ? $ext : '.' . $ext;
			$uploadname = $filename . $ext;
			if (!move_uploaded_file($_FILES['qqfile']['tmp_name'], $tempfilepath)) {
				$results = array('error' => 'Could not save upload file.');
			} else {
				@chmod($tempfilepath, 0644);
				$results = array('success' => true);
			}
		}

		return $results; // returns JSON
	}

}
?>
