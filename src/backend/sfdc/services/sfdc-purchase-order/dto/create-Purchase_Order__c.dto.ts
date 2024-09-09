export class CreateDto_Purchase_Order__c {
    Name: string;
    Account__c: string;
    Amount__c: number;
    Expiration_Date__c: Date;

    constructor() {
        this.Name = '';
        this.Account__c = '';
        this.Amount__c = 0;
        this.Expiration_Date__c = new Date(2049, 12, 31);
    }
}