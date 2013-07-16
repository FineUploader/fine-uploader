package fineuploader;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class S3Success extends HttpServlet
{
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String key = req.getParameter("key");
        String uuid = req.getParameter("uuid");
        String bucket = req.getParameter("bucket");
        String name = req.getParameter("name");

        resp.setStatus(200);

        System.out.println(String.format("Upload successfully sent to S3!  Bucket: %s, Key: %s, UUID: %s, Filename: %s",
                bucket, key, uuid, name));
    }
}
