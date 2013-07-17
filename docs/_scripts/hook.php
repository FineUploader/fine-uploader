<?php

# Inverse comment if you want to debug
#$output = shell_exec("source /home/fineuploaderdocs/.virtualenvs/docfu/bin/activate; docfu -v -d -b feature/static-doc-generation http://github.com/Widen/fine-uploader /home/fineuploaderdocs/docs.fineuploader.com/");
#print_r($output);

# Base of the docfu command to generate documentation
$DOCFU = "source /home/fineuploaderdocs/.virtualenvs/docfu/bin/activate; docfu ";

# Where to generate documentation
$DEST = "/home/fineuploaderdocs/docs.fineuploader.com/";

# do we have a POST?
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    # does it contain a payload?
    if (isset($_REQUEST['payload'])) {
        $json_payload = $_REQUEST['payload'];

        if (isset($json_payload['ref'])) {
            # decode dat payload
            $payload = json_decode($json_payload, true);
            $url = $payload['repository']['url'];

            # Parse the branch or tag from the payload
            $ref = explode('/', $payload['ref'], 2);
            $ref = $ref[1];
            $ref = explode('/', $ref, 2);

            $ref_type;
            if ($ref[0] === 'heads') {
                $ref_type = 'branch';
                $DOCFU = $DOCFU . "-b ". $ref[1] . " " . $url . " " . $DEST;
            } elseif ($ref[0] == 'tags') {
                $ref_type = 'tag'; 
                $DOCFU = $DOCFU . "-t ". $ref[1] . " " . $url . " " . $DEST;
            }

            $deleted = $payload['deleted'];
            
            # we've deleted a branch, delete the docs
            if ($deleted == TRUE) {
                $stdout = shell_exec("rm -rf " . $DEST . $ref_type . "/" . $ref[1]); 
                print_r($stdout);
            } else {
                print_r($DOCFU);
                $stoud = shell_exec($DOCFU);
                print_r($stdout);
            }
        }
    }
}

?>
