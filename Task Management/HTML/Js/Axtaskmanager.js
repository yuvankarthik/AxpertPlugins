var jsonString = ""; 
  
 $(document).ready(function() {
	var taskID = getQueryStringParameter("taskid");
	if(taskID != "")
		jsonString = AxCallSqlDataAPI('AXPKEY000000000005', { "Tasknumber" : taskID});
    createTaskDetails(jsonString);
});

function createTaskDetails(jsonString)
{	
	//jsonString = jsonString.replace(/\\/g, '/');
	resultHeaderJson = JSON.parse(jsonString);
	
	if(resultHeaderJson.ds_taskheader.rows.length > 0)
	{
		var TicketNumber = document.getElementById('hdr_tasknumber')
		TicketNumber.textContent = 'Ticket #' + resultHeaderJson.ds_taskheader.rows[0].task_number;
		
		var Department = document.getElementById('hdr_department')
		Department.textContent = resultHeaderJson.ds_taskheader.rows[0].department;
		
		var CreatedBy = document.getElementById('hdr_createdby')
		CreatedBy.textContent = resultHeaderJson.ds_taskheader.rows[0].created_by;
		
		var TicketDescription = document.getElementById("hdr_task_description")
		TicketDescription.textContent = resultHeaderJson.ds_taskheader.rows[0].task_description;

		var CreatedOn = document.getElementById('hdr_createdon')
		CreatedOn.textContent = resultHeaderJson.ds_taskheader.rows[0].created_on + ' ' + resultHeaderJson.ds_taskheader.rows[0].Task_time;
		
		var CompletionDate = document.getElementById('hdr_completiondate')
		CompletionDate.textContent = resultHeaderJson.ds_taskheader.rows[0].timeline;
		
		var TaskStatus = document.getElementById('hdr_status')	
		if(resultHeaderJson.ds_taskheader.rows[0].status)
		{
			if(resultHeaderJson.ds_taskheader.rows[0].status == "T")
			{
				TaskStatus.textContent = "Completed";
				TaskStatus.classList.add('badge-success');
			}			
			else
			{
				TaskStatus.textContent = "Pending";
				TaskStatus.classList.add('badge-danger');
			}
		}
		if(resultHeaderJson.ds_taskheader.rows[0].priority)
			updatePriority(resultHeaderJson.ds_taskheader.rows[0].priority);
		
		var HdrFilesListHTML = document.getElementById('dv_Files_Header')//
		HdrFilesListHTML.innerHTML = getHeaderFilesHtml(resultHeaderJson.ds_taskheader.rows[0]);
		
		var HdrWatchersListHTML = document.getElementById('hdr_watchers')//
		HdrWatchersListHTML.innerHTML = getHdrWatchersHtml(resultHeaderJson.ds_taskheader.rows[0]);
		
		if(resultHeaderJson.ds_taskheader.rows[0]["Update Status Button"] == "True")//Update Status Button
		{
			var loadURL = `../../aspx/tstruct.aspx?transid=alogm&act=open&task_number=${resultHeaderJson.ds_taskheader.rows[0]["task_number"]}&parent_action_number=${resultHeaderJson.ds_taskheader.rows[0]["action_status_number"]}`;
			$('#dv_Files_Header').after(`<div class=" mb-3"><button onclick="openTaskUpdate('${loadURL}')" style="float:right;" class="btn btn-sm btn-primary">Update</button> </div>`);
		}
			

		var mainDiv = document.getElementById('body_Container')
		if (!resultHeaderJson.ds_activityfooter.rows) {
			mainDiv.innerhtml = '<p>No Task Found</p>'
			console.log("Element with ID 'taskupdate' not found.");
		} else {

			for (var i = 0; i < resultHeaderJson.ds_activityfooter.rows.length; i++) {
				var initial = resultHeaderJson.ds_activityfooter.rows[i]["Assign From"];
				var alignClass = "container container-left";
				var activity = `<span class="user-activity">Created the task</span>`;
				if(i!=0)	
				{				
					alignClass = "container container-left";
					activity = `<span class="user-activity">assigned to <b>${resultHeaderJson.ds_activityfooter.rows[i]["assign_to"]}</b></span>`
				}
				var filesHTML = "";
				if(resultHeaderJson.ds_activityfooter.rows[i]["axpfile_file"])
				{				
					filesHTML = getFilesHtml(resultHeaderJson.ds_activityfooter.rows[i]);
				}
				var editButtonHTML = "";
				if(resultHeaderJson.ds_activityfooter.rows[i]["edit_flag"] == "True")//Update Status Button
				{
					var loadURL = `../../aspx/tstruct.aspx?transid=alogm&act=load&recordid=${resultHeaderJson.ds_activityfooter.rows[i]["recordid"]}`;
					editButtonHTML = `<div class="Tasklog-toolbar-Right"><button onclick="openTaskUpdate('${loadURL}')" class="btn btn-sm btn-primary">Edit</button> </div>`;
				}
				var editHtml= `../../aspx/tstruct.aspx?transid=alogm&act=open&recordid=${resultHeaderJson.ds_activityfooter.rows[i]["recordid"]}`;
				var replyHtml = `../../aspx/tstruct.aspx?transid=alogm&act=open&task_number=${resultHeaderJson.ds_activityfooter.rows[i]["task_number"]}&parent_action_number=${resultHeaderJson.ds_activityfooter.rows[i]["child_action_number"]}&action=Reply`;
				var forwardHtml = `../../aspx/tstruct.aspx?transid=alogm&act=open&task_number=${resultHeaderJson.ds_activityfooter.rows[i]["task_number"]}&parent_action_number=${resultHeaderJson.ds_activityfooter.rows[i]["child_action_number"]}&action=Forward`;
				
				$('#body_Container').append(`<div class="${alignClass}">
												   <div class="image User-DP-Noname">
													  <div class="symbol symbol-35px symbol-circle initialized" data-bs-toggle="tooltip" title=""
														 data-bs-original-title="${initial}">
														 <span class="symbol-label bg-warning text-inverse-warning fw-bold">${initial[0]}</span>
													  </div>
												   </div>
												   <div class="content">
													  <div class=" d-flex activity-row-one">
														 <span class="user-name"> ${initial}</span>
														 ${activity}
														 
														 <span class="Activiy-Date">${resultHeaderJson.ds_activityfooter.rows[i]["modifiedon"]}</span>
														 
													  </div>													  
													  <!--<div class=" d-flex activity-row-one">
														 
														 <span class="Activiy-Time">6:30 PM</span>
													  </div>-->
													  <div class="row Task-details-wrap">
														 <p class="task-description moretext" style="margin-bottom:0px !important;">
															${resultHeaderJson.ds_activityfooter.rows[i]["t_comments"]}
														 </p>
														 <a class="moreless-button" href="#">Read more</a>
														 <div class=" Files-Attached-Wrapper">
															${filesHTML}
														 </div>
													  </div>
													  ${editButtonHTML}
												   </div>												   
												</div>`);
			}
		}
		initReadMore();
	}	
}

