import { Injectable } from '@nestjs/common';
import { USF_Address__c } from '../../../backend/sfdc/model/USF_Address__c';
import { SfdcAddressService } from '../../../backend/sfdc/services/sfdc-address/sfdc-address.service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { CreateAddressReqDTO } from '../../../common/dto/address.req_res_dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { GetAddressesRespDTO } from '../../../myuss/controllers/accounts/dto/get-addresses-resp.dto';
import { SFDC_ContactMapper } from '../../../myuss/mappers/salesforce/contact.mapper';


@Injectable()
export class AddressService {

  constructor(
    private logger: LoggerService,
    private sfdcAddressService: SfdcAddressService,
    private sfdcContactService: SfdcContactService,
    ) {}

  async createAddress(addressObj: CreateAddressReqDTO): Promise<ApiRespDTO<any>> {
    this.logger.info("updateAddress: ",addressObj);
    const validitionResponse = await this.validateSiteStartEndTime(addressObj.address.startTime, addressObj.address.endTime);
    if(!validitionResponse.success){
      return validitionResponse;
    }
    let subSiteContactRefId = "";
    if(addressObj.contactExist){
      subSiteContactRefId = addressObj.contact.contactId;
    }else{
      let contactObj = SFDC_ContactMapper.getSFDCContactFromMyUSSContact(addressObj.contact);
      subSiteContactRefId = (await this.sfdcContactService.insertContacts([contactObj]))[0].id;
      this.logger.info(`new created contact id: ${subSiteContactRefId}`);
    }
    addressObj.address.shipToContactRefId = subSiteContactRefId;
    addressObj.address.siteContactRefId = subSiteContactRefId;
    const addAddressDetailsModel = this.sfdcAddressService.addSubSiteAddressDetails(addressObj.address);
    const addAddressResult = await this.sfdcAddressService.createAddress(addAddressDetailsModel);   
    if(addAddressResult.success){
      return {
        success: true,
        status: 1000,
        message: 'Success',
        data: { addressId : addAddressResult.id,
                contactId : subSiteContactRefId },
      };
    }else{
      return {
        success: false,
        status: 1027,
        message: 'Failed to add address. Please try again.',
        data: {errors: addAddressResult.errors }
      }
    }
  }

