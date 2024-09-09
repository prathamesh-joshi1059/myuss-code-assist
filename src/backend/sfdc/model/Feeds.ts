import { SFDC_Object } from "./SFDC_Base";

export class Feeds extends SFDC_Object {

    Id: string;
    Type: string;
    Body: string;
    CreatedDate: string;

    constructor() {
      super();
      this.Id = '';
    }
    public setTypeAttribute(): void {
      super._setTypeAttribute('Feeds');
    }
  }