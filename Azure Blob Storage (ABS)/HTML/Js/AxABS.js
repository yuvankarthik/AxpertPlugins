var myDropzone;
var transid = "";
var keyvalue = "";
var activeFileCate = "";
var activeConfigid = "";
var activeLayout = "list";
var previwDrawer;
var ArrFileCategory = [];
var defObj = [];
var dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
});
var dataObj=[];
function updateToTable(recordid,isdelete,filename,createdon){

    if(isdelete){
        AxSetValue("AXPKEY000000010012", "deleted", "1", "1", "T");
    }
    else{
        AxSetValue("AXPKEY000000010012", "file_category", "1", "1", activeFileCate);
        AxSetValue("AXPKEY000000010012", "config_doc_number", "1", "1", activeConfigid);
       // AxSetValue("AXPKEY000000010012", "deleted ", "1", "1", "F");
        AxSetValue("AXPKEY000000010012", "file_name", "1", "1", filename);
        AxSetValue("AXPKEY000000010012", "key_fieldvalue", "1", "1", keyvalue);
        //AxSetValue("AXPKEY000000010012", "createdon", "1", "1", createdon);
    }
    let result = AxCallSubmitDataAPI("AXPKEY000000010012", recordid);
    return result;
}
(function ($) {
function AxABS(){

   _getCategoryIcon = function(cat){
 
        let iconName = "folder";
 
        switch (cat.toLowerCase()) {
            case "pocopy":
                iconName = "description";
                break;
            case "letter":
                iconName = "local_post_office";
            break;
            case "qc report":
                iconName = "insights";
            break;
        }
        return iconName;
    },
       
    _changeCategory = function(configid,ele){
        $(".foldername li").removeClass("active");
        if(configid == "ALL"){
            $(`.uploaded-files_container tr,#cardsLayout .card`).removeClass("d-none");
            myDropzone?.disable();
            $("#DZUploadFile").addClass("dzdisabled");
            //logictoShowAllFiles
        }else{
            myDropzone?.enable();
            $("#DZUploadFile").removeClass("dzdisabled");
            //logic to Show Files of the same category
            $(`.uploaded-files_container tr:not([data-configid='${configid}'])`).addClass("d-none");
            $(`.uploaded-files_container tr[data-configid='${configid}']`).removeClass("d-none");
            $(`#cardsLayout .card:not([data-configid='${configid}'])`).addClass("d-none");
            $(`#cardsLayout .card[data-configid='${configid}']`).removeClass("d-none");
            // $(`.uploaded-files_container tr`).toggleClass("d-none", function() {
            //     return $(this).data("filecat") !== catName;
            //   });
            $(ele).parent('li').addClass('active');
             
            _activateDropZone(configid)
        }
       
    } ,
    _getFileCategories =  function(){
        let uniqueJsonSet = new Set();
        defObj.forEach(obj => {
          let extractedObject = { configid: obj.config_doc_number, cat: obj.file_category };
          let jsonString = JSON.stringify(extractedObject);
          uniqueJsonSet.add(jsonString);
        });
        ArrFileCategory =  uniqueJsonArray = Array.from(uniqueJsonSet).map(jsonString => JSON.parse(jsonString));


    },
    _generatecategoryMenu =  function(){
                     
        if(ArrFileCategory.length){
            return `<div class="card ">
                        <div class="card-header collapsible cursor-pointer rotate"
                            aria-expanded="true"  onclick="_changeCategory('ALL',this)" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#Emp1">
							<h3 class="card-title"> My Drive </h3>
                            <div class="card-toolbar  rotate-90 " >
                                <span class="material-icons material-icons-style material-icons-2 rotate-90">
                                    navigate_next
                                </span>
                            </div>
                            

                        </div>
						
						
                        <div class="collapse show" id="Emp1">
                            <div class="card-body">
                                <ul class="foldername ps-4">
                                    ${ArrFileCategory.map((ele,index)=>{
                                        return `<li>
                                                    <a href="javascript:void(0)" title="${ele.cat}" onclick="_changeCategory('${ele.configid}',this)">
                                                            <span class="material-icons material-icons-style material-icons-2">${_getCategoryIcon(ele.cat) } </span>
                                                            ${ele.cat}
                                                    </a>
                                                </li>`
                                        }).join("")}
                                </ul>
                            </div>
                        </div>
                    </div>`;
        }
    },
    _dropZonePreviewTemplate = `<tr class = "dz-preview">
            <td>
               <label class="Uploaded_file_name" data-dz-name></label>
               <div class="Uploaded_file_details">Created on :<a href="javascript:void(0)"
                     class="last-updated-date"></a>
               </div>
            </td>
            <td class="Uploaded_file_actn-btns">
               <a href="javascript:void(0)" id="" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm " >
                  <span class="material-icons material-icons-style material-icons-2">cloud_download</span>
               </a>
               <a href="javascript:void(0)" id="" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm">
                  <span class="material-icons material-icons-style material-icons-2">visibility</span>
               </a>
               <a href="javascript:void(0)" id=""  class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm ">
                  <span class="material-icons material-icons-style material-icons-2 text-danger">delete</span>
               </a>
            </td>
         </tr>`,

    _activateDropZone = function(configId){

            //fileCate = catId;
            //also update config id
            let configJson = JSON.parse(JSON.stringify(defObj.find(function(item) {
                return item.config_doc_number === configId;
            })))  ;
            $("#categoryDDLink").text(configJson.file_category);
            activeConfigid = configJson.config_doc_number;
            activeFileCate = configJson.file_category;
       // $(".dropzone-overlay").each(function () {
            let id = "#DZUploadbtn";
            const dropzoneEle = document.querySelector("#DZUploadbtn");
            // let previewNode = dropzoneEle.querySelector(".dropzone-item");
            // previewNode.id = "";
            // let previewTemplate = previewNode.parentNode.innerHTML;
            // previewNode.parentNode.removeChild(previewNode);
            let projName = callParentNew("mainProject");
            let url = location.href.split(projName)[0];
            configJson.file_extensions = configJson.file_extensions.split(",").map(element =>  "." + element.toLowerCase() ).join(",");

           if(myDropzone){
                myDropzone.options.url =  `${url}AxPlugins/AxABS/ABSUpload.ashx?proj=${projName}&transid=${transid}&keyvalue=${keyvalue}&configid=${activeConfigid}&user=${callParentNew("mainUserName")}`;
                myDropzone.options.maxFilesize = configJson.file_maxsize;
                myDropzone.options.acceptedFiles =  configJson.file_extensions;
           }
           else{
                myDropzone = new Dropzone(id, { // Make the whole body a dropzone
                url: `${url}AxPlugins/AxABS/ABSUpload.ashx?category=$proj=${projName}&transid=${transid}&keyvalue=${keyvalue}&configid=${activeConfigid}&user=${callParentNew("mainUserName")}`,
                maxFilesize: configJson.file_maxsize, // Max filesize in MB
                //maxFilesize: 0.1,
                // previewTemplate: _dropZonePreviewTemplate,
                previewsContainer: ".dz-preview", // Define the container to display the previews.
                clickable:"#DZUploadFile", // Define the element that should be used as click trigger to select files.
                dictDuplicateFile: "Duplicate Files Cannot Be Uploaded",
                preventDuplicates: true,
                acceptedFiles: configJson.file_extensions,
                autoProcessQueue: false,
                uploadprogress: function(file, progress, bytesSent) {
                    // if (file.previewElement) {
                    //     var progressElement = file.previewElement.querySelector("[data-dz-uploadprogress]");
                    //     progressElement.style.width = progress + "%";
                    //     progressElement.querySelector(".dz-upload").textContent = progress + "%";
                    // }
                    $(".progressDetails .progFileName").text(file.name);
                    if(parseInt(progress) <= "90"){
                        $(".progressDetails .progressValue").text(progress + "%");
                        $(".progressDetails .progress-bar")[0].style.width = progress + "%"
                    }
                    else{
                        $(".progressDetails .progressValue").text("90%");
                        $(".progressDetails .progress-bar")[0].style.width = "90%";
                    }
                }
            });

                myDropzone.off("myDropzoneAddedfile").on("addedfile", function myDropzoneAddedfile(file) {

                    if(dataObj?.length === 0 || !dataObj.some(item => item.file_name === file.name)){
                        // Hookup the start button
                        callParentNew("loadFrame();","function");
                        //$(".progressDetails .progFileName").text(file.name);
                        $(".progressDetails").removeClass("d-none").find(".progFileName").text(file.name);
                        $(".progressDetails .progressValue").text("0%");
                        $(".progressDetails .progress-bar")[0].style.width = "0%"
                        file.createdon = dateFormatter.format(new Date()).replaceAll("/","-");
                        //file.createdon = new Date()

                        file.configid = activeConfigid;
                        this.options.url = `${url}AxPlugins/AxABS/ABSUpload.ashx?proj=${projName}&transid=${transid}&keyvalue=${keyvalue}&configid=${activeConfigid}&user=${callParentNew("mainUserName")}&createdon=${encodeURIComponent(file.createdon)}`;
                        setTimeout(() => {
                            myDropzone.processQueue();
                        }, 100);
                        const dropzoneItems = dropzoneEle.querySelectorAll('.dropzone-item');
                        dropzoneItems.forEach(dropzoneItem => {
                            dropzoneItem.style.display = '';
                        });
                    }
                    else{
                        myDropzone.removeFile(file);
                        showAlertDialog("error","There is alredy a file with the same name.Change the file name and upload again.")
                    }

                }); 

                myDropzone.off("myDropzoneComplete").on("complete", function myDropzoneComplete(progress) {
                    callParentNew("closeFrame();","function")
                    const progressBars = dropzoneEle.querySelectorAll('.dz-complete');
                    if (progress.status == 'success') {
                        if (progress.xhr.response == "success" || progress.xhr.response.startsWith("success:")) {
                            let mesg = progress.xhr.response;
                                
                                // let id  = progress.configid + encodeURIComponent(progress.name.split(".")[0]);
                            let result = updateToTable('0',false,progress.name,progress.createdon);

                            if(result.startsWith("Error")){
                                showAlertDialog("Error", "Error while updating file details in table.Reverting the process..");
                            }
                            else{
                                    let resultJson = JSON.parse(result);
                                    let recordid = resultJson.result?.split("=")[1];
                                    dataObj.push({
                                        recordid: recordid,
                                        key_fieldvalue: keyvalue,
                                        detail_fieldvalue:"",
                                        file_category: activeFileCate,
                                        file_name:progress.name,
                                        config_doc_number:activeConfigid,
                                        createdon:progress.createdon
                                    });
                                    $(".uploaded-files_container").append( `<tr data-configid = '${progress.configid}' data-filename ='${progress.name.split(".")[0]}'> 
                                    <td>
                                    <label class="Uploaded_file_name">${progress.name}</label>
                                    <div class="Uploaded_file_details">
                                        ${_ConstructFileExtBadge(progress.name,'list')}
                                        <span>Created on : <h6 class="last-updated-date">${progress.createdon}</h6></span>
                                    </div>
                                    </td>
                                    <td class="Uploaded_file_category">${activeFileCate}</td>
                                    <td class="Uploaded_file_actn-btns">
                        
                                    <a href="javascript:void(0)" id="" onclick ="_downlodeAttachment('${progress.name}')" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm " >
                                        <span class="material-icons material-icons-style material-icons-2">cloud_download</span>
                                    </a>
                                    <a href="javascript:void(0)" id="" onclick ="_downlodeAttachment('${progress.name}',true)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm">
                                        <span class="material-icons material-icons-style material-icons-2">visibility</span>
                                    </a>
                                    <a href="javascript:void(0)" id="" onclick ="_deleteAttachment('${progress.name}','${progress.configid}','${recordid}',this)"  class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm ">
                                        <span class="material-icons material-icons-style material-icons-2 text-danger">delete</span>
                                    </a>
                        
                                    </td>
                        
                                    </tr>`);

                                    $("#cardsLayout").append(`<div  class="card  col-md-4" data-configid ='${progress.configid}'data-filename ='${progress.name.split(".")[0]}'>
										<div class="Tile_view_files_cards ">
                            <div class="card-header">      
                            <div class="card-title d-flex">
                            <div class="Tile-File-Name">${progress.name}</div>
                            <span class=" Tile-File-type">${_ConstructFileExtBadge(progress.name,'cards')}</span>
                            </div>          
                            </div>    
                                <div class="card-body">
								<span class="material-icons material-icons-style material-icons-2" >add_photo_alternate
</span>
                                </div>                            
    
    
                                <div class="card-footer d-flex ">                               
                                       
                                    <div class="d-flex flex-column"> 
                                    <div class="date-label">created on</div>
                                    <div class="last-update-date">${progress.createdon}</div>
                                    </div> 
    
    
                                       <div class ="d-flex justify-content-between align-items-center">
                                        <a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Downlode" onclick ="_downlodeAttachment('${progress.name}')">
                                        <span class="material-icons material-icons-style material-icons-3 me-0 ">download</span>
                                        </a>
                                        <a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Preview" onclick ="_downlodeAttachment('${progress.name}',true)">
                                        <span class="material-icons material-icons-style material-icons-3 me-0 ">visibility</span>
                                        </a>
                                        <a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Delete" onclick ="_deleteAttachment('${progress.name}','${progress.configid}','${recordid}',this)">
                                        <span class="material-icons material-icons-style material-icons-3 me-0 text-danger">delete</span>
                                        </a>
                                       </div>
                                </div></div>
                                    </div>`);
                                        // let currentCount = parseInt($("#countValue").text(), 10);
                                        // $("#fileCount #countValue").text((currentCount + 1).toString().padStart(2, '0'));
                                    $(".progressDetails .progress-bar")[0].style.width = "100%";
                                    $(".progressDetails .progressValue").text("100%");
                                    showAlertDialog("success", mesg.split(":")[1]);
                            }

                            

                            
                                
                        } else if (progress.xhr.response == 'error:File already exists, please rename and upload again!') {
                            let mesg = progress.xhr.response;
                            // isSameFile = true;
                            myDropzone.removeFile(progress);
                            showAlertDialog("error", mesg.split(":")[1]);
                        } else {
                            let mesg = progress.xhr.response;
                            myDropzone.removeFile(progress);
                            showAlertDialog("error", mesg.split(":")[1]);
                        }
                    } 
                    $(".progressDetails").addClass("d-none");
                    // else {
                    //     if (progress.status == 'error')
                    //         showAlertDialog("error", $(progress.previewTemplate).find(".dropzone-error").text());
                    // }
                });
                myDropzone.off("myDropzoneError").on("error", function myDropzoneError(file,message) {
                    // if(message.toLowerCase().startsWith("file is too big")){
                    //     showAlertDialog('error', eval(callParent('lcm[80]')).replace("{0}", attachmentSizeMB))
                    // }
                    showAlertDialog('error',message);
                    myDropzone.removeFile(file);
                    $(".progressDetails").addClass("d-none");
                });
            
                myDropzone.off("myDropzoneRemovedfile").on("removedfile", function myDropzoneRemovedfile(file) {
                    // let id = file.ConfigId + encodeURIComponent(file.name.split(".")[0]);
                    $(`.uploaded-files_container li[data-filename='${$.escapeSelector(file.name.split(".")[0])}']`).remove();
                    $(`#cardsLayout .card[data-filename='${$.escapeSelector(file.name.split(".")[0])}']`).remove();
                    // let currentCount = parseInt($("#countValue").text(), 10);
                    // $("#fileCount #countValue").text((currentCount - 1).toString().padStart(2, '0'));
                });
           }
            const dzdefault = dropzoneEle.querySelectorAll('.dz-default');
            $(dzdefault).addClass("d-none");
  
            
    },
    _constructAttachList = function(){
        if(dataObj.length){
           let listHtml =  dataObj.map((fileObj )=>  {
            var DZFile = {
                name: fileObj.file_name,
                size: "0",
                status: Dropzone.ADDED,
                accepted: true,
                configid:fileObj.config_doc_number
            };
            // myhdrDropzone.emit("addedfile", file);
            // myhdrDropzone.emit("complete", file);
            myDropzone?.files.push(fileObj);
            // let id = fileObj.ConfigId + encodeURIComponent(fileObj.filename.split(".")[0]);
            return `<tr data-configid = '${fileObj.config_doc_number}' data-filename = '${fileObj.file_name.split(".")[0]}'>
            <td>
               <label class="Uploaded_file_name">${fileObj.file_name}</label>
               <div class="Uploaded_file_details">
                  ${_ConstructFileExtBadge(fileObj.file_name,'list')}
                  <span>Created on : <h6 class="last-updated-date">${formatDate(fileObj.createdon)}</h6></span>
               </div>
            </td>
            <td class="Uploaded_file_category">${fileObj.file_category}</td>
            <td class="Uploaded_file_actn-btns">

               <a href="javascript:void(0)" id="" onclick ="_downlodeAttachment('${fileObj.file_name}')" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm " >
                  <span class="material-icons material-icons-style material-icons-2">cloud_download</span>
               </a>
               <a href="javascript:void(0)" id="" onclick ="_downlodeAttachment('${fileObj.file_name}',true)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm">
                  <span class="material-icons material-icons-style material-icons-2">visibility</span>
               </a>
               <a href="javascript:void(0)" id="" onclick ="_deleteAttachment('${fileObj.file_name}','${fileObj.config_doc_number}','${fileObj.recordid}',this)"  class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm ">
                  <span class="material-icons material-icons-style material-icons-2 text-danger">delete</span>
               </a>

            </td>

         </tr>`}).join("");
            $(".uploaded-files_container").html(listHtml);
            
        }
         //$("#fileCount #countValue").text(dataObj.length.toString().padStart(2, '0'));
    }
    _generateCardsLayout = function(){
        if(dataObj.length){
            let cardsHTML =  dataObj.map((fileObj )=>  {
                return `<div data-configid = '${fileObj.config_doc_number}' data-filename ='${fileObj.file_name.split(".")[0]}' class="card col-md-4" >

<div class=" Tile_view_files_cards ">
<div class="card-header">      
<div class="card-title d-flex">
<div class="Tile-File-Name">${fileObj.file_name}</div>
<span class=" Tile-File-type">${_ConstructFileExtBadge(fileObj.file_name,'cards')}</span>
</div>          
</div>

<div class="card-body">
<span class="material-icons material-icons-style material-icons-2" >add_photo_alternate
</span>
</div>
<div class="card-footer d-flex ">                         

<div class="d-flex flex-column"> 
<div class="date-label">created on</div>
<div class="last-update-date">${formatDate(fileObj.createdon)}</div>
</div>
<div class ="d-flex justify-content-between align-items-center">
<a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Downlode" onclick ="_downlodeAttachment('${fileObj.file_name}')">
<span class="material-icons material-icons-style material-icons-3 me-0 ">download</span>
</a>
<a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Preview" onclick ="_downlodeAttachment('${fileObj.file_name}',true)">
<span class="material-icons material-icons-style material-icons-3 me-0 ">visibility</span>
</a>
<a href="javascript:void(0)" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm me-1" title="Delete" onclick ="_deleteAttachment('${fileObj.file_name}','${fileObj.config_doc_number}','${fileObj.recordid}',this)">
<span class="material-icons material-icons-style material-icons-3 me-0 text-danger">delete</span>
</a>
</div>
</div></div>
</div>` }).join("");
            $("#cardsLayout").html(cardsHTML);
            
        }
            
    },
    _switchLayout = function (layout,currele){
        activeLayout = layout;
        $(".btn-SwitchLayout .btn").removeClass("btn-primary btn-white");
        if(layout == 'list'){
            $("#listLayout").removeClass("d-none");
            $("#cardsLayout").addClass("d-none");
            $(".btn-SwitchLayout .btn.list").removeClass("btn-white").addClass("btn-primary");
            $(".btn-SwitchLayout .btn.cards").removeClass("btn-primary").addClass("btn-white");
        }
        else{
            $("#listLayout").addClass("d-none");
            $("#cardsLayout").removeClass("d-none");
            $(".btn-SwitchLayout .btn.cards").removeClass("btn-white").addClass("btn-primary");
            $(".btn-SwitchLayout .btn.list").removeClass("btn-primary").addClass("btn-white");
        }
    },
    _ConstructFileExtBadge = function(name,layout='list'){
        let colorClass = ""
        let extension = name.split(".")[1].toLowerCase();
        switch (extension) {
            case "pdf":
                colorClass = `danger`
                break;
            case "jpeg":
            case "jpg":
                    colorClass = `info`
                    break;
            case "png":
                colorClass = `warning`
                break;
            case "xls":
            case "xlsx":
                colorClass = `success`
                break;
            case "doc":
                colorClass = `dark`
                break;
            case "txt":
                colorClass = `secondary`
                break;
        
            default:
                colorClass = `primary`
                break;
        }
       if(layout == "list"){
            return `<span class="badge bg-${colorClass} rounded-0  px-3 py-2">${extension}</span>`;
       }
       else{
            return`<span class="badge bg-${colorClass} rounded-0  px-3 py-2">${extension}</span> <div class="fs-20 cardsThumbnail  opacity-25 ${name.split(".")[1]}"  style="font-size: 72px !important;font-weight: 800;"></div>`
       }
        
    }
    _deleteAttachment = function(attachName,config_id,recordid,currele){
       //var _this = this;
            var cutMsg = eval(callParent('lcm[47]'));
            var glType = eval(callParent('gllangType'));
            var isRTL = false;
            if (glType == "ar")
                isRTL = true;
            else
                isRTL = false;
            var RemoveFileCB = $.confirm({
                theme: 'modern',
                title: eval(callParent('lcm[155]')),
                onContentReady: function () {
                    disableBackDrop('bind');
                },
                backgroundDismiss: 'false',
                rtl: isRTL,
                escapeKey: 'buttonB',
                content: cutMsg,
                buttons: {
                    buttonA: {
                        text: eval(callParent('lcm[164]')),
                        btnClass: 'btn btn-primary',
                        action: function () {
                            callParentNew("loadFrame();","function");

                                RemoveFileCB.close();
                                let projName = callParentNew("mainProject");
                                let url = location.href.split(projName)[0];
                                $.post( `${url}AxPlugins/AxABS/ABSUpload.ashx?action=delete&proj=${projName}&transid=${transid}&keyvalue=${keyvalue}&configid=${config_id}&user=${callParentNew("mainUserName")}&delfile=${attachName}`)
                                .done(function(data) {
                                    if(data.toLowerCase().startsWith("success:")){
                                        let result = updateToTable(recordid,true);
                                        if(result.startsWith("Error")){
                                            showAlertDialog("Error", "Error while updating table");
                                        }
                                        else{
                                            showAlertDialog("success", data );
                                        }
                                        let delfileObj = myDropzone?.files?.filter(file => file.name == attachName)?.[0];
                                        dataObj = dataObj.filter(data => data.file_name != attachName); //to remove respective jsondata from dataobj
                                        $(currele).parents("tr").remove();
                                        delfileObj && myDropzone?.removeFile(delfileObj);
                                    }
                                    else{
                                        showAlertDialog("error", data.split(":")[1] );
                                    }
                                })
                                .fail(function(data) {
                                    showAlertDialog( "error",data?.split(":")[1] );
                                })
                                .always(function() {
                                    callParentNew("closeFrame();","function");
                                });
                            
                            
                        }
                    },
                    buttonB: {
                        text: eval(callParent('lcm[192]')),
                        btnClass: 'btn btn-bg-light btn-color-danger btn-active-light-danger',
                        action: function () {
                            disableBackDrop('destroy');
                            return;
                        }
                    }
                }
            });
        
    },
    _downlodeAttachment  = function(attachName,isPreview = false){
        callParentNew("loadFrame();","function");
        let projName = callParentNew("mainProject");
        let url = location.href.split(projName)[0];
        $.post( `${url}AxPlugins/AxABS/ABSUpload.ashx?action=get&filename=${attachName}&transid=${transid}&keyvalue=${keyvalue}&proj=${projName}`)
        .done(function(data) {
            if(data.toLowerCase().startsWith("success:")){
                //showAlertDialog("success", data );
                // let delfileObj = myDropzone.files.filter(file => file.name == attachName)?.[0];
                // myDropzone.removeFile(delfileObj);
                let extension = ""
                try{
                    extension = data.split(".").pop();
                }catch(ex){}
                
                if(isPreview){
                    if(['jpg','png','jpeg'].indexOf(extension) != -1){
                        $("#kt_drawer_preview .pvwImage").attr("src", data.substring(data.indexOf(':') + 1));
                        previwDrawer.show();
                    }
                    else{
                       window.open(data.substring(data.indexOf(':') + 1), '_blank');
                    }
                }
                else{
                        var downlodeURL = data.substring(data.indexOf(':') + 1);
                        $("body").append(`<a id="hdnButtonInvokeDownload" target="_blank" class="hdnButtonInvokeDownload d-none" download href="${downlodeURL}"></a>`);
                        $(".hdnButtonInvokeDownload:last")[0].click()
                        $(".hdnButtonInvokeDownload:last").remove();
                        showAlertDialog("success", "Downloded successfully." );
 
                }
                   
            }
            else{
                showAlertDialog("error", data.split(":")[1] );
            }
          })
          .fail(function(data) {
            showAlertDialog( "error",data?.split(":")[1] );
          })
          .always(function() {
            callParentNew("closeFrame();","function");
          });
    }
    // _switchLayout = function(layout){
    //     if(layout == '')
    // }
    init = function (initEle) {
       transid = findGetParameter("transid");
       keyvalue = findGetParameter("keyvalue");

       if( transid && keyvalue ){
        let  result;
            try {
                result = JSON.parse(AxCallSqlDataAPI('AXPKEY000000010010', {}));
            } catch (error) {

            }
            if(result?.success && result.ds_axblobconfig?.rows?.length){ 
               defObj = result.ds_axblobconfig.rows;

               try {
                result = JSON.parse(AxCallSqlDataAPI('AXPKEY000000010011', {"mkeyvalue": keyvalue}));
                if(result?.success){ 
                    if(result.ds_axblobdata?.rows?.length)
                       dataObj = result.ds_axblobdata?.rows;
                }
                else{
                    showAlertDialog("error","Error while getting file data.");
                }
                } catch (error) {
                    showAlertDialog("error","Error while getting file data.");
                }
                _getFileCategories();
                htmlcontent =`<div class="row" id="FileUploadBlob_container">

                <div id="MyGroups_Column" class="col-xl-3 col-md-3 d-flex flex-column flex-column-fluid vh-100 min-vh-100">
                   <div class="card card-xl-stretch  flex-root h-1px  ">
                      <div class="card-header">
                            <div class="card-title page-title m-0">
                                <span class="material-icons material-icons-style material-icons-2" style="">list_alt</span>
                                <h3 class="card-title align-items-start flex-column">
                                    <span class="upload-Label">File Upload</span> 
									<span class="upload-Title">Ref. no. ${keyvalue}</span> 
                                </h3>
                            </div>
                      </div>
                      <!--begin::Body-->
                      <div class="card-body h-300px " id="MyGroups_Column_contaner">
                            ${_generatecategoryMenu()}
                      </div>
                   </div>
                </div>
                <!--end::Container-->
             
                <div id="FileUpload_Column" class="col-xl-9 col-md-9 d-flex flex-column flex-column-fluid vh-100 min-vh-100">
                   <div class="card card-xl-stretch  flex-root h-1px  ">
             
                   <div xmlns="http://www.w3.org/1999/xhtml" class="card-header ">
                        <div class="card-title m-0">
                            <h3 class="card-title align-items-start flex-column">
                                // <span class="upload-Title">Ref. no. ${keyvalue}</span> 
                            </h3>
                        </div>
                        <div class="card-toolbar ">
                            <div class="btn-group btn-group-sm shadow-sm btn-SwitchLayout me-2" role="group" aria-label="Basic example">
                                <button type="button" class="btn btn-primary px-1 py-1 list" onclick="_switchLayout('list')">
                                        <span class="material-icons material-icons-style material-icons-2 me-0">format_list_bulleted</span>
                                </button>
                                <button type="button" class="btn btn-white px-1 py-1 cards" onclick="_switchLayout('cards')">
                                        <span class="material-icons material-icons-style material-icons-2 me-0">grid_view</span>
                                </button>
                            </div>
                            <button type="submit" id="" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm ">
                                <span class="material-icons material-icons-style material-icons-2">search
                                </span>
                            </button><button type="submit" id="" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm tb-btn btn-sm">
                                <span class="material-icons material-icons-style material-icons-2">tune</span>
                            </button>
                        </div>
                    </div>
             
             
                      <div class="row">
             
                         <div id="Files_Column" class="col-xl-12 col-md-12 d-flex flex-column flex-column-fluid vh-100 min-vh-100">
                            <div id="listLayout" class="card card-xl-stretch  flex-root h-1px ">
             
                               <div class="table-responsive">
                                  <div class="dataTables_scroll">
                                     <div class="dataTables_scrollBody">
                                        <table class="table align-middle table-row-dashed fs-6 gy-4 mb-0">
                                            <thead class="fs-4">
                                                <tr>
                                                <th scope="col">File details</th>
                                                <th scope="col">Category</th>
                                                <th scope="col"></th>
                                                </tr>
                                            </thead>
                                           <tbody class="uploaded-files_container" >
                                             
                                           </tbody>
                                        </table>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            <div id="cardsLayout" class="d-flex flex-row flex-wrap row d-none"></div>
                            <div class="progressDetails d-flex flex-column fs-4 d-none">
                                <div  class="d-flex flex-row justify-content-start align-items-center">
                                    <div  class="material-icons material-icons-style material-icons-1 text-white me-2"style="">description</div>
                                    <div  class="progFileName mb-1 text-white" style="width:90%;"></div>
                                </div>
                                <div class ="d-flex flex-row justify-content-between align-items-center">
                                    <div class="progress">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 75%"></div>
                                    </div> 
                                    <div class="progressValue text-white ">75%</div>
                                </div>
                            </div>
                            <div id="DZUploadbtn">
                                <a  href="javascript:void(0)" id="DZUploadFile" type="file" class="btn btn-icon btn-white btn-color-gray-600 btn-active-primary shadow-sm me-2 tb-btn btn-sm dzdisabled">
                                <span class="material-icons material-icons-style material-icons-2">add</span>
                                </a>
                            </div>
                            <div class="dz-preview d-none"></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <div id="kt_drawer_preview" class="bg-white" data-kt-drawer="true" data-kt-drawer-activate="true" data-kt-drawer-toggle="#kt_drawer_example_advanced_button" data-kt-drawer-close="#kt_drawer_preview_close" data-kt-drawer-name="docs" data-kt-drawer-overlay="true" data-kt-drawer-width="{default:'300px', 'md': '500px'}"  data-kt-drawer-direction="end">
                <div class="DrwImgcontainer">
                    <span class="material-icons material-icons-style material-icons-2 m-4" id="kt_drawer_preview_close" title="Close" style="cursor: pointer;">close</span>
                    <img class="pvwImage" src="your-image.jpg" alt="Your Image">
                </div>
             </div>`;
                $(initEle).append(htmlcontent);
                defObj?.length && setTimeout(function () {
                   // _activateDropZone(defObj[0].configId);
                    _constructAttachList();
                    _generateCardsLayout();

                }, 0);

            }
            //condition for dataobj
            //_getFileCategories();
       }
       else{
        showAlertDialog("error","Required URL parameters are missing.")
       }


   

        KTApp.initBootstrapPopovers();
       KTDrawer.createInstances("#kt_drawer_preview");
        previwDrawer = KTDrawer.getInstance(document.querySelector("#kt_drawer_preview"));


    }
    return {init}
}
$.AxABS = new AxABS();
$(document).on("mouseover", ".fileuploadmore", function () {
    if ($(this).parents(".dropzone").find(".dropzone-items").hasClass("d-none")) {
        let elId = $(this).parents(".dropzone").attr("id");
        var popover_instance = bootstrap.Popover.getInstance(this); //get instance
        if (popover_instance.tip != null)
            popover_instance.tip.classList.add('mw-350px');
        popover_instance._config.content = "<div class=\"dropzone dropzone-queue mt-n3\" id=\"" + elId + "\">" + $(this).parents(".dropzone").find(".dropzone-items").html() + "</div>";
        popover_instance.show();
    } else
        $(this).parents(".dropzone").find(".dropzone-items").addClass("d-none");
});
$(document).on("mouseover", "body", function (e) {
    if (!$(e.target).hasClass("fileuploadmore") && !$(e.target).hasClass("popover-arrow") && !$(e.target).hasClass("popover") && !$(e.target).hasClass("popover-body") && !$(e.target).hasClass("dropzone-delete") && !$(e.target).hasClass("dropzoneItemDelete") && !$(e.target).hasClass("dropzoneGridItemDelete") && !$(e.target).hasClass("dropzone-panel") && !$(e.target).hasClass("dropzone-file") && !$(e.target).hasClass("dropzone") && !$(e.target).hasClass("dropzone-items") && !$(e.target).hasClass("dropzone-item") && !$(e.target).hasClass("dropzone-filename") && !$(e.target).parent().hasClass("dropzone-filename")) {
        $("[data-bs-toggle]").popover("hide");
    }
});
$(document).off("click", ".popover-body .dropzoneItemDelete").on("click", ".popover-body .dropzoneItemDelete", function (e) {
    const dropzoneEle = document.querySelector("#dropzone-overlay");
    var myDropzone = Dropzone.forElement(dropzoneEle);
    const delFileName = $(e.target).parents(".dropzone-item").find(".dropzone-filename").text()?.trim();
    const delFileObj = myDropzone.files.filter(file => file.name == delFileName)?.[0];
    if (delFileObj) {
        myDropzone.removeFile(delFileObj);
    }
});
$(document).on("click", ".dzdisabled", function (e) {
   showAlertDialog("error","Please select a category from left menu to upload file.")
});


})(jQuery);

function formatDate(inputDateString) {
    // Split the input date string
    var dateParts = inputDateString.split(/[\s/:]+/);

    // Create a new Date object
    var originalDate = new Date(
        parseInt(dateParts[2]),    // Year
        parseInt(dateParts[1]) - 1, // Month (0-indexed)
        parseInt(dateParts[0]),    // Day
        parseInt(dateParts[3]),    // Hours
        parseInt(dateParts[4]),    // Minutes
        parseInt(dateParts[5])     // Seconds
    );

    // Format the date into the desired format
    var formattedDate = (
        ("0" + originalDate.getDate()).slice(-2) + "-" +
        ("0" + (originalDate.getMonth() + 1)).slice(-2) + "-" +
        originalDate.getFullYear() + " " +
        ("0" + originalDate.getHours()).slice(-2) + ":" +
        ("0" + originalDate.getMinutes()).slice(-2) +
        " " +
        (originalDate.getHours() >= 12 ? "PM" : "AM")
    );

    return formattedDate;
}