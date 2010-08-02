<?php
/**
 * Base class for file uploads
 * <code>
 * //Only allow images to be uploaded
 * $validTypes = array('jpeg', 'png', 'jpg', 'gif', 'bmp');
 * //determine what kind of upload we are getting from the client
 * if (isset($_GET['qqfile'])) {
 *	$file = new UploadFileXhr($validTypes);
 * } elseif (isset($_FILES['qqfile'])) {
 * 	$file = new UploadFileForm($validTypes);
 * } else {
 * 	$result = array('success' => FALSE, 'error'=> 'No files were uploaded.');
 * }
 *
 * if(empty($result)){
 *	$result['success'] = $file->handleUpload('uploads/');
 *	$result['error'] = $file->getError();
 * }
 * // to pass data through iframe you will need to encode all html tags
 * echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
 * </code>
 */
abstract class Uploader {
	/**
	 * The valid extensions for this uploader (like jpeg, xml, bmp, xls...)
	 * @var array
	 */
	private $validExtensions = array();
	/**
	 * The maximum filesize allowed
	 * @var int
	 */
	private $maxFileSize = 10485760;
	/**
	 * The error that occured
	 * @var string
	 */
	private $error = '';
	/**
	 * @param array $validExtensions a list of valid extensions (like jpeg, xml, bmp, xls...)
	 * @param int $maxFileSize in bytes (default 10 megabytes)
	 */
	public function __construct(array $validExtensions = array(), $maxFileSize = 10485760){
		$this->validExtensions = $validExtensions;
		if((int)$maxFileSize !== $maxFileSize){
			throw new Exception('$maxFileSize should be an integer.');
		}
		$this->maxFileSize = $maxFileSize;
	}
	/**
	 * Save the file to the specified path
	 * @param string $path The path to save the file to
	 * @return boolean TRUE on success
	 */
	abstract protected function save($path);
	/**
	 * Get the name of the uploaded file
	 * @return string
	 */
	abstract protected function getName();
	/**
	 * Get the size of the uploaded file (bytes)
	 * @return int
	 */
	abstract protected function getSize();

	/**
	 * Make sure that the file extension is valid
	 * @param string $ext The file's extension
	 */
	private function validateExtension($ext){
		//make sure that the file has one of the allowed extensions
		if($this->validExtensions && !in_array($ext, $this->validExtensions)){
			$these = implode(', ', $this->validExtensions);
			if(count($this->validExtensions) > 1){
				$this->error = 'File has an invalid extension, it should be one of '. $these.'.';
			} else {
				$this->error = 'File has an invalid extension, it can only be a(n) '. $these.'.';
			}
			return FALSE;
		}
		return TRUE;
	}
	/**
	 * Remove invalid characters from the file name (based on what windows says are bad characters to be safe)
	 * @param string $filename The filename without the extension
	 * @return string
	 */
	private function removeBadCharacters($filename){
		$seach = array('\\','/',':','*','?','"','<','>','|');
		$replace = '_';
		return str_replace($search, $replace, $filename);
	}
	/**
	 * Handle the uploading of the file
	 * @param string $uploadDirectory Where the files are
	 * @param boolean $replaceOldFile Whether or not to replace old files
	 * @return boolean TRUE on success, FALSE on failure
	 */
	public function handleUpload($uploadDirectory, $replaceOldFile = FALSE) {
		if(!is_string($uploadDirectory)){
			throw new Exception('$uploadDir should be a string.');
		}
		$uploadSize = $this->getSize();
		if ($uploadSize == 0) {
			$this->error = 'File is empty.';
			return FALSE;
		}
		if ($uploadSize > $this->maxFileSize) {
			$this->error = 'File is too large';
			return FALSE;
		}
		$uploaded = $this->getName();
		$this->removeBadCharacters($uploaded);
		$pathinfo = pathinfo($this->getName());
		$filename = $pathinfo['filename'];
		$ext = $pathinfo['extension'];
		if(!$this->validateExtension($ext)){
			return FALSE;
		}
		if(!$replaceOldFile){
			/// don't overwrite previous files that were uploaded
			while (file_exists($uploadDirectory . $filename . '.' . $ext)) {
				$filename .= rand(10, 99);
			}
		}

		return $this->save($uploadDirectory . $filename . '.' . $ext);
	}
	public function getError(){
		return $this->error;
	}
}

/**
 * Handle file uploads via XMLHttpRequest
 * @link http://www.w3.org/TR/XMLHttpRequest/
 */
class UploadFileXhr Extends Uploader {
	/**
	 * Save the file to the specified path
	 * @param string $path
	 */
	protected function save($path) {
		$input = fopen("php://input", "r");
		$fp = fopen($path, "w");
		if(!$fp){
			$this->error = 'Could not save uploaded file.';
			return FALSE;
		}
		while ($data = fread($input, 1024)) {
			fwrite($fp, $data);
		}
		fclose($fp);
		fclose($input);
		return TRUE;
	}
	/**
	 * Get the name of the file
	 * @return string
	 */
	protected function getName() {
		return $_GET['qqfile'];
	}
	/**
	 * Get the size of the file
	 * @return int
	 */
	protected function getSize() {
		$headers = apache_request_headers();
		return (int) $headers['Content-Length'];
	}
}

/**
 * Handle file uploads via regular form post (uses the $_FILES array)
 * @link http://php.net/manual/en/reserved.variables.files.php
 */
class UploadFileForm Extends Uploader {

	/**
	 * Save the file to the specified path
	 * @param string $path
	 */
	protected function save($path) {
		if(!@move_uploaded_file($_FILES['qqfile']['tmp_name'], $path)){
			$this->error = 'Could not save uploaded file.';
			return FALSE;
		}
		return TRUE;
	}
	/**
	 * Get the file name
	 * @return string
	 */
	protected function getName() {
		return $_FILES['qqfile']['name'];
	}
	/**
	 * Get the file size in bytes
	 * @return int
	 */
	protected function getSize() {
		return $_FILES['qqfile']['size'];
	}
}

/**
 * This is the example that is used for demo.htm
 */
$validTypes = array();
//determine what kind of upload we are getting from the client
if (isset($_GET['qqfile'])) {
	$file = new UploadFileXhr($validTypes);
} elseif (isset($_FILES['qqfile'])) {
	$file = new UploadFileForm($validTypes);
} else {
	$result = array('success' => FALSE, 'error'=> 'No files were uploaded.');
}

if(empty($result)){
	$result['success'] = $file->handleUpload('uploads/');
	$result['error'] = $file->getError();
}

// to pass data through iframe you will need to encode all html tags
echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);