function getFilesHtml(rowJson){
	var returnHtml = "";
	var filesArray = rowJson["axpfile_file"].split(',');	
	$.each(filesArray, function (index, value) {
		var fileType = getFileType(value);
		var iconClass = getFileImgHTML(fileType);
		var attachmentURL = rowJson["axpfilepath_file"] + value;
		if(value != "")
		{
			returnHtml += `<div class="Files-Attached ">
						   <!--begin::Icon-->	
						   ${iconClass}						   
						   <!--end::Icon-->                     
						   <!--begin::Info-->
						   <div class="ms-1 fw-semibold">
							  <!--begin::Desc-->							  
							  <a class="attached-filename" target="_blank" href="${attachmentURL}">${value}</a>
							  <!--end::Desc-->                     
							  <!--begin::Number-->
							  <div class="attached-filedetails">
								 <span class="doctype">${fileType}</span>
								 <!--<span class="docsize">1.9mb</span>-->
							  </div>
							  <!--end::Number-->
						   </div>
						   <a class="attached-filename" target="_blank" href="${attachmentURL}">
							   <span
								  class="material-icons material-icons-style material-icons-2 text-danger">cloud_download</span>
							</a>
						   <!--begin::Info-->
						</div>`;
		}
		
    });	
	return returnHtml;
}
function getHeaderFilesHtml(rowJson){
	var returnHtml = "";
	var filesArray = rowJson["axpfile_file"].split(',');	
	$.each(filesArray, function (index, value) {
		if(value != "")
		{
			var fileType = getFileType(value);
			var iconClass = getFileImgHTML(fileType);
			var attachmentURL = rowJson["axpfilepath_file"] + value;
			returnHtml += `<div class="Files-Attached ">
							   <!--begin::Icon-->	
							   ${iconClass}						   
							   <!--end::Icon-->                     
							   <!--begin::Info-->
							   <div class="ms-1 fw-semibold">
								  <!--begin::Desc-->							  
								  <a class="attached-filename" target="_blank" href="${attachmentURL}">${value}</a>
								  <!--end::Desc-->                     
								  <!--begin::Number-->
								  <div class="attached-filedetails">
									 <span class="doctype">${fileType}</span>
									 <!--<span class="docsize">1.9mb</span>-->
								  </div>
								  <!--end::Number-->
							   </div>
							   <a class="attached-filename" target="_blank" href="${attachmentURL}">
									<span
									  class="material-icons material-icons-style material-icons-2 text-danger">cloud_download</span>
								  </a>
							   <!--begin::Info-->
							</div>`;
		}
		
    });	
	return returnHtml;
}
function getHdrWatchersHtml(rowJson){
	var returnHtml = "";
	var returnHtmlModal = "";
	var filesArray = rowJson["Task users"].split(',');
	var count = filesArray.length;
	$.each(filesArray, function (index, value) {	
		var init_name = $.trim(value[0]);
      	if(init_name != "")
          {
            if(index <= 2)
			returnHtml += `<div class="symbol symbol-25px symbol-circle initialized" data-bs-toggle="tooltip" title="" data-bs-original-title="${value[0]}">
							<span class="symbol-label bg-warning text-inverse-warning fw-bold">${init_name}</span>
						</div> `;
          }		
    });
	if(count > 3)
		returnHtml += `<a href="#" class="symbol symbol-25px symbol-circle" data-bs-toggle="modal" data-bs-target="#kt_modal_view_users"> <span class="symbol-label bg-light text-gray-400 fs-8 fw-bold">+${count - 3}</span></a>`;
	
	//Create Modal Content
	$.each(filesArray, function (index, value) {		
		var firstChar = value.charAt(0);
		var valuestring = value.slice(1);
		returnHtmlModal += `<div class="symbol symbol-25px symbol-circle initialized" data-bs-toggle="tooltip" title="" data-bs-original-title="${firstChar}">
							<span class="fw-bold badge badge-info" style="font-size:1rem !important;">${value}</span> 
						</div>   `;
    });
	var ModalWatchers = document.getElementById('modal_watchers')
	ModalWatchers.innerHTML = returnHtmlModal;
	
	return returnHtml;
}
function initReadMore() {
    // Get all elements with the "moretext" class
    var moreTextElements = document.querySelectorAll('.moretext');

    moreTextElements.forEach(function (moreText, index) {
        // Save the initial height when the page loads for each element
        var initialHeight = moreText.clientHeight;

        // Get the corresponding "Read more" button
        var moreLessButton = moreText.nextElementSibling;

        // Initial check and setup
        if (moreText.scrollHeight > moreText.clientHeight) {
            moreLessButton.style.display = 'inline-block';
            moreText.style.maxHeight = initialHeight + 'px'; // Set initial max height
        } else {
            moreLessButton.style.display = 'none'; // Hide button if content is not overflowing
        }

        // Toggle between two lines and full height and adjust max-height accordingly
        moreLessButton.addEventListener('click', function () {
            // Get the computed style for the moreText element
            var computedStyle = window.getComputedStyle(moreText);

            if (computedStyle.maxHeight === 'none' || computedStyle.maxHeight === initialHeight + 'px') {
                moreText.style.maxHeight = moreText.scrollHeight + 'px'; // Expand to full height
                moreLessButton.textContent = 'Read less';
            } else {
                moreText.style.maxHeight = initialHeight + 'px'; // Set back to initial height
                moreLessButton.textContent = 'Read more';
            }
        });
    });
}
function getIconClass(fileType) {
    switch (fileType) {
        case 'pdf':
            return 'description';
        case 'png':
            return 'image';
        case 'doc':
        case 'docx':
            return 'description';
        case 'txt':
            return 'description';
        case 'xls':
        case 'xlsx':
            return 'description';
        case 'ppt':
        case 'pptx':
            return 'slideshow';
        case 'zip':
            return 'archive';
        case 'mp3':
            return 'audiotrack';
        case 'mp4':
            return 'videocam';
        default:
            return 'insert_drive_file'; // Default icon for unknown file types
    }
}

