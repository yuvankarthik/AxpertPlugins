CREATE OR REPLACE FUNCTION func_returns_hyperlink(preference character varying, phreforclass character varying DEFAULT 'class'::character varying)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
mHyperLink TEXT;
begin
	if pHREForClass = 'class' then 
		mHyperLink = '<div><a class="menu-link"'||
					replace('o-n-c-l-i-c-k' :: text,'-','')
					||'="parent.LoadIframe(''htmlPages.aspx?load=1705649911521&taskid='||pReference||''')"><span class="menu-icon"><i class="setting-icon material-icons">task
			</i></span></a></div>';
	else 
		mHyperLink = '<div><a href="#" class="menu-link" '||
					replace('o-n-c-l-i-c-k' :: text,'-','')
					||'="javascript:createPopup(''htmlPages.aspx?load=1706098649781&transid=taskf&keyvalue='||pReference||''')"><span class="menu-icon"><i class="setting-icon material-icons"><span class="material-symbols-outlined text-primary">
				cloud_upload</span></i></span></a></div>' ;			
	end if;
    RETURN mHyperLink;
END;
 $function$
;
