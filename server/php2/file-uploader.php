<?php

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/**
 * Handle file upload via XMLHttpRequest
 */
class qqUploadedFileXhr
{
	private $input_name;
	private $uuid_name;

	/**
	 * @param string $input_name = "qqfile"
	 * @param string $uuid_name = "qquuid"
	 */
	public function __construct($input_name = "qqfile", $uuid_name = "qquuid")
	{
		$this->input_name = $input_name;
		$this->uuid_name = $uuid_name;
	}

	/**
	 * Save uploaded file to specified path.
	 *
	 * @param string $path
	 * @return boolean TRUE on success
	 */
	public function save($path)
	{
		// open read-only stream of raw data from request body
		if(!($input = fopen("php://input", "r")))
		{
			return false;
		}

		// create temp file
		if(!($temp = tmpfile()))
		{
			return false;
		}

		// copy input stream to temp file
		$bytes = stream_copy_to_stream($input, $temp);

		// close input
		if(!fclose($input))
		{
			return false;
		}

		// compare bytes copied and request content length
		if($bytes != $this->getSize())
		{
			return false;
		}

		// open target file for writing
		$target = fopen($path, "w");

		// rewind temp file
		if(!rewind($temp))
		{
			return false;
		}

		// copy temp file to target file
		if(!stream_copy_to_stream($temp, $target))
		{
			return false;
		}

		// close target
		if(!fclose($target))
		{
			return false;
		}

		// remove temp file
		if(!fclose($temp))
		{
			return false;
		}

	 	// indicate success
		return true;
	}

	/**
	 * Get original name of file on client machine via query string.
	 *
	 * @return string file name
	 */
	public function getName()
	{
		// check for original name of file in query string
		if(isset($_GET[$this->input_name]))
		{
			// use name of file from query string
			return $_GET[$this->input_name];
		}

	 	// throw exception with error message
		throw new Exception("Name of file not included in query string.");
	}

	/**
	 * Get uuid of file on client machine via query string.
	 *
	 * @return string uuid
	 */
	public function getUuid()
	{
		// check for uuid name of file in query string
		if(isset($_GET[$this->uuid_name]))
		{
			// use uuid from query string
			return $_GET[$this->uuid_name];
		}

	 	// throw exception with error message
		throw new Exception("UUID not included in query string.");
	}

	/**
	 * Get file size via $_SERVER["CONTENT_LENGTH"].
	 *
	 * @return integer file size in bytes
	 * @link http://php.net/manual/en/reserved.variables.server.php
	 */
	public function getSize()
	{
		// check for CONTENT_LENGTH in $_SERVER
		if(isset($_SERVER["CONTENT_LENGTH"]))
		{
			// use CONTENT_LENGTH from $_SERVER
			return (int) $_SERVER["CONTENT_LENGTH"];
		}

	 	// throw exception with error message
		throw new Exception("Getting Content-Length not supported.");
	}
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/**
 * Handle file upload via regular form post using $_FILES superglobal.
 *
 * @link http://php.net/manual/en/reserved.variables.files.php
 */
class qqUploadedFileForm
{
	private $input_name;
	private $uuid_name;

	/**
	 * @param string $input_name = "qqfile"
	 * @param string $uuid_name = "qquuid"
	 * @link http://php.net/manual/en/reserved.variables.files.php
	 */
	public function __construct($input_name = "qqfile", $uuid_name = "qquuid")
	{
		$this->input_name = $input_name;
		$this->uuid_name = $uuid_name;
	}

	/**
	 * Save uploaded file to specified path.
	 *
	 * @param string $path
	 * @return boolean TRUE on success
	 * @link http://php.net/manual/en/function.move-uploaded-file.php
	 * @link http://php.net/manual/en/reserved.variables.files.php
	 */
	public function save($path)
	{
		// use file upload name, move uploaded file to specified path
		return move_uploaded_file($_FILES[$this->input_name]["tmp_name"], $path);
	}

	/**
	 * Get original name of file on client machine via $_FILES.
	 *
	 * @return string file name
	 * @link http://php.net/manual/en/reserved.variables.files.php
	 */
	public function getName()
	{
		// use file upload name, get original name of file on client machine
		return $_FILES[$this->input_name]["name"];
	}