function getFileImgHTML(fileType) {
    switch (fileType) {
        case 'pdf':
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">description</i>';
		case 'jpeg':
		case 'jpg':
        case 'png':
            return '<img src="../images/images.svg" class="file-img" />';
        case 'doc':
        case 'docx':
            return '<img src="../images/word.svg" class="file-img" />';
        case 'txt':
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">description</i>';
        case 'xls':
        case 'xlsx':
            return '<img src="../images/xl.svg" class="file-img"/>';
        case 'ppt':
        case 'pptx':
            return '<img src="../images/ppt.svg" class="file-img"/>';
        case 'zip':
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">archive</i>';
        case 'mp3':
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">audiotrack</i>';
        case 'mp4':
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">videocam</i>';
        default:
            return '<i style="margin:0px !important; font-size: 40px !important; " class="material-icons">insert_drive_file</i>'; // Default icon for unknown file types
    }
}
function getFileType(fileName) {
    // Split the file name into an array based on the dot separator
    var parts = fileName.split('.');

    // Get the last part of the array, which is the file extension
    var fileExtension = parts[parts.length - 1];

    // Convert the file extension to lowercase (optional, for consistency)
    return fileExtension.toLowerCase();
}
function getQueryStringParameter(name) {
    // Remove the "?" character from the beginning of the query string
    var queryString = window.location.search.substring(1);

    // Split the query string into an array of key-value pairs
    var queryParams = queryString.split("&");

    // Loop through each key-value pair
    for (var i = 0; i < queryParams.length; i++) {
        // Split the key and value
        var pair = queryParams[i].split("=");

        // Check if the current key matches the one we're looking for
        if (pair[0] === name) {
            // Return the decoded value
            return decodeURIComponent(pair[1]);
        }
    }
    // Return null if the parameter is not found
    return null;
}
function updatePriority(priority) {
    var priorityBadge = document.getElementById('priorityBadge');

    // Remove existing priority classes
    priorityBadge.classList.remove('badge-danger', 'badge-warning', 'badge-success', 'badge-light-danger');
	priority = $.trim(priority);
    // Update priority text and add corresponding class		
    switch (priority) {
        case 'Low':     
			priorityBadge.innerHTML = `<span
                                         class="material-icons material-icons-style material-icons-2 text-success me-2 ">flag</span>${priority}</span>`;
            priorityBadge.classList.add('badge-success');
			priorityBadge.classList.add('badge-light-success');
            break;
		case 'Neutral':
        case 'Medium':
			priorityBadge.innerHTML = `<span
                                         class="material-icons material-icons-style material-icons-2 text-warning me-2 ">flag</span>${priority}</span>`;
            priorityBadge.classList.add('badge-warning');
			priorityBadge.classList.add('badge-light-warning');
            break;
		case 'Critical':
        case 'High':
			priorityBadge.innerHTML = `<span class="material-icons material-icons-style material-icons-2 text-danger me-2 ">flag</span>${priority}</span>`;
            priorityBadge.classList.add('badge-danger');
			priorityBadge.classList.add('badge-light-danger');
            break;
        default:
            priorityBadge.innerHTML = `<span class="material-icons material-icons-style material-icons-2 text-info me-2 ">flag</span>${priority}</span>`;
            priorityBadge.classList.add('badge-info');
			priorityBadge.classList.add('badge-light-info');
            break;
    }
}
function openTaskUpdate(url){
	var modal_id = "mod_UpdateTask";
	let popupHtml = `<iframe id="updatetask" name="updatetask" class="col-12 flex-column-fluid w-100 h-100" src="${url}" frameborder="0" allowtransparency="True"></iframe>`;

	let myModal = new BSModal(modal_id, "", popupHtml,
				(opening) => { }, (closing) => { }
			);

	myModal.changeSize("fullscreen");
	myModal.hideHeader();
	myModal.hideFooter();
	myModal.showFloatingClose();
}


































