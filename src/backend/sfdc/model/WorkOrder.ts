import { ServiceAppointment } from "./ServiceAppointment";
import { USF_Address__c } from "./USF_Address__c";

export class WorkOrder {
  Id: string;
  WorkType: WorkType;
  Site_Address__c: string;
  Status: string;
  StartDate: Date;
  EndDate: Date;
  Schedule_Start__c: Date;
  Scheduled_End__c: Date;
  Actual_Start__c: Date; 
  Actual_End__c: Date;
  Duration: number;
  DurationInMinutes: number;
  Product_Information__c: string;
  ShipTo_Information__c: string;
  Special_Instructions__c: string;
  Count_of_WOLI__c: number;
  Completed_WOLI__c: number;
  Pickup_Reason_Code__c: string;
  Service_Appointments__r: ServiceAppointment[];
  Site_Address__r: USF_Address__c;
  Cancel__c: boolean;
  NF_Origin__c?: string;
}

export class WorkType {
  Id: string;
  Name: string;
}