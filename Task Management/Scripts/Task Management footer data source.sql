SELECT 
row_number() over (order by b.task_number,b.createdon)+1 as id,
b.username as "Assign From",
b.user_list as "assign_to",
b.modifiedon,
a.expected_days_to_complete,
b.axpfile_file,
b.axpfilepath_file,
b.activity_date, 
b.username as "assigned_by", 
b.activity as "t_comments", 
'Reply,Forward,Edit,History' as "Actions",
'alogm' as transid,b.activity_logid as recordid, '' URL,b.parent_action_number,b.child_action_number,a.task_number, 
concat( 'Project: ', a.project, ' Department: ',a.department,' Category: ',
a.category,' Sub Category: ',a.subcategory) as taskdetails,
CASE WHEN  	
( b.username = :username or lower( :usergroup) like  '%default%' ) then 'True' else 'False'  
end as
Edit_flag
FROM activity_log b
join task_form a on (a.task_number=b.task_number)
left outer join 
( select x.actorname from axpdef_peg_actor x where x.defusername like '%'|| :username ||'%' ) x
on (a.assign_to = x.actorname)
where a.task_number= :Tasknumber and b.cancel='F' and b.app_desc=1 and a.cancel='F' and a.app_desc=1 and
b.sourceid = 0 
order by b.task_number,b.createdon desc