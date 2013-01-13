package fineuploader;

import org.apache.commons.fileupload.FileItem;

import javax.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class RequestParser
{
    private static String PART_INDEX_PARAM = "qqpartindex";
    private static String FILE_SIZE_PARAM = "qqtotalfilesize";
    private static String TOTAL_PARTS_PARAM = "qqtotalparts";
    private static String UUID_PARAM = "qquuid";
    private static String PART_FILENAME_PARAM = "qqfilename";

    private String filename;
    private FileItem uploadItem;

    private int partIndex = -1;
    private int totalFileSize;
    private int totalParts;
    private String uuid;
    private String originalFilename;

    private Map<String, String> customParams = new HashMap<>();


    private RequestParser()
    {
    }

    static RequestParser getInstance(HttpServletRequest request, MultipartUploadParser multipartUploadParser) throws Exception
    {
        RequestParser requestParser = new RequestParser();

        requestParser.uploadItem = multipartUploadParser.getFirstFile();
        requestParser.filename = multipartUploadParser.getFirstFile().getName();

        //params could be in body or query string, depending on Fine Uploader request option properties
        parseRequestBodyParams(requestParser, multipartUploadParser);
        parseQueryStringParams(requestParser, request);

        removeQqParams(requestParser.customParams);

        return requestParser;
    }

    public String getFilename()
    {
        return filename;
    }

    public FileItem getUploadItem()
    {
        return uploadItem;
    }

    public int getPartIndex()
    {
        return partIndex;
    }

    public int getTotalFileSize()
    {
        return totalFileSize;
    }

    public int getTotalParts()
    {
        return totalParts;
    }

    public String getUuid()
    {
        return uuid;
    }

    public String getOriginalFilename()
    {
        return originalFilename;
    }

    public Map<String, String> getCustomParams()
    {
        return customParams;
    }

    private static void parseRequestBodyParams(RequestParser requestParser, MultipartUploadParser multipartUploadParser) throws Exception
    {
        String partNumStr = multipartUploadParser.getParams().get(PART_INDEX_PARAM);
        if (partNumStr != null)
        {
            requestParser.partIndex = Integer.parseInt(partNumStr);

            requestParser.totalFileSize = Integer.parseInt(multipartUploadParser.getParams().get(FILE_SIZE_PARAM));
            requestParser.totalParts = Integer.parseInt(multipartUploadParser.getParams().get(TOTAL_PARTS_PARAM));
            requestParser.uuid = multipartUploadParser.getParams().get(UUID_PARAM);
            requestParser.originalFilename = URLDecoder.decode(multipartUploadParser.getParams().get(PART_FILENAME_PARAM), "UTF-8");
        }

        for (Map.Entry<String, String> paramEntry : multipartUploadParser.getParams().entrySet())
        {
            requestParser.customParams.put(URLDecoder.decode(paramEntry.getKey(), "UTF-8"), URLDecoder.decode(paramEntry.getValue(), "UTF-8"));
        }
    }

    private static void parseQueryStringParams(RequestParser requestParser, HttpServletRequest req)
    {
        String partNumStr = req.getParameter(PART_INDEX_PARAM);
        if (partNumStr != null)
        {
            requestParser.partIndex = Integer.parseInt(partNumStr);
            requestParser.totalFileSize = Integer.parseInt(req.getParameter(FILE_SIZE_PARAM));
            requestParser.totalParts = Integer.parseInt(req.getParameter(TOTAL_PARTS_PARAM));
            requestParser.uuid = req.getParameter(UUID_PARAM);
            requestParser.originalFilename = req.getParameter(PART_FILENAME_PARAM);
        }

        Enumeration<String> paramNames = req.getParameterNames();
        while (paramNames.hasMoreElements())
        {
            String paramName = paramNames.nextElement();
            requestParser.customParams.put(paramName, req.getParameter(paramName));
        }
    }

    private static void removeQqParams(Map<String, String> customParams)
    {
        Iterator<Map.Entry<String, String>> paramIterator = customParams.entrySet().iterator();

        while (paramIterator.hasNext())
        {
            Map.Entry<String, String> paramEntry = paramIterator.next();
            if (paramEntry.getKey().startsWith("qq"))
            {
                paramIterator.remove();
            }
        }
    }
}
