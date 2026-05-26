----- Axi DB Update starts 09/03/2026

/*
 * Axi Fav
 * Axi Popupmenu
 * Axi Create,View,Edit based on roles
 * 
 */

CREATE EXTENSION IF NOT EXISTS "uuid-ossp"


CREATE TABLE Axi_UserFavourites (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    UserName VARCHAR(255) NOT NULL,
    CommandText TEXT NOT NULL,
    TargetURL VARCHAR(4000) NOT NULL,
    FavOrder INT,
    CreatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_command UNIQUE (UserName, CommandText)
)



CREATE OR REPLACE FUNCTION fn_axi_get_fieldvalues_with_keysuffix_list_v2(
p_tstruct text, 
p_fieldname text,
p_username text,
p_userroles text
)
 RETURNS TABLE(displaydata text, id text, caption text)
 LANGUAGE plpgsql
AS $function$
DECLARE 
    v_sql text; 
    v_tablename text; 
    v_sourcekey text; 
    v_srcfld text; 
    v_srctf text; 
    v_keyfield text; 

    v_fullcontrol text;
    v_filtercnd   text;
    v_perm_filter text := '';
BEGIN 
    p_fieldname := lower(p_fieldname);
    SELECT keyfield INTO v_keyfield 
    FROM axp_tstructprops 
    WHERE name = p_tstruct 
    LIMIT 1; 
    IF v_keyfield IS NULL THEN 
        SELECT fname INTO v_keyfield
        FROM axpflds
        WHERE tstruct = p_tstruct
          AND dcname = 'dc1'
        ORDER BY
            CASE 
                WHEN modeofentry = 'autogenerate' THEN 1
                WHEN LOWER(allowduplicate) = 'f' 
                     AND LOWER(allowempty) = 'f' 
                     AND datatype = 'c' 
                     AND LOWER(hidden) = 'f' THEN 2
                WHEN LOWER(hidden) = 'f'
                     AND datatype = 'c' THEN 3
                ELSE 4
            END,
            ordno ASC
        LIMIT 1;
    END IF; 
    SELECT tablename INTO v_tablename 
    FROM axpdc 
    WHERE tstruct = p_tstruct 
      AND dname = 'dc1'; 
    SELECT srckey, srcfld, srctf INTO v_sourcekey, v_srcfld, v_srctf 
    FROM axpflds 
    WHERE tstruct = p_tstruct 
      AND lower(fname) = lower(p_fieldname); 
    IF v_keyfield IS NULL
       OR v_tablename IS NULL
       OR v_sourcekey IS NULL THEN
        RETURN;
    END IF;

    -- Permission lookup
    SELECT fullcontrol, filtercnd
    INTO v_fullcontrol, v_filtercnd
    FROM fn_permissions_getpermission('View', p_tstruct, p_username, p_userroles, 'NA');

    IF v_fullcontrol <> 'T' then --AND v_filtercnd IS NOT NULL AND trim(v_filtercnd) <> ''
        v_perm_filter := ' AND (' || v_filtercnd || ')';
    END IF;

    IF v_sourcekey = 'F' THEN
        v_sql := format(
            'SELECT (%I || ''['' || %I || '']'')::text AS displaydata,
                    ''0''::text AS id,
                    %I::text AS caption
             FROM %I
             WHERE %I IS NOT NULL %s
             ORDER BY displaydata ASC',
            p_fieldname,
            v_keyfield,
            v_keyfield,
            v_tablename,	    
            p_fieldname,
 	    v_perm_filter
        );
    ELSE
           v_sql := format(
			'SELECT (s.%I || ''['' || t.%I || '']'')::text AS displaydata,
					s.%I::text AS id,
					t.%I::text AS caption
			 FROM %I s
			 JOIN %I t ON s.%I = t.%I
			 WHERE s.%I IS NOT NULL %s
			 ORDER BY displaydata ASC',
			v_srcfld,                -- s.source field
			v_keyfield,              -- t.key field
			lower(v_srctf) || 'id',  -- caption field 
			v_keyfield,              -- id from key table -- caption field
			lower(v_srctf),          -- main table
			v_tablename,             -- key table
			--lower(v_srctf) || 'id',  -- join column in main table
			lower(v_srctf) || 'id',  -- join column in key table (adjust if different)
			p_fieldname,
			--p_fieldname              -- not null field from main table
			v_srcfld,
                        v_perm_filter

		);
    END IF;
    RETURN QUERY EXECUTE v_sql; 
