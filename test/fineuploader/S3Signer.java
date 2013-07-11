package fineuploader;

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

/**
 * Servlet endpoint used to sign an S3 API request policy document and return the base64-encoded policy doc along with
 * the signature to the client.
 */
public class S3Signer extends HttpServlet
{
    final String AWS_SECRET_KEY = System.getenv("AWS_SECRET_KEY");


    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException
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
            response.addProperty("policy", base64Policy);
            response.addProperty("signature", signedPolicy);

            resp.getWriter().write(response.toString());
        }
        catch (Exception e)
        {
            resp.setStatus(500);
        }
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
