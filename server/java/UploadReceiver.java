package java;

import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;

public class UploadReceiver extends HttpServlet
{
    private static File UPLOAD_DIR = new File("uploads");
    private static File TEMP_DIR = new File("uploadsTemp");

    private static String CONTENT_TYPE = "text/plain";
    private static String CONTENT_LENGTH = "Content-Length";
    private static int RESPONSE_CODE = 200;

    final Logger log = LoggerFactory.getLogger(UploadReceiver.class);


    @Override
    public void init() throws ServletException
    {
        UPLOAD_DIR.mkdirs();
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String contentLengthHeader = req.getHeader(CONTENT_LENGTH);
        Long expectedFileSize = StringUtils.isBlank(contentLengthHeader) ? null : Long.parseLong(contentLengthHeader);
        RequestParser requestParser;

        try
        {
            resp.setContentType(CONTENT_TYPE);
            resp.setStatus(RESPONSE_CODE);

            if (ServletFileUpload.isMultipartContent(req))
            {
                requestParser = RequestParser.getInstance(req, new MultipartUploadParser(req, TEMP_DIR, getServletContext()));
                doWriteTempFileForPostRequest(requestParser);
                writeResponse(resp.getWriter(), null);
            }
            else
            {
                requestParser = RequestParser.getInstance(req, null);
                writeToTempFile(req.getInputStream(), new File(UPLOAD_DIR, requestParser.getFilename()), expectedFileSize);
                writeResponse(resp.getWriter(), null);
            }
        } catch (Exception e)
        {
            log.error("Problem handling upload request", e);
            writeResponse(resp.getWriter(), e.getMessage());
        }
    }


    private void doWriteTempFileForPostRequest(RequestParser requestParser) throws Exception
    {
        writeToTempFile(requestParser.getUploadItem().getInputStream(), new File(UPLOAD_DIR, requestParser.getFilename()), null);
    }

    private File writeToTempFile(InputStream in, File out, Long expectedFileSize) throws IOException
    {
        FileOutputStream fos = null;

        try
        {
            fos = new FileOutputStream(out);

            IOUtils.copy(in, fos);

            if (expectedFileSize != null)
            {
                Long bytesWrittenToDisk = out.length();
                if (!expectedFileSize.equals(bytesWrittenToDisk))
                {
                    log.warn("Expected file {} to be {} bytes; file on disk is {} bytes", new Object[] { out.getAbsolutePath(), expectedFileSize, 1 });
                    throw new IOException(String.format("Unexpected file size mismatch. Actual bytes %s. Expected bytes %s.", bytesWrittenToDisk, expectedFileSize));
                }
            }

            return out;
        }
        catch (Exception e)
        {
            throw new IOException(e);
        }
        finally
        {
            IOUtils.closeQuietly(fos);
        }
    }

    private void writeResponse(PrintWriter writer, String failureReason)
    {
        if (failureReason == null)
        {
            writer.print("{\"success\": true}");
        }
        else
        {
            writer.print("{\"error\": \"" + failureReason + "\"}");
        }
    }
}
