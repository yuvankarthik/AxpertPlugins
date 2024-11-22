SELECT
    a.task_formid,
    a.task_number,
    a.priority,
    a.status,
    'Pending with '||a.assign_to|| '-'||a.department as department,
    a.task_date as "created_on",
    a.task_initiator as "created_by",
    a.due_date as "timeline",
    a.task_description,
    a.axpfile_file,
    a.axpfilepath_file,
    a.action_status_number,
    a.assign_to,
    COALESCE(
      (SELECT CAST(string_agg(h.user_list, ',' ORDER BY h.user_list) AS text) as user_list
         FROM (
            SELECT DISTINCT a.task_number, unnest(string_to_array(a.user_list, ',')) as user_list
            FROM activity_log a
            WHERE a.cancel = 'F' AND a.task_number = :Tasknumber
         ) h GROUP BY h.task_number),
         ' ' ) as "Task users",
    TO_CHAR(a.createdon, 'HH:MI:SS') AS "Task_time",
    case when ( x.actorname is not null or a.assign_to = :username ) then 'True' else 'False' END     
    as "Update Status Button",
    TO_CHAR(current_timestamp - a.createdon, 'HH:MM:SS') as "Time_elapsed"
FROM task_form a left outer join 
(select x.actorname from axpdef_peg_actor x where x.defusername like '%'|| :username ||'%' ) x
on (a.assign_to = x.actorname)
WHERE a.task_number = :Tasknumber AND a.cancel = 'F'  AND a.app_desc = 1 
ORDER BY a.task_number, a.createdon
