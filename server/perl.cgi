#!/usr/bin/perl

    use strict;
    use CGI::Carp qw(fatalsToBrowser);

    use Digest::MD5;

    my $uploaddir = '/folder/to/save/in/ajax_upload/tmp_uploads';

    my $maxFileSize = 0.5 * 1024 * 1024; # 1/2mb max file size...

    use CGI;
    my $IN = new CGI;

    my $file = $IN->param('POSTDATA');
    my $temp_id = $IN->param('temp_id');

	# make a random filename, and we guess the file type later on...
    my $name = Digest::MD5::md5_base64( rand );
       $name =~ s/\+/_/g;
       $name =~ s/\//_/g;

    my $type;
    if ($file =~ /^GIF/) {
        $type = "gif";
    } elsif ($file =~ /PNG/) {
        $type = "png";
    } elsif ($file =~ /JFIF/) {
        $type = "jpg";
    }

    if (!$type) {
        print qq|{ "success": false, "error": "Invalid file type..." }|;
        print STDERR "file has been NOT been uploaded... \n";
    }

    print STDERR "Making dir: $uploaddir/$temp_id \n";

    mkdir("$uploaddir/$temp_id");

    open(WRITEIT, ">$uploaddir/$name.$type") or die "Cant write to $uploaddir/$name.$type. Reason: $!";
        print WRITEIT $file;
    close(WRITEIT);

    my $check_size = -s "$uploaddir/$name.$type";

    print STDERR qq|Main filesize: $check_size  Max Filesize: $maxFileSize \n\n|;

    print $IN->header();
    if ($check_size < 1) {
        print STDERR "ooops, its empty - gonna get rid of it!\n";
        print qq|{ "success": false, "error": "File is empty..." }|;
        print STDERR "file has been NOT been uploaded... \n";
    } elsif ($check_size > $maxFileSize) {
        print STDERR "ooops, its too large - gonna get rid of it!\n";
        print qq|{ "success": false, "error": "File is too large..." }|;
        print STDERR "file has been NOT been uploaded... \n";
    } else  {
        print qq|{ "success": true }|;

        print STDERR "file has been successfully uploaded... thank you.\n";
    }