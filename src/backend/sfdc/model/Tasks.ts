import { SFDC_Object } from "./SFDC_Base";

export class Tasks extends SFDC_Object {

    Id : string;
    Subject: string;
    Description: string;
    ActivityDate: string;
    TaskSubtype: string;
    CreatedDate: string;

    constructor() {
      super();
      this.Id = '';
    }
    public setTypeAttribute(): void {
      super._setTypeAttribute('Tasks');
    }
  }