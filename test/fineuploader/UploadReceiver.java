package fineuploader;

import org.apache.commons.fileupload.servlet.ServletFileUpload;
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

public class UploadReceiver extends HttpServlet
{
    private static File UPLOAD_DIR = new File("test/uploads");
    private static File TEMP_DIR = new File("test/uploadsTemp");

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
        RequestParser requestParser;

        try
        {
            resp.setContentType(CONTENT_TYPE);
            resp.setStatus(RESPONSE_CODE);

            if (ServletFileUpload.isMultipartContent(req))
            {
                MultipartUploadParser multipartUploadParser = new MultipartUploadParser(req, TEMP_DIR, getServletContext());
                requestParser = RequestParser.getInstance(req, multipartUploadParser);
                writeFileForMultipartRequest(requestParser);
                writeResponse(resp.getWriter(), requestParser.generateError() ? "Generated error" : null, false);
            }
            else
            {
                requestParser = RequestParser.getInstance(req, null);
                writeFileForNonMultipartRequest(req, requestParser);
                writeResponse(resp.getWriter(), requestParser.generateError() ? "Generated error" : null, false);
            }
        } catch (Exception e)
        {
            log.error("Problem handling upload request", e);
            if (e instanceof MergePartsException)
            {
                writeResponse(resp.getWriter(), e.getMessage(), true);
            }
            else
            {
                writeResponse(resp.getWriter(), e.getMessage(), false);
            }

        }
    }

    private void writeFileForNonMultipartRequest(HttpServletRequest req, RequestParser requestParser) throws Exception
    {
        String contentLengthHeader = req.getHeader(CONTENT_LENGTH);
        long expectedFileSize = Long.parseLong(contentLengthHeader);

        if (requestParser.getPartIndex() >= 0)
        {
            writeFile(req.getInputStream(), new File(UPLOAD_DIR, requestParser.getUuid() + "_" + String.format("%05d", requestParser.getPartIndex())), null);

            if (requestParser.getTotalParts()-1 == requestParser.getPartIndex())
            {
                File[] parts = getPartitionFiles(UPLOAD_DIR, requestParser.getUuid());
                File outputFile = new File(UPLOAD_DIR, requestParser.getFilename());
                for (File part : parts)
                {
                    mergeFiles(outputFile, part);
                }

                assertCombinedFileIsVaid(requestParser.getTotalFileSize(), outputFile, requestParser.getUuid());
                deletePartitionFiles(UPLOAD_DIR, requestParser.getUuid());
            }
        }
        else
        {
            writeFile(req.getInputStream(), new File(UPLOAD_DIR, requestParser.getFilename()), expectedFileSize);
        }
    }


    private void writeFileForMultipartRequest(RequestParser requestParser) throws Exception
    {
        if (requestParser.getPartIndex() >= 0)
        {
            writeFile(requestParser.getUploadItem().getInputStream(), new File(UPLOAD_DIR, requestParser.getUuid() + "_" + String.format("%05d", requestParser.getPartIndex())), null);

            if (requestParser.getTotalParts()-1 == requestParser.getPartIndex())
            {
                File[] parts = getPartitionFiles(UPLOAD_DIR, requestParser.getUuid());
                File outputFile = new File(UPLOAD_DIR, requestParser.getOriginalFilename());
                for (File part : parts)
                {
                    mergeFiles(outputFile, part);
                }

                assertCombinedFileIsVaid(requestParser.getTotalFileSize(), outputFile, requestParser.getUuid());
                deletePartitionFiles(UPLOAD_DIR, requestParser.getUuid());
            }
        }
        else
        {
            writeFile(requestParser.getUploadItem().getInputStream(), new File(UPLOAD_DIR, requestParser.getFilename()), null);
        }
    }

    private void assertCombinedFileIsVaid(int totalFileSize, File outputFile, String uuid) throws MergePartsException
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

    private File mergeFiles(File outputFile, File partFile) throws Exception
   	{
   		FileOutputStream fos;
   		FileInputStream fis;
   		byte[] fileBytes;
   		int bytesRead = 0;
   		fos = new FileOutputStream(outputFile, true);
   		fis = new FileInputStream(partFile);
   		fileBytes = new byte[(int) partFile.length()];
   		bytesRead = fis.read(fileBytes, 0,(int)  partFile.length());
   		assert(bytesRead == fileBytes.length);
   		assert(bytesRead == (int) partFile.length());
   		fos.write(fileBytes);
   		fos.flush();
   		fis.close();
   		fos.close();

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

    private void writeResponse(PrintWriter writer, String failureReason, boolean restartChunking)
    {
        if (failureReason == null)
        {
            writer.print("{\"success\": true}");
        }
        else
        {
            if (restartChunking)
            {
                writer.print("{\"error\": \"" + failureReason + "\", \"reset\": true}");
            }
            else
            {
                writer.print("{\"error\": \"" + failureReason + "\"}");
            }
        }
    }

    private class MergePartsException extends Exception
    {
        MergePartsException(String message)
        {
            super(message);
        }
    }
}
