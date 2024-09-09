import { Account } from '../../models/account.model';
import { Account as SFDC_Account } from '../../../backend/sfdc/model/Account';
import { Address } from '../../models/address.model';
import { BillingDetails } from '../../models/billing-details.model';
import { User } from '../../../myuss/models';

export class SFDC_AccountMapper {
  public static getMyUSSAccountFromSFDCAccount(sfdcAccount: SFDC_Account): Account {
    const account = new Account();
    account.id = sfdcAccount.Id;
    account.name = sfdcAccount.Name;
    account.accountNumber = sfdcAccount.USF_Account_Number__c;
    account.customerType = sfdcAccount.Customer_Segment__c;
    account.businessType = sfdcAccount.Business_Type__c;
    account.primaryPayerEmail = sfdcAccount.PP_Email__c;
    account.primaryPayerId = sfdcAccount.Primary_Payer__c;
    account.outstandingBalance = sfdcAccount.USF_Outstanding_Balance__c;
    account.requirements = {
      purchaseOrder: sfdcAccount.PO_Required__c,
      lienRelease: sfdcAccount.Lien_Release_Required__c,
      autoPay: sfdcAccount.Auto_Pay_Requirement__c === 'Yes - USS Required',
    };
    account.defaultBillingDetails = new BillingDetails();
    account.defaultBillingDetails.billingAddress = this.getBillingAddressFromSFDCAccount(sfdcAccount);
    account.accountOwner = this.getAccountOwnerFromSFDCAccount(sfdcAccount);
    return account;
  }

  private static getBillingAddressFromSFDCAccount(sfdcAccount: SFDC_Account): Address {
    const billingAddress = new Address();
    billingAddress.street = sfdcAccount.BillingStreet;
    billingAddress.city = sfdcAccount.BillingCity;
    billingAddress.state = sfdcAccount.BillingState;
    billingAddress.zipcode = sfdcAccount.BillingPostalCode;
    billingAddress.country = sfdcAccount.BillingCountry;
    return billingAddress;
  }

  private static getAccountOwnerFromSFDCAccount(sfdcAccount: SFDC_Account): User {
    const accountOwner = new User();
    accountOwner.id = sfdcAccount.Owner.Id;
    accountOwner.firstName = sfdcAccount.Owner.FirstName;
    accountOwner.lastName = sfdcAccount.Owner.LastName;
    accountOwner.title = sfdcAccount.Owner.Title;
    accountOwner.phone = sfdcAccount.Owner.Phone;
    accountOwner.email = sfdcAccount.Owner.Email;

    return accountOwner;
  }

  public static getSFDCAccountFromMyUSSAccount(account: Account): SFDC_Account {
    throw new Error('Not implemented');
  }
}
