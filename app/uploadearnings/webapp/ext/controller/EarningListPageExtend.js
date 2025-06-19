sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/library"
], function(MessageToast,coreLibrary) {
    'use strict';    
    let extensionAPI;
    async function _updateStatus(oContext, sStatus){
        const oModel = oContext.getModel();
        const sPath  = oContext.getPath();
        try{
            await oModel.update(sPath, {status: sStatus});
            MessageToast.show("Status updated to" + sStatus);
        } catch(err){
            console.error("update failed",err);
            MessageToast.show("Failed to update status")
        }
    }
    return {           
        onInit: function(){
            ///    extensionAPI = this.extensionAPI;
            const oModel = this.getView().getModel("visibility");

            if (oModel){
              oModel.oBindContext("/VisibilityConfig").requestObject().then((data) => {
                console.log("visibility Config", data);

              }).catch(err =>{
                console.log("Failed", err);

              })
            }else{
              console.warn("visibiliy model not found");
            }

                 
        },

        onApprove:async function( oBindingContext, aSelectedContexts) {

            
              if(!aSelectedContexts || aSelectedContexts.length === 0) {
                 MessageToast.show("Please select at least one row")
              }
              let model = this.editFlow.getView().getModel();
              const aIDs = aSelectedContexts.map(ctx=> ctx.getProperty("ID"));
              try{
                let result = await this.editFlow.invokeAction(
                    "/approveFiles",{
                      skipParameterDialog: true,
                      model: model,
                      parameterValues: [{name: "ids", value: aIDs}],    
                      invocationGroupig: "Isolated"
                    } 
                
                )

                MessageToast.show("Files approved Successfully");

              }catch(err){
                console.error("Approval Failed", err);
                MessageToast.show("Approval Failed");
              }
 
        },
        onReject: async function(oBindingContext, aSelectedContexts) {
            if(!aSelectedContexts || aSelectedContexts.length === 0) {
                MessageToast.show("Please select at least one row")
             }
             let model = this.editFlow.getView().getModel();
             const aIDs = aSelectedContexts.map(ctx=> ctx.getProperty("ID"));
             try{
               let result = await this.editFlow.invokeAction(
                   "/rejectFiles",{
                     skipParameterDialog: true,
                     model: model,
                     parameterValues: [{name: "ids", value: aIDs}],    
                     invocationGroupig: "Isolated"
                   } 
               
               )

               MessageToast.show("Files Rejected Successfully");

             }catch(err){
               console.error("Rejection Failed", err);
               MessageToast.show("Rejection Failed");
             }
        }
    };
});
