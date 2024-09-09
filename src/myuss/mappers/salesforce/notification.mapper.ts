import { NotificationResObj, NotificationResponse } from "../../models/notification";
export class SFDC_NotificationMapper {
    static getMyUSSNotificationFromSFDCNotification(sfdcUSFNotification) {
        const notification = new NotificationResObj();
       notification.quoteId = sfdcUSFNotification.Id;
       notification.quoteNo = sfdcUSFNotification.Contract__r.Reference_Number__c;
       notification.status = sfdcUSFNotification.WorkType.Name;
         notification.date = sfdcUSFNotification.Schedule_Start__c ? sfdcUSFNotification.Schedule_Start__c : sfdcUSFNotification.StartDate;
         notification.siteAddress.street = sfdcUSFNotification.Site_Address__r.USF_Street__c;
            notification.siteAddress.city = sfdcUSFNotification.Site_Address__r.USF_City__c;
            notification.siteAddress.state = sfdcUSFNotification.Site_Address__r.USF_State__c;
            notification.siteAddress.zipcode = sfdcUSFNotification.Site_Address__r.USF_Zip_Code__c;
            notification.siteAddress.position.lat = sfdcUSFNotification.Site_Address__r.Address_Latitude_Longitude__c.latitude;
            notification.siteAddress.position.lng = sfdcUSFNotification.Site_Address__r.Address_Latitude_Longitude__c.longitude;
            return notification;
    }
}
