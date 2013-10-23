package fineuploader;

import com.amazonaws.HttpMethod;
import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
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
import java.net.URL;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

/**
 * Servlet used to handle various requests sent by Fine Uploader when using the "upload directly to S3" module.  The
 * delete file handler depends on the AWS Java SDK.
 */
public class S3Uploads extends HttpServlet
{
    // This assumes your secret key is available in an environment variable.
    // It is needed to sign policy documents.
    final static String AWS_SECRET_KEY_CLIENT = System.getenv("AWS_SECRET_KEY_CLIENT");

    // Secret key for server-side use only, less restrictive
    final static String AWS_SECRET_KEY_SERVER = System.getenv("AWS_SECRET_KEY_SERVER");

    // Public key for server-side use only, less restrictive
    final static String AWS_PUBLIC_KEY_SERVER = "AKIAIVSJT6ARGIAPRAQA";


    // Main entry point for POST requests from Fine Uploader.  This currently assumes delete file requests use the
    // default method of DELETE, but that can be adjusted.
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

    // Main entry point for DELETE requests sent by Fine Uploader.
    @Override
    public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String key = req.getParameter("key");
        String bucket = req.getParameter("bucket");

        resp.setStatus(200);

        AWSCredentials myCredentials = new BasicAWSCredentials(AWS_PUBLIC_KEY_SERVER, AWS_SECRET_KEY_SERVER);
        AmazonS3 s3Client = new AmazonS3Client(myCredentials);
        s3Client.deleteObject(bucket, key);
    }

    // Called by the main POST request handler if Fine Uploader has asked for an item to be signed.  The item may be a
    // policy document or a string that represents multipart upload request headers.
    private void handleSignatureRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        resp.setContentType("application/json");
        resp.setStatus(200);

        JsonParser jsonParser = new JsonParser();
        JsonElement contentJson = jsonParser.parse(req.getReader());
        JsonObject jsonObject = contentJson.getAsJsonObject();
        JsonElement headers = jsonObject.get("headers");
        JsonObject response = new JsonObject();
        String signature;

        try
        {
            // If this is not a multipart upload-related request, Fine Uploader will send a policy document
            // as the value of a "policy" property in the request.  In that case, we must base-64 encode
            // the policy document and then sign it. The will include the base-64 encoded policy and the signed policy document.
            if (headers == null)
            {
                String base64Policy = base64EncodePolicy(contentJson);
                signature = sign(base64Policy);

                // Validate the policy document to ensure the client hasn't tampered with it.
                // If it has been tampered with, set this property on the response and set the status to a non-200 value.
//                response.addProperty("invalid", true);

                response.addProperty("policy", base64Policy);
            }

            // If this is a request to sign a multipart upload-related request, we only need to sign the headers,
            // which are passed as the value of a "headers" property from Fine Uploader.  In this case,
            // we only need to return the signed value.
            else
            {
               signature = sign(headers.getAsString());
            }

            response.addProperty("signature", signature);
            resp.getWriter().write(response.toString());
        }
        catch (Exception e)
        {
            resp.setStatus(500);
        }
    }

    // Called by the main POST request handler if Fine Uploader has indicated that the file has been
    // successfully sent to S3.  You have the opportunity here to examine the file in S3 and "fail" the upload
    // if something in not correct.
    private void handleUploadSuccessRequest(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String key = req.getParameter("key");
        String uuid = req.getParameter("uuid");
        String bucket = req.getParameter("bucket");
        String name = req.getParameter("name");

        resp.setStatus(200);

        System.out.println(String.format("Upload successfully sent to S3!  Bucket: %s, Key: %s, UUID: %s, Filename: %s",
                bucket, key, uuid, name));

        AWSCredentials myCredentials = new BasicAWSCredentials(
                                        AWS_PUBLIC_KEY_SERVER, AWS_SECRET_KEY_SERVER);
        AmazonS3 s3Client = new AmazonS3Client(myCredentials);

        java.util.Date expiration = new java.util.Date();
        long msec = expiration.getTime();
        msec += 1000 * 60 * 60; // 1 hour.
        expiration.setTime(msec);

        GeneratePresignedUrlRequest generatePresignedUrlRequest =
                      new GeneratePresignedUrlRequest(bucket, key);
        generatePresignedUrlRequest.setMethod(HttpMethod.GET); // Default.
        generatePresignedUrlRequest.setExpiration(expiration);

        URL s = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

        JsonObject response = new JsonObject();
        response.addProperty("thumbnailUrl", s.toString());

        resp.getWriter().write(response.toString());
    }

    private String base64EncodePolicy(JsonElement jsonElement) throws UnsupportedEncodingException
    {
        String policyJsonStr = jsonElement.toString();
        String base64Encoded = (new BASE64Encoder()).encode(policyJsonStr.getBytes("UTF-8")).replaceAll("\n","").replaceAll("\r", "");

        return base64Encoded;
    }

    private String sign(String toSign) throws UnsupportedEncodingException, NoSuchAlgorithmException, InvalidKeyException
    {
        Mac hmac = Mac.getInstance("HmacSHA1");
        hmac.init(new SecretKeySpec(AWS_SECRET_KEY_CLIENT.getBytes("UTF-8"), "HmacSHA1"));
        String signature = (new BASE64Encoder()).encode(hmac.doFinal(toSign.getBytes("UTF-8"))).replaceAll("\n", "");

        return signature;
    }
}
