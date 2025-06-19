const cds = require("@sap/cds");
const { Readable } = require("stream");
const crypto = require("crypto");
const {executeHttpRequest} = require('@sap-cloud-sdk/http-client')

module.exports = cds.service.impl((srv) => {
  
  const {EarningFiles,VisibilityConfig} = srv.entities;
  srv.on("READ",VisibilityConfig, async (req) => {
    req.reply({
      isAdmin: req.user.is("Workzone_EFDNA_GenAI_Earnings_Checker"),
    });

    // let currentUser = await next();
    // currentUser.isAdmin = req.user.is("Earning_Admin")
    //   ? false
    //   : true;
    // return currentUser;
  });

  srv.on('approveFiles', async req=>{
        const ids = req.data.ids;
        if(!Array.isArray(ids) || ids.length ===0){
          return req.error(400, "No Ids Provided");  
        }
        const result = await UPDATE(EarningFiles)
              .set({status: 'Approved'})
              .where({ID: {in:ids}})
       return {updated: result}       
  })

  srv.on('rejectFiles', async req=>{
    const ids = req.data.ids;
    if(!Array.isArray(ids) || ids.length ===0){
      return req.error(400, "No Ids Provided");  
    }
    const result = await UPDATE(EarningFiles)
          .set({status: 'Rejected'})
          .where({ID: {in:ids}})
   return {updated: result}       
})

   // original read logic based on content
   srv.on('READ', ['EarningFiles', 'EarningFiles.drafts'], async (req, next) => {
    if (!req.data.ID) {
      return next();
    }
    //Fetch the url from where the req is triggered
    const url = req._.req.path;
    //If the request url contains keyword "content"
    // then read the media content
    if (url.includes("content")) {
      console.log("Fetching media content for ID:", req.data.ID);
      // Fetch the media obj from database

      let tx = cds.transaction(req);
      // Fetch the media obj from database
      let mediaObj = await tx.run(
        SELECT.one.from("com.scb.earningupload.EarningFiles", ["content", "mediaType","fileName"]).where(
          "ID =",
          req.data.ID
        )
      );
      let decodedMedia = "";
      decodedMedia = Buffer.from(
        mediaObj.content,
        "base64"
      );
      const res = req._.res;
      res.setHeader("Content-Type", mediaObj.mediaType || "application/octet-stream");
      console.log("filename" +mediaObj.fileName)
    // Set content disposition with original filename
    const safeFileName = encodeURIComponent(mediaObj.fileName || "download");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
      console.log("Media content fetched successfully for ID:", req.data.ID);
      return _formatResult(decodedMedia, mediaObj.mediaType);
    } else return next();
  });

  // Helper function to convert Readable stream to Buffer
  function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', err => reject(err));
    });
  }

  function _formatResult(decodedMedia, mediaType) {
    const readable = new Readable();
    const result = new Array();
    readable.push(decodedMedia);
    readable.push(null);
    return {
      value: readable,
      '*@odata.mediaContentType': mediaType
    }
  }
 
  srv.on('generateEmbedding', async()=>{
   // let triggerAPI = await cds.connect.to("EARNINGS_CORE",{timeout: 120000});
   const response = await executeHttpRequest(
     {destinationName: 'EARNINGS_CORE'},
     {
       method: 'POST',
       url: '/api/generate-embeddings'
     }

   );
  
  //  srv.on('generateEmbedding', async()=>{
  //   // let triggerAPI = await cds.connect.to("EARNINGS_CORE",{timeout: 120000});
  //   const response = await executeHttpRequest(
  //     {destinationName: 'DatasphereSrvWithSAMLAuth'},
  //     {
  //       method: 'GET',
  //       url: '/analytical/4TP_ESG_SACX_01/4AM_SF_EIM_FinPerfPreAgg_Workzone/4AM_SF_EIM_FinPerfPreAgg_Workzone?top=3'
  //     }
 
  //   );

   if (response.status === 200){
    return ("Embeddings generated successfully");
   }else{
    throw new Error(`Embedding API failed with status ${response.status}`)
   }
    

  });

  srv.on('chatResponse', async(req)=>{
   console.log("request obj" + req);
    const response = await executeHttpRequest(
      {destinationName: 'EARNINGS_CORE'},
      {
        method: 'POST',
        url: '/api/chat',
        headers: { 
          "Content-Type": "application/json" },
        data: { "message": req.data.prompt }

      }
 
    );
   
 

    if (response.status === 200 && response.data != null){
     return response.data
    }else{
     throw new Error(`Error creating chat response ${response.status}`)
    }
     
 
   });
  srv.on('READ', ['EmbeddingFiles'], async (req, next) => {
    if (!req.data.ID) {
      return next();
    }
  
    const url = req._.req.path;
    if (url.includes("content")) {
      console.log("Fetching media content for ID:", req.data.ID);
  
      let tx = cds.transaction(req);
      let mediaObj = await tx.run(
        SELECT.one.from("com.scb.earningupload.EmbeddingFiles", ["content", "mediaType","fileName"]).where({ ID: req.data.ID })
      );
  
      if (!mediaObj || !mediaObj.content) {
        console.error(`No content found for ID: ${req.data.ID}`);
        req.reject(404, `No media content found for ID: ${req.data.ID}`);
        return;
      }
      const res = req._.res;
      res.setHeader("Content-Type", mediaObj.mediaType || "application/octet-stream");
      console.log("filename" +mediaObj.fileName)
    // Set content disposition with original filename
    const safeFileName = encodeURIComponent(mediaObj.fileName || "download");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
    console.log("Media content fetched and header set successfully for ID:", req.data.ID);
 
      // No Buffer.from needed anymore!
      let decodedMedia = mediaObj.content;  // already a Buffer
  
      console.log("Media content fetched successfully for ID:", req.data.ID);
      return _formatResult(decodedMedia, mediaObj.mediaType);
    } else {
      return next();
    }
  });

  // Helper function to convert Readable stream to Buffer
  function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', err => reject(err));
    });
  }

  // function _formatResult(decodedMedia, mediaType) {
  //   const readable = new Readable();
  //   const result = new Array();
  //   readable.push(decodedMedia);
  //   readable.push(null);
  //   return {
  //     value: readable,
  //     '*@odata.mediaContentType': mediaType
  //   }
  // }

  function _formatResult(decodedMedia, mediaType) {
    return {
      value: decodedMedia,   // Buffer directly!
      '*@odata.mediaContentType': mediaType
    };
  }
});
