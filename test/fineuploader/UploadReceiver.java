package fineuploader;

import com.google.gson.JsonObject;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.util.Arrays;
import java.util.regex.Pattern;

//commented code blocks are only used for CORS environments
public class UploadReceiver extends HttpServlet
{
    private static final File UPLOAD_DIR = new File("test/uploads");
    private static File TEMP_DIR = new File("test/uploadsTemp");

    private static String CONTENT_LENGTH = "Content-Length";
    private static int SUCCESS_RESPONSE_CODE = 200;

    final Logger log = LoggerFactory.getLogger(UploadReceiver.class);


    @Override
    public void init() throws ServletException
    {
        UPLOAD_DIR.mkdirs();
    }

    @Override
    public void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        String uuid = req.getPathInfo().replaceAll("/", "");

        handleDeleteFileRequest(uuid, resp);
    }

    private void handleDeleteFileRequest(String uuid, HttpServletResponse resp) throws IOException
    {
        FileUtils.deleteDirectory(new File(UPLOAD_DIR, uuid));

        if (new File(UPLOAD_DIR, uuid).exists())
        {
            log.warn("couldn't find or delete " + uuid);
        }
        else
        {
            log.info("deleted " + uuid);
        }

        resp.setStatus(SUCCESS_RESPONSE_CODE);
//        resp.addHeader("Access-Control-Allow-Origin", "*");
    }

    @Override
    public void doOptions(HttpServletRequest req, HttpServletResponse resp)
    {
        resp.setStatus(SUCCESS_RESPONSE_CODE);
        resp.addHeader("Access-Control-Allow-Origin", "http://192.168.130.118:8080");
//        resp.addHeader("Access-Control-Allow-Credentials", "true");
        resp.addHeader("Access-Control-Allow-Methods", "POST, DELETE");
        resp.addHeader("Access-Control-Allow-Headers", "x-requested-with, cache-control, content-type");
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException
    {
        RequestParser requestParser = null;
        resp.setCharacterEncoding("UTF-8");

        boolean isIframe = req.getHeader("X-Requested-With") == null || !req.getHeader("X-Requested-With").equals("XMLHttpRequest");

        try
        {
//            resp.setContentType(isIframe ? "text/html" : "text/plain");
            resp.setContentType("text/plain");
            resp.setStatus(SUCCESS_RESPONSE_CODE);

//            resp.addHeader("Access-Control-Allow-Origin", "http://192.168.130.118:8080");
//            resp.addHeader("Access-Control-Allow-Credentials", "true");
//            resp.addHeader("Access-Control-Allow-Origin", "*");

            if (req.getParameter("done") != null)
            {
                requestParser = RequestParser.getInstance(req, null);
                File dir = new File(UPLOAD_DIR, requestParser.getUuid());
                File[] parts = getPartitionFiles(dir, requestParser.getUuid());
                File outputFile = new File(dir, requestParser.getFilename());
                for (File part : parts)
                {
                    mergeFiles(outputFile, part);
                }

                assertCombinedFileIsVaid(requestParser.getTotalFileSize(), outputFile, requestParser.getUuid());
                deletePartitionFiles(dir, requestParser.getUuid());
                writeResponse(resp.getWriter(), requestParser.generateError() ? "Generated error" : null, isIframe, false, requestParser, outputFile);
            }
            else if (ServletFileUpload.isMultipartContent(req))
            {
                MultipartUploadParser multipartUploadParser = new MultipartUploadParser(req, TEMP_DIR, getServletContext());
                requestParser = RequestParser.getInstance(req, multipartUploadParser);
                File file = writeFileForMultipartRequest(requestParser);
                writeResponse(resp.getWriter(), requestParser.generateError() ? "Generated error" : null, isIframe, false, requestParser, file);
            }
            else
            {
                requestParser = RequestParser.getInstance(req, null);

                //handle POST delete file request
                if (requestParser.getMethod() != null
                        && requestParser.getMethod().equalsIgnoreCase("DELETE"))
                {
                    String uuid = requestParser.getUuid();
                    handleDeleteFileRequest(uuid, resp);
                }
                else
                {
                    File file = writeFileForNonMultipartRequest(req, requestParser);
                    writeResponse(resp.getWriter(), requestParser.generateError() ? "Generated error" : null, isIframe, false, requestParser, file);
                }
            }
        } catch (Exception e)
        {
            log.error("Problem handling upload request", e);
            if (e instanceof MergePartsException)
            {
                writeResponse(resp.getWriter(), e.getMessage(), isIframe, true, requestParser, null);
            }
            else
            {
                writeResponse(resp.getWriter(), e.getMessage(), isIframe, false, requestParser, null);
            }
        }
    }

    private File writeFileForNonMultipartRequest(HttpServletRequest req, RequestParser requestParser) throws Exception
    {
        File dir = new File(UPLOAD_DIR, requestParser.getUuid());
        dir.mkdirs();

        String contentLengthHeader = req.getHeader(CONTENT_LENGTH);
        long expectedFileSize = Long.parseLong(contentLengthHeader);

        if (requestParser.getPartIndex() >= 0)
        {
            writeFile(req.getInputStream(), new File(dir, requestParser.getUuid() + "_" + String.format("%05d", requestParser.getPartIndex())), null);
        }
        else
        {
            File file = new File(dir, requestParser.getFilename());
            writeFile(req.getInputStream(), file, expectedFileSize);
            return file;
        }

        return null;
    }


    private File writeFileForMultipartRequest(RequestParser requestParser) throws Exception
    {
        File dir = new File(UPLOAD_DIR, requestParser.getUuid());
        dir.mkdirs();

        if (requestParser.getPartIndex() >= 0)
        {
            writeFile(requestParser.getUploadItem().getInputStream(), new File(dir, requestParser.getUuid() + "_" + String.format("%05d", requestParser.getPartIndex())), null);
        }
        else
        {
            File file = new File(dir, requestParser.getFilename());
            writeFile(requestParser.getUploadItem().getInputStream(), file, null);
            return file;
        }

        return null;
    }

    private void assertCombinedFileIsVaid(long totalFileSize, File outputFile, String uuid) throws MergePartsException
    {
        if (totalFileSize != outputFile.length())
        {
            deletePartitionFiles(UPLOAD_DIR, uuid);
            outputFile.delete();
            throw new MergePartsException("Incorrect combined file size!");
        }

    }


    private static class PartitionFilesFilter implements FilenameFilter
    {
        private String filename;
        PartitionFilesFilter(String filename)
        {
            this.filename = filename;
        }

        @Override
        public boolean accept(File file, String s)
        {
            return s.matches(Pattern.quote(filename) + "_\\d+");
        }
    }

    private static File[] getPartitionFiles(File directory, String filename)
    {
        File[] files = directory.listFiles(new PartitionFilesFilter(filename));
        Arrays.sort(files);
        return files;
    }

    private static void deletePartitionFiles(File directory, String filename)
    {
        File[] partFiles = getPartitionFiles(directory, filename);
        for (File partFile : partFiles)
        {
            partFile.delete();
        }
    }

    private File mergeFiles(File outputFile, File partFile) throws IOException
    {
        FileOutputStream fos = new FileOutputStream(outputFile, true);

        try
        {
            FileInputStream fis = new FileInputStream(partFile);

            try
            {
                IOUtils.copy(fis, fos);
            }
            finally
            {
                IOUtils.closeQuietly(fis);
            }
        }
        finally
        {
            IOUtils.closeQuietly(fos);
        }

        return outputFile;
    }

    private File writeFile(InputStream in, File out, Long expectedFileSize) throws IOException
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
                    out.delete();
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

    private void writeResponse(PrintWriter writer, String failureReason, boolean isIframe, boolean restartChunking, RequestParser requestParser, File file)
    {
        JsonObject response = new JsonObject();

        if (failureReason == null)
        {
//            if (isIframe)
//            {
//                writer.print("{\"success\": true, \"uuid\": \"" + requestParser.getUuid() + "\"}<script src=\"http://192.168.130.118:8080/client/js/iframe.xss.response.js\"></script>");
//            }
//            else
//            {


                response.addProperty("success", true);
            response.addProperty("foo", "bar");
                if (file != null)
                {
                    response.addProperty("thumbnailUrl", "/" + file.getPath());
                }
//            }
        }
        else
        {
            response.addProperty("error", failureReason);

            if (restartChunking)
            {
                response.addProperty("reset", true);
            }
            else
            {
//                if (isIframe)
//                {
//                    writer.print("{\"error\": \"" + failureReason + "\", \"uuid\": \"" + requestParser.getUuid() + "\"}<script src=\"http://192.168.130.118:8080/client/js/iframe.xss.response.js\"></script>");
//                }
//                else
//                {


//                }
            }
        }

        writer.write(response.toString());
    }

    private class MergePartsException extends Exception
    {
        MergePartsException(String message)
        {
            super(message);
        }
    }
}
