import { Contact } from '../../models/contact.model';
import { Contact as SFDCContact } from '../../../backend/sfdc/model/Contact';

export class SFDC_ContactMapper {
  public static getMyUSSContactFromSFDCContact(sfdcUSFContact: SFDCContact): Contact {
    const contact = new Contact();
    contact.id = sfdcUSFContact.Id ? sfdcUSFContact.Id : null;
    contact.firstName = sfdcUSFContact.FirstName;
    contact.lastName = sfdcUSFContact.LastName;
    contact.phone = sfdcUSFContact.Phone;
    contact.email = sfdcUSFContact.Email;
    contact.title = sfdcUSFContact.Title;
    let name = sfdcUSFContact.FirstName + ' ' + sfdcUSFContact.LastName ;
    let fullName = name.trim() === 'MyUSS System User' ? 'Customer Care' : name.trim();
    contact.fullName = fullName;
    return contact;
  } 
  public static getSFDCContactFromMyUSSContact(myussContact: Contact): SFDCContact {
    const sfdcUSFContact =  new SFDCContact();
      sfdcUSFContact.FirstName = myussContact.firstName;
      sfdcUSFContact.LastName = myussContact.lastName;
      sfdcUSFContact.Phone = myussContact.phone;
      sfdcUSFContact.Email = myussContact.email;
      sfdcUSFContact.AccountId = myussContact.accountId;
      return sfdcUSFContact;
  }

  




}