END; 
$function$
;




CREATE OR REPLACE FUNCTION fn_axi_getkeyvalueswithfieldnameslist_v2(
    p_tstruct text,
    p_fieldname text,
    p_username text,
    p_userroles text
)
RETURNS TABLE(displaydata text, id text, caption text, isfield text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sql        text;
  v_tablename  text;
  v_sourcekey  text;
  v_srcfld     text;
  v_srctf      text;
  v_keyfield   text;

  v_fullcontrol text;
  v_filtercnd   text;
  v_perm_filter text := '';
BEGIN

    SELECT keyfield
    INTO v_keyfield
    FROM axp_tstructprops
    WHERE lower(name) = lower(p_tstruct)
    LIMIT 1;

    IF v_keyfield IS NULL THEN
        SELECT fname INTO v_keyfield
        FROM axpflds
        WHERE lower(tstruct) = lower(p_tstruct)
          AND dcname = 'dc1'
        ORDER BY
            CASE 
                WHEN modeofentry = 'autogenerate' THEN 1
                WHEN LOWER(allowduplicate) = 'f' 
                     AND LOWER(allowempty) = 'f' 
                     AND datatype = 'c' 
                     AND LOWER(hidden) = 'f' THEN 2
                WHEN LOWER(hidden) = 'f'
                     AND datatype = 'c' THEN 3
                ELSE 4
            END,
            ordno ASC
        LIMIT 1;
    END IF;

    SELECT tablename
    INTO v_tablename
    FROM axpdc
    WHERE tstruct = p_tstruct
      AND dname = 'dc1';

    SELECT srckey, srcfld, srctf
    INTO v_sourcekey, v_srcfld, v_srctf
    FROM axpflds
    WHERE lower(tstruct) = lower(p_tstruct)
      AND lower(fname)   = lower(p_fieldname);

    IF v_keyfield IS NULL THEN
        RAISE EXCEPTION 'Key field could not be determined for tstruct %', p_tstruct;
    END IF;

    IF v_tablename IS NULL THEN
        RAISE EXCEPTION 'Base table not found for tstruct %', p_tstruct;
    END IF;

    IF v_sourcekey IS NULL THEN
        RAISE EXCEPTION 'Source metadata not found for field % in tstruct %',
            p_fieldname, p_tstruct;
    END IF;

    IF v_sourcekey <> 'F' AND (v_srcfld IS NULL OR v_srctf IS NULL) THEN
        RAISE EXCEPTION 'Source table/field missing for field % in tstruct %',
            p_fieldname, p_tstruct;
    END IF;

    -- Permission lookup
    SELECT fullcontrol, filtercnd
    INTO v_fullcontrol, v_filtercnd
    FROM fn_permissions_getpermission('View', p_tstruct, p_username, p_userroles, 'NA');

    IF v_fullcontrol <> 'T' then --AND v_filtercnd IS NOT NULL AND trim(v_filtercnd) <> ''
        v_perm_filter := ' AND (' || v_filtercnd || ')';
    END IF;

    -- lowercase conversion
    p_fieldname := lower(p_fieldname);
    v_keyfield  := lower(v_keyfield);

    IF v_sourcekey = 'F' THEN

        v_sql := format(
        $sql$
        SELECT (%I)::text AS displaydata,
               '0'::text AS id,
               %I::text AS caption,
               'f'::text AS isfield
        FROM %I
        WHERE %I IS NOT NULL 
        UNION ALL
        SELECT (caption || ' (' || fname || ')' || ' [' || 'field' || ']')::text AS displaydata,
               '0'::text AS id,
               caption::text AS caption,
               't'::text AS isfield
        FROM axpflds
        WHERE tstruct = %L
          AND lower(hidden) = 'f'
          AND lower(savevalue) = 't'
          AND lower(asgrid) = 'f'
          %s
        ORDER BY isfield ASC, displaydata ASC
        $sql$,
        p_fieldname,
        v_keyfield,
        v_tablename,
        p_fieldname,        
        p_tstruct,
        v_perm_filter
        );

    ELSE

        v_sql := format(
        $sql$
        SELECT (%I)::text AS displaydata,
               %I::text AS id,
               %I::text AS caption,
               'f'::text AS isfield
        FROM %I
        WHERE %I IS NOT NULL 
        UNION ALL
        SELECT (caption || ' (' || fname || ') [' || 'field' || ']')::text AS displaydata,
               '0'::text AS id,
               caption::text AS caption,
               't'::text AS isfield
        FROM axpflds
        WHERE tstruct = %L
          AND lower(hidden) = 'f'
          AND lower(savevalue) = 't'
          AND lower(asgrid) = 'f'
          %s
        ORDER BY isfield ASC, displaydata ASC
        $sql$,
        v_srcfld,
        lower(v_srctf) || 'id',
        v_keyfield,
        lower(v_srctf),
        p_fieldname,        
        p_tstruct,
        v_perm_filter
        );

    END IF;

    RETURN QUERY EXECUTE v_sql;

END;
$function$;





CREATE OR REPLACE FUNCTION axi_fn_getstructlist(
    p_roles text,
    p_mode text,
    p_structtype text
)
RETURNS TABLE (
    displaydata text,
    caption text,
    name text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_roles text[];
BEGIN
    v_roles := string_to_array(p_roles, ',');

    IF lower(p_structtype) = 'i' THEN
        RETURN QUERY
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ')')::text,
               a.caption::text,
               a.name::text
        FROM iviews a
        JOIN axpages b ON b.pagetype = 'i' || a.name
        LEFT JOIN axuseraccess ua ON ua.sname = a.name
        WHERE (lower(p_mode) = 'dev' OR b.visible = 'T')
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'i' AND ua.rname = ANY(v_roles))
              )
        ORDER BY 2;

    ELSE
        RETURN QUERY
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ')')::text,
               a.caption::text,
               a.name::text
        FROM tstructs a
        JOIN axpages b ON b.pagetype = 't' || a.name
        LEFT JOIN axuseraccess ua ON ua.sname = a.name
        WHERE (lower(p_mode) = 'dev' OR b.visible = 'T')
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 't' AND ua.rname = ANY(v_roles))
              )
        ORDER BY 2;
    END IF;

