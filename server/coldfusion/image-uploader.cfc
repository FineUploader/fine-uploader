<!--- Code provided by Pegasus Web Productions LLC - www.pegweb.com --->
<!--- get stuck use the forums http://github.com/valums/file-uploader --->
<!--- Tested with Adobe CF Enterprise 9.x and Valum's AJAX uploader 2.0 --->

<cfcomponent hint="I do your uploads from the valum AJAX uploader">
	
    <!--- function for single file submission uploads where XHR is not supported ex: IE --->
    <cffunction name="Upload" access="remote" output="false" returntype="any" returnformat="JSON">
    <cfargument name="qqfile" type="string" required="true">

    <cfset var local = structNew()>
    <cfset local.response = structNew()>
    <cfset local.requestData = GetHttpRequestData()><!--- get the request headers and body --->
    <cfset UploadDir = ""><!--- set your upload directory here ex: c:\website\www\images\ --->


    <!--- check if XHR data exists --->
    <cfif len(local.requestData.content) GT 0>
      
	  <cfset local.response = UploadFileXhr(arguments.qqfile, local.requestData.content)>       
      
    <cfelse><!--- no XHR data so process this as standard form submission --->

		<!--- upload the file --->
        <cffile action="upload" fileField="form.qqfile" destination="#UploadDir#" nameConflict="makeunique">
        
        <!--- populate our structure with information about the image we just uploaded in case we want to use this later for CFIMAGE tags or any other processing --->
		<cfset local.metaData = {
			clientFile = FILE.clientFile,
			clientFileExt = FILE.clientFileExt,
			clientFileName = FILE.clientFileName,
			contentSubType = FILE.contentSubType,
			contentType = FILE.contentType,
			fileSize = FILE.fileSize
        } />
		<!--- return the response --->
        <cfset local.response['success'] = true>
        <cfset local.response['type'] = 'form'>
    </cfif>
    
    <cfreturn local.response>
  </cffunction>
    
    <!--- function for browsers that support XHR ex: Almost anything but IE --->
    <cffunction name="UploadFileXhr" access="private" output="false" returntype="struct">
		<cfargument name="qqfile" type="string" required="true">
		<cfargument name="content" type="any" required="true">

		<cfset var local = structNew()>
		<cfset local.response = structNew()>
        <cfset UploadDir = ""><!--- set your upload directory here ex: c:\website\www\images\ --->

        <!--- write the contents of the http request to a file.  The filename is passed with the qqfile variable --->
		<cffile action="write" file="#UploadDir#\#arguments.qqfile#" output="#arguments.content#" nameConflict="makeunique">
        
        <!--- populate our structure with information about the image we just uploaded in case we want to use this later for CFIMAGE tags or any other processing --->
		<cfset local.metaData = {
			clientFile = FILE.clientFile,
			clientFileExt = FILE.clientFileExt,
			clientFileName = FILE.clientFileName,
			contentSubType = FILE.contentSubType,
			contentType = FILE.contentType,
			fileSize = FILE.fileSize
        } />
        
		<!--- return custom JSON if desired--->
    	<cfset local.response['success'] = true>
    	<cfset local.response['type'] = 'xhr'>
		<cfreturn local.response>
    </cffunction>
    
</cfcomponent>