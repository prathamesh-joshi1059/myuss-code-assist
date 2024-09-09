export class ServiceAppointment {
  Id: string;
  Status: string;
  EarliestStartTime: Date; 
  DueDate: Date;
  SchedStartTime: Date; 
  SchedEndTime: Date;
  Canceled_Reason__c: string; 
  ActualStartTime: Date;
  ActualEndTime: Date;
  TimeZone__c: string;
  FSL__InternalSLRGeolocation__Latitude__s: number;
  FSL__InternalSLRGeolocation__Longitude__s: number;
  ServiceResources: ServiceResource[];
}

export class AssignedResource {
  Id: string;
  ServiceResource: ServiceResource;
}

export class ServiceResource {
  Id: string;
  Name: string;
}