END;
$$;



CREATE OR REPLACE FUNCTION axi_fn_getaxobjectlist(p_userroles text)
RETURNS TABLE (
    displaydata text,
    caption text,
    name text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_roles text[];
BEGIN
    v_roles := string_to_array(p_userroles, ',');

    RETURN QUERY
    SELECT *
    FROM (

        -- TSTRUCT
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ') [tstruct]')::text AS displaydata,
               a.caption::text AS caption,
               a.name::text AS name
        FROM tstructs a
        JOIN axpages b
             ON b.pagetype = 't' || a.name
        LEFT JOIN axuseraccess ua
             ON ua.sname = a.name
        WHERE b.visible = 'T'
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 't' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- IVIEW
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ') [iview]')::text displaydata,
               a.caption::text caption,
               a.name::text name
        FROM iviews a
        JOIN axpages b
             ON b.pagetype = 'i' || a.name
        LEFT JOIN axuseraccess ua
             ON ua.sname = a.name
        WHERE b.visible = 'T'
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'i' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- PAGE
        SELECT DISTINCT
               (p.caption || ' [page]')::text displaydata,
               p.caption::text caption,
               p.props::text name
        FROM axpages p
        LEFT JOIN axuseraccess ua
             ON ua.sname = p.props
        WHERE p.pagetype = 'web'
          AND p.visible = 'T'
          AND p.props IS NOT NULL
          AND p.props <> ''
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'p' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- ADS (no role check)
        SELECT
               (a.sqlname || ' (' || a.sqlsrc || ') [ads]')::text displaydata,
               a.sqlsrc::text caption,
               a.sqlname::text name
        FROM axdirectsql a
        WHERE EXISTS (
                SELECT 1
                FROM axdirectsql_metadata m
                WHERE m.axdirectsqlid = a.axdirectsqlid
              )

        UNION

        -- Inbox
        SELECT
               'Inbox'::text displaydata,
               'Inbox'::text caption,
               'Inbox'::text name

    ) src
    ORDER BY displaydata;

