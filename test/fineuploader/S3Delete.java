package fineuploader;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class S3Delete extends HttpServlet
{
    final String AWS_SECRET_KEY = System.getenv("AWS_SECRET_KEY");


    @Override
    public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String key = req.getParameter("key");
        String bucket = req.getParameter("bucket");

        resp.setStatus(200);

        AWSCredentials myCredentials = new BasicAWSCredentials("AKIAJLRYC5FTY3VRRTDA", AWS_SECRET_KEY);
        AmazonS3 s3Client = new AmazonS3Client(myCredentials);
        s3Client.deleteObject(bucket, key);
    }
}
