using System;
using System.IO;
using System.Web.Mvc;

namespace FineUploader
{
    public class UploadController : Controller
    {
        [HttpPost]
        public FineUploaderResult UploadFile(FineUpload upload, string extraParam1, int extraParam2)
        {
            // asp.net mvc will set extraParam1 and extraParam2 from the params object passed by Fine-Uploader

            var dir = @"c:\upload\path";
            var filePath = Path.Combine(dir, upload.Filename);
            try
            {
                upload.SaveAs(filePath);
            }
            catch (Exception ex)
            {
                return new FineUploaderResult(false, error: ex.Message);
            }

            // the anonymous object in the result below will be convert to json and set back to the browser
            return new FineUploaderResult(true, new { extraInformation = 12345 });
        }
    }
}