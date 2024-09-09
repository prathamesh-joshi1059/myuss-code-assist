import { SFDC_Object } from "./SFDC_Base";

export class History extends SFDC_Object {

    Id: string;
    Field: string; 
    OldValue: string;
    NewValue: string;
    CreatedDate: string;

    constructor() {
      super();
      this.Id = '';
    }
    public setTypeAttribute(): void {
      super._setTypeAttribute('History');
    }
  }