END;
$$;

--delete from axi_commands

INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(1, 'Create', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(2, 'Edit', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(3, 'View', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(4, 'Configure', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(5, 'Upload', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(6, 'Download', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(7, 'Open', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(9, 'Run', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(10, 'Analyse', '', 'T');

--delete from axi_command_prompts where cmdtoken = 3 and wordpos = 2

INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('46647ef0-f107-4551-8379-3b844d430016'::uuid, 3, 2, 'object name', 'Axi_ViewList', NULL, 'tstruct,iview,ads,page', NULL, ':userroles', NULL);

--delete from axi_command_prompts where cmdtoken = 1 and wordpos = 2

INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('b767f878-6f6f-4d72-8a52-f987d5dc9064'::uuid, 1, 2, 'tstruct name', 'axi_structlist', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);

--delete from axi_command_prompts where cmdtoken = 2 and wordpos = 2

INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('8faae04b-af25-4be7-b97c-de72815255f4'::uuid, 2, 2, 'tstruct name', 'axi_structlist', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);


--delete from axi_command_prompts where cmdtoken = 4 and wordpos = 3

INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('0f99d918-0caa-4523-9260-f18b5bd162bf'::uuid, 4, 3, 'object name', 'Axi_PegList,Axi_FormNotifyList,Axi_ScheduleNotifyList,Axi_PEGNotifyList,Axi_JobNamesList,Axi_APINamesList,Axi_RuleNamesList,Axi_Dummy,axi_userlist,axi_rolelist,Axi_ServernameList,axi_structlist', NULL, '', NULL, ':userroles,:mode,:structtype', NULL);

--delete from axi_command_prompts where cmdtoken = 7 and wordpos = 3

INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('4aa86d11-a357-4ba1-ab1d-b4251676ba8f'::uuid, 7, 3, 'name', 'axi_structlist,axi_structlist,Axi_AdsList,Axi_PageList,Axi_CardList,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);

--delete from axdirectsql where axdirectsqlid  = 99999999990036

INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990036, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_structlist', NULL, 'Application', 5, 'select * from axi_fn_getstructlist(:param1,:param2,:param3)', 'param1,param2,param3', 'param1~~,param2~~,param3~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);

--delete from axdirectsql where axdirectsqlid  = 99999999990022

INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990022, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_viewlist', NULL, 'Application', 5, 'SELECT * FROM axi_fn_getaxobjectlist(:param1)', 'param1', 'param1', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);

/*
 * -- user permissions
--delete from axdirectsql where axdirectsqlid  = 99999999990025

INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990025, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_keyvalueswithfieldnameslist', NULL, 'Application', 5, 'select * from  fn_axi_getkeyvalueswithfieldnameslist_v2(:param1,:param2,:param3,:param4);', 'param1,param2,param3,param4', 'param1~~,param2~~param3~~,param4~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);


--delete from axdirectsql where axdirectsqlid  = 99999999990025

INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990024, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_fieldvalueswithkeysuffixlist', NULL, 'Application', 5, 'select * from fn_axi_get_fieldvalues_with_keysuffix_list_v2(:param1,:param2,:param3,:param4);', 'param1,param2,param3,param4', 'param1~~,param2~~param3~~,param4~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);
*/

----- Axi DB Update ends 09/03/2026



----------------------------------------------------------------------------------
==================================================================================

//Old 

CREATE OR REPLACE FUNCTION fn_axi_get_fieldvalues_with_keysuffix_list_v2(
p_tstruct text, 
p_fieldname text,
p_username text,
p_userroles text
)
 RETURNS TABLE(displaydata text, id text, caption text)
 LANGUAGE plpgsql
AS $function$
DECLARE 
    v_sql text; 
    v_tablename text; 
    v_sourcekey text; 
    v_srcfld text; 
    v_srctf text; 
    v_keyfield text; 

    v_fullcontrol text;
    v_filtercnd   text;
    v_perm_filter text := '';
BEGIN 
    p_fieldname := lower(p_fieldname);
    SELECT keyfield INTO v_keyfield 
    FROM axp_tstructprops 
    WHERE name = p_tstruct 
    LIMIT 1; 
    IF v_keyfield IS NULL THEN 
        SELECT fname INTO v_keyfield
        FROM axpflds
        WHERE tstruct = p_tstruct
          AND dcname = 'dc1'
        ORDER BY
            CASE 
                WHEN modeofentry = 'autogenerate' THEN 1
                WHEN LOWER(allowduplicate) = 'f' 
                     AND LOWER(allowempty) = 'f' 
                     AND datatype = 'c' 
                     AND LOWER(hidden) = 'f' THEN 2
                WHEN LOWER(hidden) = 'f'
                     AND datatype = 'c' THEN 3
                ELSE 4
            END,
            ordno ASC
        LIMIT 1;
    END IF; 
    SELECT tablename INTO v_tablename 
    FROM axpdc 
    WHERE tstruct = p_tstruct 
      AND dname = 'dc1'; 
    SELECT srckey, srcfld, srctf INTO v_sourcekey, v_srcfld, v_srctf 
    FROM axpflds 
    WHERE tstruct = p_tstruct 
      AND lower(fname) = lower(p_fieldname); 
    IF v_keyfield IS NULL
       OR v_tablename IS NULL
       OR v_sourcekey IS NULL THEN
        RETURN;
    END IF;

    -- Permission lookup
    SELECT fullcontrol, filtercnd
    INTO v_fullcontrol, v_filtercnd
    FROM fn_permissions_getpermission('View', p_tstruct, p_username, p_userroles, 'NA');

    IF v_fullcontrol <> 'T' then --AND v_filtercnd IS NOT NULL AND trim(v_filtercnd) <> ''
        v_perm_filter := ' AND (' || v_filtercnd || ')';
    END IF;

    IF v_sourcekey = 'F' THEN
        v_sql := format(
            'SELECT (%I || ''['' || %I || '']'')::text AS displaydata,
                    ''0''::text AS id,
                    %I::text AS caption
             FROM %I
             WHERE %I IS NOT NULL %s
             ORDER BY displaydata ASC',
            p_fieldname,
            v_keyfield,
            v_keyfield,
            v_tablename,	    
            p_fieldname,
 	    v_perm_filter
        );
    ELSE
           v_sql := format(
			'SELECT (s.%I || ''['' || t.%I || '']'')::text AS displaydata,
					s.%I::text AS id,
					t.%I::text AS caption
			 FROM %I s
			 JOIN %I t ON s.%I = t.%I
			 WHERE s.%I IS NOT NULL %s
			 ORDER BY displaydata ASC',
			v_srcfld,                -- s.source field
			v_keyfield,              -- t.key field
			lower(v_srctf) || 'id',  -- caption field 
			v_keyfield,              -- id from key table -- caption field
			lower(v_srctf),          -- main table
			v_tablename,             -- key table
			--lower(v_srctf) || 'id',  -- join column in main table
			lower(v_srctf) || 'id',  -- join column in key table (adjust if different)
			p_fieldname,
			--p_fieldname              -- not null field from main table
			v_srcfld,
                        v_perm_filter

		);
    END IF;
    RETURN QUERY EXECUTE v_sql; 
END; 
$function$
;




CREATE OR REPLACE FUNCTION fn_axi_getkeyvalueswithfieldnameslist_v2(
    p_tstruct text,
    p_fieldname text,
    p_username text,
    p_userroles text
)
RETURNS TABLE(displaydata text, id text, caption text, isfield text)
LANGUAGE plpgsql
AS $function$
DECLARE
  v_sql        text;
  v_tablename  text;
  v_sourcekey  text;
  v_srcfld     text;
  v_srctf      text;
  v_keyfield   text;

  v_fullcontrol text;
  v_filtercnd   text;
  v_perm_filter text := '';
BEGIN

    SELECT keyfield
    INTO v_keyfield
    FROM axp_tstructprops
    WHERE lower(name) = lower(p_tstruct)
    LIMIT 1;

    IF v_keyfield IS NULL THEN
        SELECT fname INTO v_keyfield
        FROM axpflds
        WHERE lower(tstruct) = lower(p_tstruct)
          AND dcname = 'dc1'
        ORDER BY
            CASE 
                WHEN modeofentry = 'autogenerate' THEN 1
                WHEN LOWER(allowduplicate) = 'f' 
                     AND LOWER(allowempty) = 'f' 
                     AND datatype = 'c' 
                     AND LOWER(hidden) = 'f' THEN 2
                WHEN LOWER(hidden) = 'f'
                     AND datatype = 'c' THEN 3
                ELSE 4
            END,
            ordno ASC
        LIMIT 1;
    END IF;

    SELECT tablename
    INTO v_tablename
    FROM axpdc
    WHERE tstruct = p_tstruct
      AND dname = 'dc1';

    SELECT srckey, srcfld, srctf
    INTO v_sourcekey, v_srcfld, v_srctf
    FROM axpflds
    WHERE lower(tstruct) = lower(p_tstruct)
      AND lower(fname)   = lower(p_fieldname);

    IF v_keyfield IS NULL THEN
        RAISE EXCEPTION 'Key field could not be determined for tstruct %', p_tstruct;
    END IF;

    IF v_tablename IS NULL THEN
        RAISE EXCEPTION 'Base table not found for tstruct %', p_tstruct;
    END IF;

    IF v_sourcekey IS NULL THEN
        RAISE EXCEPTION 'Source metadata not found for field % in tstruct %',
            p_fieldname, p_tstruct;
    END IF;

    IF v_sourcekey <> 'F' AND (v_srcfld IS NULL OR v_srctf IS NULL) THEN
        RAISE EXCEPTION 'Source table/field missing for field % in tstruct %',
            p_fieldname, p_tstruct;
    END IF;

    -- Permission lookup
    SELECT fullcontrol, filtercnd
    INTO v_fullcontrol, v_filtercnd
    FROM fn_permissions_getpermission('View', p_tstruct, p_username, p_userroles, 'NA');

    IF v_fullcontrol <> 'T' then --AND v_filtercnd IS NOT NULL AND trim(v_filtercnd) <> ''
        v_perm_filter := ' AND (' || v_filtercnd || ')';
    END IF;

    -- lowercase conversion
    p_fieldname := lower(p_fieldname);
    v_keyfield  := lower(v_keyfield);

    IF v_sourcekey = 'F' THEN

        v_sql := format(
        $sql$
        SELECT (%I)::text AS displaydata,
               '0'::text AS id,
               %I::text AS caption,
               'f'::text AS isfield
        FROM %I
        WHERE %I IS NOT NULL 
        UNION ALL
        SELECT (caption || ' (' || fname || ')' || ' [' || 'field' || ']')::text AS displaydata,
               '0'::text AS id,
               caption::text AS caption,
               't'::text AS isfield
        FROM axpflds
        WHERE tstruct = %L
          AND lower(hidden) = 'f'
          AND lower(savevalue) = 't'
          AND lower(asgrid) = 'f'
          %s
        ORDER BY isfield ASC, displaydata ASC
        $sql$,
        p_fieldname,
        v_keyfield,
        v_tablename,
        p_fieldname,        
        p_tstruct,
        v_perm_filter
        );

    ELSE

        v_sql := format(
        $sql$
        SELECT (%I)::text AS displaydata,
               %I::text AS id,
               %I::text AS caption,
               'f'::text AS isfield
        FROM %I
        WHERE %I IS NOT NULL 
        UNION ALL
        SELECT (caption || ' (' || fname || ') [' || 'field' || ']')::text AS displaydata,
               '0'::text AS id,
               caption::text AS caption,
               't'::text AS isfield
        FROM axpflds
        WHERE tstruct = %L
          AND lower(hidden) = 'f'
          AND lower(savevalue) = 't'
          AND lower(asgrid) = 'f'
          %s
        ORDER BY isfield ASC, displaydata ASC
        $sql$,
        v_srcfld,
        lower(v_srctf) || 'id',
        v_keyfield,
        lower(v_srctf),
        p_fieldname,        
        p_tstruct,
        v_perm_filter
        );

    END IF;

    RETURN QUERY EXECUTE v_sql;

END;
$function$;





CREATE OR REPLACE FUNCTION axi_fn_getstructlist(
    p_roles text,
    p_mode text,
    p_structtype text
)
RETURNS TABLE (
    displaydata text,
    caption text,
    name text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_roles text[];
BEGIN
    v_roles := string_to_array(p_roles, ',');

    IF lower(p_structtype) = 'i' THEN
        RETURN QUERY
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ')')::text,
               a.caption::text,
               a.name::text
        FROM iviews a
        JOIN axpages b ON b.pagetype = 'i' || a.name
        LEFT JOIN axuseraccess ua ON ua.sname = a.name
        WHERE (lower(p_mode) = 'dev' OR b.visible = 'T')
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'i' AND ua.rname = ANY(v_roles))
              )
        ORDER BY 2;

    ELSE
        RETURN QUERY
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ')')::text,
               a.caption::text,
               a.name::text
        FROM tstructs a
        JOIN axpages b ON b.pagetype = 't' || a.name
        LEFT JOIN axuseraccess ua ON ua.sname = a.name
        WHERE (lower(p_mode) = 'dev' OR b.visible = 'T')
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 't' AND ua.rname = ANY(v_roles))
              )
        ORDER BY 2;
    END IF;

END;
$$;



CREATE OR REPLACE FUNCTION axi_fn_getaxobjectlist(p_userroles text)
RETURNS TABLE (
    displaydata text,
    caption text,
    name text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_roles text[];
BEGIN
    v_roles := string_to_array(p_userroles, ',');

    RETURN QUERY
    SELECT *
    FROM (

        -- TSTRUCT
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ') [tstruct]')::text AS displaydata,
               a.caption::text AS caption,
               a.name::text AS name
        FROM tstructs a
        JOIN axpages b
             ON b.pagetype = 't' || a.name
        LEFT JOIN axuseraccess ua
             ON ua.sname = a.name
        WHERE b.visible = 'T'
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 't' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- IVIEW
        SELECT DISTINCT
               (a.caption || ' (' || a.name || ') [iview]')::text displaydata,
               a.caption::text caption,
               a.name::text name
        FROM iviews a
        JOIN axpages b
             ON b.pagetype = 'i' || a.name
        LEFT JOIN axuseraccess ua
             ON ua.sname = a.name
        WHERE b.visible = 'T'
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'i' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- PAGE
        SELECT DISTINCT
               (p.caption || ' [page]')::text displaydata,
               p.caption::text caption,
               p.props::text name
        FROM axpages p
        LEFT JOIN axuseraccess ua
             ON ua.sname = p.props
        WHERE p.pagetype = 'web'
          AND p.visible = 'T'
          AND p.props IS NOT NULL
          AND p.props <> ''
          AND (
                'default' = ANY(v_roles)
                OR (ua.stype = 'p' AND ua.rname = ANY(v_roles))
              )

        UNION

        -- ADS (no role check)
        SELECT
               (a.sqlname || ' (' || a.sqlsrc || ') [ads]')::text displaydata,
               a.sqlsrc::text caption,
               a.sqlname::text name
        FROM axdirectsql a
        WHERE EXISTS (
                SELECT 1
                FROM axdirectsql_metadata m
                WHERE m.axdirectsqlid = a.axdirectsqlid
              )

        UNION

        -- Inbox
        SELECT
               'Inbox'::text displaydata,
               'Inbox'::text caption,
               'Inbox'::text name

    ) src
    ORDER BY displaydata;

END;
$$;


INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(1, 'Create', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(2, 'Edit', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(3, 'View', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(4, 'Configure', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(5, 'Upload', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(6, 'Download', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(7, 'Open', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(9, 'Run', '', 'T');
INSERT INTO axi_commands
(cmdtoken, command_group, command, active)
VALUES(10, 'Analyse', '', 'T');


INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('46647ef0-f107-4551-8379-3b844d430016'::uuid, 3, 2, 'object name', 'Axi_ViewList', NULL, 'tstruct,iview,ads,page', NULL, ':userroles', NULL);


INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('b767f878-6f6f-4d72-8a52-f987d5dc9064'::uuid, 1, 2, 'tstruct name', 'axi_structlist', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);


INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('8faae04b-af25-4be7-b97c-de72815255f4'::uuid, 2, 2, 'tstruct name', 'axi_structlist', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);


INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('0f99d918-0caa-4523-9260-f18b5bd162bf'::uuid, 4, 3, 'object name', 'Axi_PegList,Axi_FormNotifyList,Axi_ScheduleNotifyList,Axi_PEGNotifyList,Axi_JobNamesList,Axi_APINamesList,Axi_RuleNamesList,Axi_Dummy,axi_userlist,axi_rolelist,Axi_ServernameList,axi_structlist', NULL, '', NULL, ':userroles,:mode,:structtype', NULL);


INSERT INTO axi_command_prompts
(id, cmdtoken, wordpos, prompt, promptsource, promptparams, promptvalues, props, extraparams, requesturl)
VALUES('4aa86d11-a357-4ba1-ab1d-b4251676ba8f'::uuid, 7, 3, 'name', 'axi_structlist,axi_structlist,Axi_AdsList,Axi_PageList,Axi_CardList,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy,,Axi_Dummy', NULL, NULL, NULL, ':userroles,:mode,:structtype', NULL);


INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990036, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_structlist', NULL, 'Application', 5, 'select * from axi_fn_getstructlist(:param1,:param2,:param3)', 'param1,param2,param3', 'param1~~,param2~~,param3~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);


INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990022, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_viewlist', NULL, 'Application', 5, 'SELECT * FROM axi_fn_getaxobjectlist(:param1)', 'param1', 'param1', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);


INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990025, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_keyvalueswithfieldnameslist', NULL, 'Application', 5, 'select * from  fn_axi_getkeyvalueswithfieldnameslist_v2(:param1,:param2,:param3,:param4);', 'param1,param2,param3,param4', 'param1~~,param2~~param3~~,param4~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);


INSERT INTO axdirectsql
(axdirectsqlid, cancel, sourceid, mapname, username, modifiedon, createdby, createdon, wkid, app_level, app_desc, app_slevel, cancelremarks, wfroles, sqlname, ddldatatype, sqlsrc, sqlsrccnd, sqltext, paramcal, sqlparams, accessstring, groupname, sqlquerycols, cachedata, cacheinterval, encryptedflds, adsdesc, smartlistcnd)
VALUES(99999999990024, 'F', 0, NULL, 'admin', '2025-12-23 13:22:07.000', 'admin', '2025-12-19 16:06:57.000', NULL, 1, 1, NULL, NULL, NULL, 'axi_fieldvalueswithkeysuffixlist', NULL, 'Application', 5, 'select * from fn_axi_get_fieldvalues_with_keysuffix_list_v2(:param1,:param2,:param3,:param4);', 'param1,param2,param3,param4', 'param1~~,param2~~param3~~,param4~~', 'ALL', NULL, NULL, 'F', '6 Hr', NULL, NULL, NULL);
