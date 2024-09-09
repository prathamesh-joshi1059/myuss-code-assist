import { Injectable } from '@nestjs/common';
import { NotificationObject, NotificationResponse } from '../../models/notification';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { USS_CUSTOMERCARE_MESSAGE } from '../../../core/utils/constants';

@Injectable()
export class NotificationService {
  constructor(
    private sfdcContractService: SfdcContractService,
    private logger: LoggerService,
  ) {}

  async fetchNotification(accountId: string): Promise<ApiRespDTO<NotificationResponse[]>> {
    this.logger.info('accountId: ' + accountId);
    let notificationRespObj = new ApiRespDTO<any>();
    const notificationResp = await this.sfdcContractService.fetchNotification(accountId);

    if (notificationResp && notificationResp.records && notificationResp.records.length === 0) {
      return {
        success: true,
        status: 1000,
        message: 'Data not found',
        data: { notifications: [] },
      };
    }

    const notificationArr: NotificationResponse[] = [];

    notificationResp?.records.forEach((notification: NotificationObject) => {
      try {
        if (notification.Product_Information__c != null) {
          const notificationObj: NotificationResponse = {
            quoteNo: notification.Contract__r ? 'O-' + notification.Contract__r.Reference_Number__c : '',
            quoteId: notification.Id,
            status: notification.WorkType ? notification.WorkType.Name : '',
            date: notification.Schedule_Start__c ? notification.Schedule_Start__c : notification.StartDate,
            siteAddress: {
              street: notification.Site_Address__r ? notification.Site_Address__r.USF_Street__c : '',
              city: notification.Site_Address__r ? notification.Site_Address__r.USF_City__c : '',
              state: notification.Site_Address__r ? notification.Site_Address__r.USF_State__c : '',
              zipcode: notification.Site_Address__r ? notification.Site_Address__r.USF_Zip_Code__c : '',
              position: {
                lat: notification.Site_Address__r ? notification.Site_Address__r.Address_Latitude_Longitude__c.latitude : 0,
                lng: notification.Site_Address__r ? notification.Site_Address__r.Address_Latitude_Longitude__c.longitude : 0,
              },
            },
          };
          notificationArr.push(notificationObj);
        }
      } catch (error) {
        this.logger.error(
          'Error in fetch notification service while preparing notification object',
          error.message,
        );
        return {
          success: false,
          status: 1008,
          message: USS_CUSTOMERCARE_MESSAGE,
          data: {},
        };
      }
    });

    return {
      success: true,
      status: 1000,
      message: 'Success',
      data: { notifications: notificationArr },
    };
  }
}