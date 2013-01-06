<?php

class qqFileUploader {

    public $allowedExtensions = array();
    public $sizeLimit = null;
    public $inputName = 'qqfile';
    public $chunksFolder = 'chunks/';

    protected $uploadName;
    protected $chunksCleanupProbability = 0.001;
    protected $chunksExpireIn = 604800;

    function __construct(){
        $this->sizeLimit = $this->toBytes(ini_get('upload_max_filesize'));
    }

    /**
     * Get the original filename
     */
    public function getName(){
        if (isset($_FILES[$this->inputName]))
            return $_FILES[$this->inputName]['name'];
    }

    /**
     * Get the name of the uploaded file
     */
    public function getUploadName(){
        return $this->uploadName;
    }

    public function handleUpload($uploadDirectory){

        if (is_writable($this->chunksFolder) &&
            1 == mt_rand(1, 1/$this->chunksCleanupProbability)){
            // Run garbage collection
            $this->cleanupChunks();
        }

        // Check that the max upload size specified in class configuration does not
        // exceed size allowed by server config
        if ($this->toBytes(ini_get('post_max_size')) < $this->sizeLimit ||
            $this->toBytes(ini_get('upload_max_filesize')) < $this->sizeLimit){
            $size = max(1, $this->sizeLimit / 1024 / 1024) . 'M';
            return array('error'=>"Server error. Increase post_max_size and upload_max_filesize to ".$size);
        }

        if (!is_writable($uploadDirectory)){
            return array('error' => "Server error. Upload directory isn't writable.");
        }

        if(!isset($_SERVER['CONTENT_TYPE'])) {
            return array('error' => "No files were uploaded.");
        } else if (strpos(strtolower($_SERVER['CONTENT_TYPE']), 'multipart/') !== 0){
            return array('error' => "Server error. Please set forceMultipart and paramsInBody to default values (true).");
        }

        // Get size and name

        $file = $_FILES[$this->inputName];
        $size = $file['size'];
        $name = isset($_POST['qqfilename']) ? $_POST['qqfilename'] : $file['name'];


        // Validate file size

        if ($size == 0){
            return array('error' => 'File is empty.');
        }

        if ($size > $this->sizeLimit){
            return array('error' => 'File is too large.');
        }

        // Validate name

        if ($name === '' || $name === null){
            return array('error' => 'File name missing.');
        }

        // Validate file extension

        $pathinfo = pathinfo($name);
        $ext = isset($pathinfo['extension']) ? $pathinfo['extension'] : '';

        if($this->allowedExtensions && !in_array(strtolower($ext), array_map("strtolower", $this->allowedExtensions))){
            $these = implode(', ', $this->allowedExtensions);
            return array('error' => 'File has an invalid extension, it should be one of '. $these . '.');
        }

        // Save a chunk

        $totalParts = isset($_POST['qqtotalparts']) ? (int)$_POST['qqtotalparts'] : 1;

        if ($totalParts > 1){

            $chunksFolder = $this->chunksFolder;
            $partIndex = (int)$_POST['qqpartindex'];
            $uuid = $_POST['qquuid'];

            if (!is_writable($chunksFolder)){
                return array('error' => "Server error. Chunks directory isn't writable.");
            }

            $targetFolder = $this->chunksFolder.$uuid;

            if (!file_exists($targetFolder)){
                mkdir($targetFolder);
            }

            $target = $targetFolder.'/'.$partIndex;
            $success = move_uploaded_file($_FILES[$this->inputName]['tmp_name'], $target);

            // Last chunk saved successfully
            if ($success AND ($totalParts-1 == $partIndex)){

                $target = $this->getUniqueTargetPath($uploadDirectory, $name);
                $this->uploadName = basename($target);

                $target = fopen($target, 'w');

                for ($i=0; $i<$totalParts; $i++){
                    $chunk = fopen($targetFolder.'/'.$i, "w");
                    stream_copy_to_stream($chunk, $target);
                    fclose($chunk);
                }

                // Success
                fclose($target);

                for ($i=0; $i<$totalParts; $i++){
                    $chunk = fopen($targetFolder.'/'.$i, "r");
                    unlink($targetFolder.'/'.$i);
                }

                rmdir($targetFolder);

                return array("success" => true);

            }

            return array("success" => true);

        } else {

            $target = $this->getUniqueTargetPath($uploadDirectory, $name);
            $this->uploadName = basename($target);

            if (move_uploaded_file($file['tmp_name'], $target)){
                return array('success'=> true);
            } else {
                return array('error'=> 'Could not save uploaded file.' .
                'The upload was cancelled, or server error encountered');
            }
        }
    }

    /**
     * Returns a path to use with this upload. Check that the name does not exist,
     * and appends a suffix otherwise.
     * @param string $uploadDirectory Target directory
     * @param string $filename The name of the file to use.
     */
    protected function getUniqueTargetPath($uploadDirectory, $filename)
    {
        // Allow only one process at the time to get a unique file name, otherwise
        // if multiple people would upload a file with the same name at the same time
        // only the latest would be saved.

        if (function_exists('sem_acquire')){
            $lock = sem_get(ftok(__FILE__, 'u'));
            sem_acquire($lock);
        }

        $pathinfo = pathinfo($filename);
        $base = $pathinfo['filename'];
        $ext = isset($pathinfo['extension']) ? $pathinfo['extension'] : '';
        $ext = $ext == '' ? $ext : '.' . $ext;

        $unique = $base;
        $suffix = 0;

        // Get unique file name for the file, by appending random suffix.

        while (file_exists($uploadDirectory . DIRECTORY_SEPARATOR . $unique . $ext)){
            $suffix += rand(1, 999);
            $unique = $base.'-'.$suffix.$ext;
        }

        $result =  $uploadDirectory . DIRECTORY_SEPARATOR . $unique . $ext;

        // Create an empty target file
        touch($result);

        if (function_exists('sem_acquire')){
            sem_release($lock);
        }

        return $result;
    }

    protected function cleanupChunks(){
        foreach (scandir($this->chunksFolder) as $item){
            if ($item == "." || $item == "..")
                continue;

            $path = $this->chunksFolder.$item;

            if (!is_dir($path))
                continue;

            if (time() - filemtime($path) > $this->chunksExpireIn){
                $this->removeDir($path);
            }
        }
    }

    protected function removeCdir($dir){
        foreach (scandir($dir) as $item){
            if ($item == "." || $item == "..")
                continue;

            unlink($dir.DIRECTORY_SEPARATOR.$item);
        }
        rmdir($dir);
    }

    /**
     * Converts a given size with units to bytes.
     * @param string $str
     */
    protected function toBytes($str){
        $val = trim($str);
        $last = strtolower($str[strlen($str)-1]);
        switch($last) {
            case 'g': $val *= 1024;
            case 'm': $val *= 1024;
            case 'k': $val *= 1024;
        }
        return $val;
    }
}