	/**
	 * Get uuid of file on client machine via query string.
	 *
	 * @return string uuid
	 */
	public function getUuid()
	{
		// check for uuid name of file in query string
		if(isset($_GET[$this->uuid_name]))
		{
			// use uuid from query string
			return $_GET[$this->uuid_name];
		}

	 	// throw exception with error message
		throw new Exception("UUID not included in query string.");
	}

	/**
	 * Get file size via $_FILES.
	 *
	 * @return integer file size in bytes
	 * @link http://php.net/manual/en/reserved.variables.files.php
	 */
	public function getSize()
	{
		// use file upload name, get size in bytes of uploaded file
		return $_FILES[$this->input_name]["size"];
	}
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/**
 * Class that encapsulates file-upload internals
 */
class qqFileUploader
{
	private $upload_directory;
	private $allowed_extensions;
	private $max_file_size;
	private $file;
	private $upload_name;
	private $message;

	/**
	 * @param string $upload_directory
	 * @param array $allowed_extensions; defaults to an empty array
	 * @param int $max_file_size; defaults to server's upload_max_filesize setting
	 */
	public function __construct($upload_directory, $allowed_extensions, $max_file_size)
	{
		// set upload directory
		if($upload_directory === null)
		{
			$this->upload_directory = "upload";
		}
		else
		{
			$this->upload_directory = $upload_directory;
		}

		// -----

		// set allowed file extensions
		if($allowed_extensions === null)
		{
			$this->allowed_extensions = null;
		}
		else
		{
			if(is_array($allowed_extensions))
			{
				$allowed_extensions = array_map("strtolower", $allowed_extensions);
			}
			else if(is_string($allowed_extensions))
			{
				$allowed_extensions = array(strtolower($allowed_extensions));
			}

			$this->allowed_extensions = $allowed_extensions;
		}

		// -----

		// set max file size
		if($max_file_size === null)
		{
			$this->max_file_size = $this->from_shorthand(ini_get("upload_max_filesize"));
		}
		else
		{
			$this->max_file_size = $this->from_shorthand($max_file_size);
		}

		// -----

		// verify server settings, e.g. upload directory writable
		$this->verify_server_settings();

		// -----

		// determine file upload method
		if(!isset($_SERVER["CONTENT_TYPE"]))
		{
	 		// throw exception with error message
			throw new Exception("File upload not possible.");
		}
		else if(strpos(strtolower($_SERVER["CONTENT_TYPE"]), "multipart/") === 0)
		{
 			// handle file upload via regular form post
			$this->file = new qqUploadedFileForm();
		}
		else
		{
 			// handle file upload via XMLHttpRequest
			$this->file = new qqUploadedFileXhr();
		}
	}

	/**
	 * Get original name of file on client machine.
	 *
	 * @return string file name
	 */
	public function getName()
	{
		if($this->file)
		{
			return $this->file->getName();
		}
	}

	/**
	 * Get uuid of file on client machine via query string.
	 *
	 * @return string uuid
	 */
	public function getUuid()
	{
		if($this->file)
		{
			return $this->file->getUuid();
		}
	}

	/**
	 * Get file extension.
	 *
	 * @return string file extension
	 */
	public function getExtension()
	{
		if($this->file)
		{
			// get file extension information about file path
			$pathinfo = pathinfo($this->file->getName());

			// verify "extension" exists
			if(isset($pathinfo["extension"]))
			{
				// use lower case file extension
				$extension = strtolower($pathinfo["extension"]);
			}
			else
			{
				// use empty file extension
				$extension = "";
			}

			// return file extension
			return $extension;
		}
	}

	/**
	 * Get file size.
	 *
	 * @return integer file size in bytes
	 */
	public function getSize()
	{
		if($this->file)
		{
			return $this->file->getSize();
		}
	}

	/**
	 * Get uploaded file name.
	 *
	 * @return string uploaded file name
	 */
	public function getUploadName()
	{
		if(isset($this->upload_name))
		{
			return $this->upload_name;
		}
	}

	/**
	 * Get error message.
	 *
	 * @return string error message
	 */
	public function getMessage()
	{
		// error message
		return $this->message;
	}

