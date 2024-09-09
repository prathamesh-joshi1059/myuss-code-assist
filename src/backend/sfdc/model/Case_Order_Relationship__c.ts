import { Contract } from './Contract';
import { SFDC_Object } from './SFDC_Base';

export class Case_Order_Relationship__c extends SFDC_Object {
  Id: string;
  Case__c: string;
  USS_Order__c: string;
  USS_Order__r?: Contract;
  caseCount:number;
  MyUSS_Case_Type__c: string;
 
  public setTypeAttribute(): void {
    super._setTypeAttribute('Case_Order_Relationship__c');
  }
}
