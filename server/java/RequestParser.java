package java;

import org.apache.commons.fileupload.FileItem;

import javax.servlet.http.HttpServletRequest;

public class RequestParser
{
    private static String FILENAME_PARAM = "qqfile";

    private String filename;
    private FileItem uploadItem;

    private RequestParser()
    {
    }

    //2nd param is null unless a MPFR
    static RequestParser getInstance(HttpServletRequest request, MultipartUploadParser multipartUploadParser) throws Exception
    {
        RequestParser requestParser = new RequestParser();

        if (multipartUploadParser != null)
        {
            requestParser.uploadItem = multipartUploadParser.getFirstFile();
            requestParser.filename = multipartUploadParser.getFirstFile().getName();
        }
        else
        {
            requestParser.filename = request.getParameter(FILENAME_PARAM);
        }

        //grab other params here...

        return requestParser;
    }

    public String getFilename()
    {
        return filename;
    }

    //only non-null for MPFRs
    public FileItem getUploadItem()
    {
        return uploadItem;
    }
}
