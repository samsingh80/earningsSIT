using {com.scb.earningupload as earning_upload} from '../db/schema.cds';
service configSrv {

  @odata.draft.enabled
  entity Banks as projection on earning_upload.Banks  ;



}