package fineuploader;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import sun.misc.BASE64Encoder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

public class S3Uploads extends HttpServlet
{
    final String AWS_SECRET_KEY = System.getenv("AWS_SECRET_KEY");


    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        if (req.getServletPath().endsWith("s3/signature"))
        {
            handleSignatureRequest(req, resp);
        }
        else if (req.getServletPath().endsWith("s3/success"))
        {
            handleUploadSuccessRequest(req, resp);
        }
    }

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

    private void handleSignatureRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        resp.setContentType("application/json");
        resp.setStatus(200);

        JsonParser jsonParser = new JsonParser();
        JsonElement contentJson = jsonParser.parse(req.getReader());

        try
        {
            String base64Policy = getBase64Policy(contentJson);
            String signedPolicy = getSignedPolicy(base64Policy);

            JsonObject response = new JsonObject();
//            response.addProperty("badPolicy", true);
            response.addProperty("policy", base64Policy);
            response.addProperty("signature", signedPolicy);

            resp.getWriter().write(response.toString());
        }
        catch (Exception e)
        {
            resp.setStatus(500);
        }
    }

    private void handleUploadSuccessRequest(HttpServletRequest req, HttpServletResponse resp)
    {
        String key = req.getParameter("key");
        String uuid = req.getParameter("uuid");
        String bucket = req.getParameter("bucket");
        String name = req.getParameter("name");

        resp.setStatus(200);

        System.out.println(String.format("Upload successfully sent to S3!  Bucket: %s, Key: %s, UUID: %s, Filename: %s",
                bucket, key, uuid, name));
    }

    private String getBase64Policy(JsonElement policyJson) throws UnsupportedEncodingException
    {
        String policyJsonStr = policyJson.toString();
        String base64Encoded = (new BASE64Encoder()).encode(policyJsonStr.getBytes("UTF-8")).replaceAll("\n","").replaceAll("\r","");

        return base64Encoded;
    }

    private String getSignedPolicy(String base64Policy) throws UnsupportedEncodingException, NoSuchAlgorithmException, InvalidKeyException
    {
        Mac hmac = Mac.getInstance("HmacSHA1");

        hmac.init(new SecretKeySpec(AWS_SECRET_KEY.getBytes("UTF-8"), "HmacSHA1"));

        String signature = (new BASE64Encoder()).encode(hmac.doFinal(base64Policy.getBytes("UTF-8"))).replaceAll("\n", "");

        return signature;
    }
}