	/**
	 * Verify server settings.
	 */
	private function verify_server_settings()
	{
		// verify upload directory is writable
		if(!is_writable($this->upload_directory))
		{
	 		// throw exception with error message
			throw new Exception("Upload directory not writable.");
		}

		// -----

		// verify post_max_size > max_file_size
		$post_max_size = $this->from_shorthand(ini_get("post_max_size"));

		if($post_max_size < $this->max_file_size)
		{
			$size = max(1, $this->max_file_size / 1024 / 1024) . "M";

	 		// throw exception with error message
			throw new Exception("Increase post_max_size to " . $size . ".");
		}

		// -----

		// verify upload_max_size > max_file_size
		$upload_max_size = $this->from_shorthand(ini_get("upload_max_filesize"));

		if($upload_max_size < $this->max_file_size)
		{
			$size = max(1, $this->max_file_size / 1024 / 1024) . "M";

	 		// throw exception with error message
			throw new Exception("Increase upload_max_filesize to " . $size . ".");
		}
	}

	/**
	 * Convert shorthand byte value to bytes
	 *
	 * @param string $shorthand
	 * @return integer bytes
	 */
	private function from_shorthand($shorthand)
	{
		$bytes = floatval($shorthand);

		$unit = strtolower(substr($shorthand, -1));

		switch($unit)
		{
		case "g":
			$bytes *= 1024;
			// fall through
		case "m":
			$bytes *= 1024;
			// fall through
		case "k":
			$bytes *= 1024;
			// fall through
		}

		$bytes = intval($bytes);

		return $bytes;
	}

	/**
	 * Convert bytes to shorthand byte value
	 *
	 * @param string $bytes
	 * @param int $precision
	 * @return string shorthand byte value
	 */
	private function to_shorthand($bytes, $precision = 2)
	{
		$units = array("", "k", "m", "g");

		$bytes = max($bytes, 0);
		$pow = floor(($bytes ? log($bytes) : 0) / log(1024));
		$pow = min($pow, count($units) - 1);
		$bytes /= (1 << (10 * $pow));

		$shorthand = round($bytes, $precision) . $units[$pow];

		return $shorthand;
	}

	/**
	 * Get upload file name.
	 */
	private function get_upload_name()
	{
		$path = $this->upload_directory;

		$name = $this->getName();

		// -----

		$file_name = pathinfo($path . DIRECTORY_SEPARATOR . $name, PATHINFO_FILENAME);

		$file_extension = "." . pathinfo($path . DIRECTORY_SEPARATOR . $name, PATHINFO_EXTENSION);

		$new_file = $file_name . $file_extension;

		$copy = 1;

		while(file_exists($path . DIRECTORY_SEPARATOR . $new_file))
		{
			if($copy == 1)
			{
				$new_file = $file_name . " - Copy" . $file_extension;
			}
			else
			{
				$new_file = $file_name . " - Copy (" . $copy . ")" . $file_extension;
			}

			$copy++;
		}

		// -----

		$this->upload_name = $new_file;
	}

	/**
	 * Process uploaded file.
	 *
	 * @return true or false
	 */
	public function process()
	{
		// get file size
		$file_size = $this->getSize();

		// verify file size < max_file_size
		if($file_size > $this->max_file_size)
		{
	 		// set error message
			$this->message = "File too large.";

	 		// indicate error
			return false;
		}

		// -----

		// verify allowed file extension
		if($this->allowed_extensions)
		{
			$extension = $this->getExtension();

			if(!in_array($extension, $this->allowed_extensions))
			{
				$these = implode(", ", $this->allowed_extensions);

	 			// set error message
				$this->message = "Disallowed file extension [" . $extension . "], should be one of [" . $these . "].";

	 			// indicate error
				return false;
			}
		}

		// -----

		// get upload file name
		$this->get_upload_name();

		// -----

		// save uploaded file to specified path
		if($this->file->save($this->upload_directory . DIRECTORY_SEPARATOR . $this->upload_name))
		{
	 		// set error message
			$this->message = "Success.";

	 		// indicate success
			return true;
		}
		else
		{
	 		// set error message
			$this->message = "Could not save uploaded file.";

	 		// indicate error
			return false;
		}
	}
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

?>
