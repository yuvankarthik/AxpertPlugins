<%@ WebHandler Language="C#" Class="ABSUpload" %>

using System;
using System.Web;
using System.IO;
using System.Collections;
using System.Web.Script.Serialization;
using System.Web.SessionState;
using System.Threading;
using System.Threading.Tasks;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;


public class ABSUpload : IHttpHandler, IRequiresSessionState
{
    Util.Util util = new Util.Util();
    string scriptsPath = string.Empty;
    string scriptsUrlPath = string.Empty;
    string sid = string.Empty;
    //string containerName = "testblob";
    string configid = string.Empty;
    string keyvalue = string.Empty;
    string fname = string.Empty;
    string transid = string.Empty;
    ASBExt.WebServiceExt asbExt = new ASBExt.WebServiceExt();
    bool isApiSuccess = false;
    String Baseuri = string.Empty;
    string StorageAccountKey = string.Empty;
    string projName = string.Empty;


    private async Task uploadFile(string uri,HttpPostedFile file,HttpContext context)
    {
        byte[] fileBytes;
        using (var stream = file.InputStream)
        {
            using (var memoryStream = new MemoryStream())
            {
                await stream.CopyToAsync(memoryStream);
                fileBytes = memoryStream.ToArray();
            }
        }



        using (HttpClient httpClient = new HttpClient())
        {
            // Create ByteArrayContent from the binary data
            ByteArrayContent content = new ByteArrayContent(fileBytes);

            // Set the content type (adjust based on the type of binary data you are sending)
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
            content.Headers.Add("x-ms-blob-type", "BlockBlob");

            ByteArrayContent Emptycontent = new ByteArrayContent(new byte[0]);


            Emptycontent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
            Emptycontent.Headers.Add("x-ms-blob-type", "BlockBlob");
            HttpResponseMessage response = await httpClient.PutAsync(uri, content);

            // Check the response status
            if (response.IsSuccessStatusCode)
            {
                // updateTable("insert",createdon,createdby);
                isApiSuccess = true;
                context.Response.Write("success:Uploaded Successfully");
                //Console.WriteLine("Binary data uploaded successfully!");
            }
            else
            {
                context.Response.Write("Error: " + response.StatusCode + "-" + response.ReasonPhrase);
            }


        }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/plain";
        string StorageAccountName = "blobconatiner";
        if (System.Configuration.ConfigurationManager.AppSettings["ABSURL"] != null && System.Configuration.ConfigurationManager.AppSettings["ABSURL"] != "" && System.Configuration.ConfigurationManager.AppSettings["ABSKey"] != null && System.Configuration.ConfigurationManager.AppSettings["ABSKey"] != "")
        {
            Baseuri = System.Configuration.ConfigurationManager.AppSettings["ABSURL"].ToString();
            StorageAccountKey = System.Configuration.ConfigurationManager.AppSettings["ABSKey"].ToString().Replace("&amp;","&");
        }
        else
            context.Response.Write("Error: Credentials not available to authenticte azure server" );

        //StorageAccountKey = "?sv=2022-11-02&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2024-01-25T15:15:40Z&st=2024-01-25T07:15:40Z&sip=110.227.107.208&spr=https,http&sig=U2k%2B8WnbV1heTrSPnKYKz%2BYrasLAICkthyecEhS9%2ByY%3D";
       // Baseuri = "https://blobconatiner.blob.core.windows.net/";
            // Baseuri = "https://usblob.blob.core.windows.net/";
        if (context.Request.QueryString["proj"] != null)
            projName = context.Request.QueryString["proj"];
        if (context.Request.QueryString["configid"] != null)
            configid = context.Request.QueryString["configid"];
        if (context.Request.QueryString["keyvalue"] != null)
            keyvalue = context.Request.QueryString["keyvalue"];
        if (context.Request.QueryString["transid"] != null)
            transid = context.Request.QueryString["transid"];


        if (context.Request.Files.Count > 0)
        {
            HttpPostedFile file = context.Request.Files[0];
            fname = file.FileName;
            String uri = Baseuri  + generateBlobFileName() +  StorageAccountKey;
            Task.Run(async () => await uploadFile(uri,file,context)).Wait();
        }
        else
        {
            string Action = string.Empty;
            if (context.Request.QueryString["action"] != null)
                Action = context.Request.QueryString["action"];
            if(Action == "delete")
            {
                string DelFileName = string.Empty;
                if (context.Request.QueryString["delfile"] != null)
                    fname = DelFileName = context.Request.QueryString["delfile"];
                String uri = Baseuri  + generateBlobFileName() +  StorageAccountKey;
                Task.Run(async () => await DeleteFile(uri,context)).Wait();
            }
            else
            {
                string fileName = string.Empty;
                if (context.Request.QueryString["filename"] != null)
                    fname = fileName = context.Request.QueryString["filename"];
                String uri = Baseuri   + generateBlobFileName() +  StorageAccountKey;
                Task.Run(async () => await DownloadFile(uri,fileName,context)).Wait();

            }


        }
    }
    private async Task DownloadFile(string uri, string filename, HttpContext context)
    {
        using (HttpClient client = new HttpClient())
        {
            try
            {
                // Make a GET request to the blob URL
                HttpResponseMessage response = await client.GetAsync(uri);

                if (response.IsSuccessStatusCode)
                {
                    scriptsPath = context.Application["ScriptsPath"].ToString();
                    scriptsUrlPath = context.Application["ScriptsurlPath"].ToString();
                    string sid = string.Empty;
                    string localFilePath = string.Empty;
                    if (context.Session["nsessionid"] != null)
                        sid = context.Session["nsessionid"].ToString();

                    DirectoryInfo di = new DirectoryInfo(scriptsPath + "Axpert\\" + sid +"\\" + "AxABS");
                    //' Determine whether the directory exists.
                    if (di.Exists)
                    {

                    }
                    else
                    {
                        // create the directory.
                        di.Create();
                    }
                    localFilePath = scriptsPath + "Axpert\\" + sid + "\\" + "AxABS\\" + filename;
                    // Save the blob to the local file
                    using (Stream contentStream = await response.Content.ReadAsStreamAsync())
                    {
                        using (FileStream fs = File.Create(localFilePath))
                        {
                            await contentStream.CopyToAsync(fs);
                            fs.Close();
                        }
                    }
                    string result = scriptsUrlPath + "Axpert/" + sid + "/AxABS/" + filename;
                    context.Response.Write("success:" + result);
                }
                else
                {
                    context.Response.Write("Error: " + response.StatusCode + "-" + response.ReasonPhrase);
                }
            }
            catch (Exception ex)
            {
                context.Response.Write("Error: " + ex.Message);
            }
        }

    }
    private async Task DeleteFile(string uri,HttpContext context)
    {
        using (HttpClient httpClient = new HttpClient())
        {

            // Make a POST request with the binary data in the request body
            HttpResponseMessage response = await httpClient.DeleteAsync(uri);

            // Check the response status
            if (response.IsSuccessStatusCode)
            {
                isApiSuccess = true;
                context.Response.Write("success:Deleted Successfully");
            }
            else
            {
                context.Response.Write("Error: " + response.StatusCode + "-" + response.ReasonPhrase);
            }
        }
    }

    private string generateBlobFileName()
    {
        string bfilename = string.Empty;
        bfilename = HttpUtility.UrlEncode(projName + "/" +  transid + "/" + keyvalue + "/" + fname );
        return bfilename;
    }


    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
