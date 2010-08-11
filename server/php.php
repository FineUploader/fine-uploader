<?php
/**
 * Handle file uploads via XMLHttpRequest
 */
class UploadedFileXhr {
    /**
     * Save the file to the specified path
     * @return boolean TRUE on success
     */
    function save($path) {
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
    function getName() {
        return $_GET['qqfile'];
    }
    function getSize() {
        $headers = apache_request_headers();
        return (int) $headers['Content-Length'];
    }
}

/**
 * Handle file uploads via regular form post (uses the $_FILES array)
 */
class UploadedFileForm {  
    /**
     * Save the file to the specified path
     * @return boolean TRUE on success
     */
    function save($path) {
        if(!@move_uploaded_file($_FILES['qqfile']['tmp_name'], $path)){
            $this->error = 'Could not save uploaded file.';
            return FALSE;
        }
        return TRUE;
    }
    function getName() {
        return $_FILES['qqfile']['name'];
    }
    function getSize() {
        return $_FILES['qqfile']['size'];
    }
}

class FileUploader {
    private $allowedExtensions = array();
    private $sizeLimit = 10485760;
    private $file;

    function __construct(array $allowedExtensions = array(), $sizeLimit = 10485760){    
        $this->validExtensions = $allowedExtensions;
        $this->sizeLimit = $sizeLimit;       

        if (isset($_GET['qqfile'])) {
            $this->file = new UploadedFileXhr();
        } elseif (isset($_FILES['qqfile'])) {
            $this->file = new UploadedFileForm();
        } else {
            $this->file = false; 
        }
    }
    
    /**
     * Returns array('success'=>true) or array('error'=>'error message')
     */
    function handleUpload($uploadDirectory, $replaceOldFile = FALSE) {
        if (!$this->file){
            return array('error' => 'No files were uploaded.');
        }
        
        $size = $this->file->getSize();
        
        if ($size == 0) {
            return array('error' => 'File is empty');
        }
        
        if ($size > $this->sizeLimit) {
            return array('error' => 'File is too large');
        }
        
        $pathinfo = pathinfo($this->file->getName());
        $filename = $pathinfo['filename'];
        $filename = md5(uniqid());
        $ext = $pathinfo['extension'];
        
        if($this->allowedExtensions && !in_array($ext, $this->allowedExtensions)){
            $these = implode(', ', $this->validExtensions);
            return array('error'=> 'File has an invalid extension, it should be one of '. $these . '.');
        }
        
        if(!$replaceOldFile){
            /// don't overwrite previous files that were uploaded
            while (file_exists($uploadDirectory . $filename . '.' . $ext)) {
                $filename .= rand(10, 99);
            }
        }
        
        if ($this->file->save($uploadDirectory . $filename . '.' . $ext)){
            return array('success'=>true);
        } else {
            return array('error'=> 'Server error. File was not saved.');
        }
        
    }    
}

// list of valid extensions, ex. array("jpeg", "xml", "bmp")
$allowedExtensions = array();
// max file size in bytes
$sizeLimit = 10485760;

$uploader = new FileUploader();
$result = $uploader->handleUpload('uploads/');
// to pass data through iframe you will need to encode all html tags
echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