  async updateAddress(id: string,addressObj: CreateAddressReqDTO): Promise<ApiRespDTO<any>> {
    this.logger.info("updateAddress: ",addressObj);
    const validitionResponse = await this.validateSiteStartEndTime(addressObj.address.startTime, addressObj.address.endTime);
    if(!validitionResponse.success){
      return validitionResponse;
    }
    let subSiteContactRefId = "";
    addressObj.address.id = id;
      if(addressObj.contactExist){
        subSiteContactRefId = addressObj.contact.contactId;
      }else{
        let contactObj = SFDC_ContactMapper.getSFDCContactFromMyUSSContact(addressObj.contact);
        subSiteContactRefId = (await this.sfdcContactService.insertContacts([contactObj]))[0].id;
        this.logger.info("new created contact id: ",subSiteContactRefId);
      }
      addressObj.address.shipToContactRefId = subSiteContactRefId;
      addressObj.address.siteContactRefId = subSiteContactRefId;
      const addAddressDetailsModel = this.sfdcAddressService.addSubSiteAddressDetails(addressObj.address);
      const addAddressResult = await this.sfdcAddressService.updateAddress(addAddressDetailsModel);
      if(addAddressResult.success){
        return {
          success: true,
          status: 1000,
          message: 'Success',
          data: { addressId : addAddressResult.id,
                  contactId : subSiteContactRefId  },
        };
      }else{
        return {
          success: false,
          status: 1028,
          message: 'Could not update location details. Please try again.',
          data: {errors :addAddressResult.errors},
        }
      }
  }
  async getAddressesForAccount(accountId: string,type: string): Promise<ApiRespDTO<GetAddressesRespDTO[]>> {
    let addressesResp: USF_Address__c[] = await this.sfdcAddressService.getAddressesForAccount(accountId,type);
    let getAddressesResult = new ApiRespDTO<GetAddressesRespDTO[]>();
    if (addressesResp == undefined) {
      getAddressesResult = {
        status: 1030,
        message: 'Fail',
        success: false,
        data: [],
      };
      return getAddressesResult;
    }
    if (addressesResp.length == 0) {
      getAddressesResult = {
        success: true,
        status: 1000,
        message: 'Address not found',
        data: [],
      };
      return getAddressesResult;
    }

    let addressList: GetAddressesRespDTO[] = [];
    addressesResp.map((address: USF_Address__c) => {
      try {
        let addressObj: GetAddressesRespDTO = {
          siteName: address.Site_Name__c,
          addressId: address.Id,
          account: address.USF_Account__c,
          street: address.USF_Street__c,
          city: address.USF_City__c,
          state: address.USF_State__c,
          zipcode: address.USF_Zip_Code__c,
          latitude: address.Address_Latitude_Longitude__Latitude__s ?? 0,
          longitude: address.Address_Latitude_Longitude__Longitude__s ?? 0,
          serviceable: address.USF_Ship_To_Address__c? address.USF_Ship_To_Address__c : false,
          isParentAddress: address.NF_Is_Parent__c || false,
          isBillingAddress: address.USF_Bill_To_Address__c && address.Is_Primary__c || false,
        };
        addressList.push(addressObj);
      } catch (err) {
        this.logger.error(err);
      }
    });
   
    getAddressesResult = {
      success: true,
      status: 1000,
      message: 'Success',
      data: addressList,
    };
    return getAddressesResult;
  }
  async getChildAddress(addressId:string,accountId:string): Promise<ApiRespDTO<GetAddressesRespDTO[]>> {
    let addressesResp = await this.sfdcAddressService.getChildAddress(addressId,accountId);
    let getAddressesResult = new ApiRespDTO<GetAddressesRespDTO[]>();
    if (addressesResp == undefined) {
      getAddressesResult = {
        status: 1030,
        message: 'Fail',
        success: false,
        data: [],
      };
      return getAddressesResult;
    }
    if (addressesResp.length == 0) {
      getAddressesResult = {
        success: true,
        status: 1000,
        message: 'Address not found',
        data: [],
      };
      return getAddressesResult;
    }

    let addressList: GetAddressesRespDTO[] = [];
    addressesResp.map((address: USF_Address__c) => {
      try {
        let addressObj: GetAddressesRespDTO = {
          siteName: address.Site_Name__c,
          addressId: address.Id,
          account: address.USF_Account__c,
          street: address.USF_Street__c,
          city: address.USF_City__c,
          state: address.USF_State__c,
          zipcode: address.USF_Zip_Code__c,
          latitude: address.Address_Latitude_Longitude__Latitude__s ?? 0,
          longitude: address.Address_Latitude_Longitude__Longitude__s ?? 0,
          serviceable: address.USF_Ship_To_Address__c? address.USF_Ship_To_Address__c : false,
          isParentAddress: address.NF_Is_Parent__c || false,
          isBillingAddress: address.USF_Bill_To_Address__c && address.Is_Primary__c || false,
        };
        addressList.push(addressObj);
      } catch (err) {
        this.logger.error(err);
      }
    });
   
    getAddressesResult = {
      success: true,
      status: 1000,
      message: 'Success',
      data: addressList,
    };
    return getAddressesResult;
  }
  async validateSiteStartEndTime(siteStartTime: string, siteEndTime: string): Promise<ApiRespDTO<any>>{
    // Scenario 1: Both properties are optional.
    if (!siteStartTime && !siteEndTime) {
     console.log("If both are empty return null", siteStartTime, siteEndTime);
      return {
        success: true,
        status: 1000,
        message: 'Success',
        data: null,
      }
    }
    if((siteStartTime && !siteEndTime) || (!siteStartTime && siteEndTime)){
      console.log("If either start time or end time is empty show incomplete error", siteStartTime, siteEndTime);
      return {
        success: false,
        status: 1010,
        message: 'Please enter start time and end time for the site hours.',
        data: {},
      }
    }
    // Convert string times to Date objects
    const startTime = new Date(`01/01/2000 ${siteStartTime}`);
    const endTime = new Date(`01/01/2000 ${siteEndTime}`);
    console.log("startTimeObj: ", startTime, "endTimeObj: ", endTime);
    // Scenario 2: The difference between start time and end time must be 2 hours
    const differenceInHours =(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);;
    if (differenceInHours < 2) {
      this.logger.info("Time difference is less than 2 hours",differenceInHours);
      //Scenario 3: The start time cannot be greater than the end time
      if(differenceInHours < 0) {
        return{
          success: false,
          status: 1010,
          message: 'Site hours Start Time should be earlier than End time.',
          data: {},
        }
      }
      return {
        success: false,
        status: 1010,
        message: 'Start Time & End Time should have atleast 2 hours difference.',
        data: {},
      
      }
    }
    // All validations pass
    return {
      success: true,
      status: 1000,
      message: 'Success',
      data: {},
    };
   }
  }


