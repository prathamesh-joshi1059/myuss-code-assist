import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { CreateAddressReqDTO } from '../../../common/dto/address.req_res_dto';
import { SfdcAddressService } from '../../../backend/sfdc/services/sfdc-address/sfdc-address.service';
import { SfdcContactService } from '../../../backend/sfdc/services/sfdc-contact/sfdc-contact.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';


describe('AddressService', () => {
  let service: AddressService;
  let mockSfdcAddressService = {
    addSubSiteAddressDetails: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    getAddressesForAccount: jest.fn(),
    getChildAddress: jest.fn()
  };
  let mockSfdcContactService = {
    insertContacts: jest.fn()
  };
  // Mock the SfdcBaseService
  let mockSfdcService = {
    login: jest.fn(),
    getQuery: jest.fn(),
    updateSObject: jest.fn(),
    getMetadata: jest.fn(),
    createSObject: jest.fn(),
    updateSObjectByExternalId: jest.fn(),
    getSObjectById: jest.fn(),
    getSObjectRecordsByField: jest.fn(),
    getSObjectByIds: jest.fn(),
    getApex: jest.fn(),
    patchApex: jest.fn(),
    getDocumentBodyJSF: jest.fn(),
    postApex: jest.fn(),
    getDocumentBody: jest.fn(),
  };

  // Mock Logger Service
  let mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressService,
                  { provide: LoggerService, useValue: mockLoggerService },
                  { provide: SfdcAddressService, useValue: mockSfdcAddressService },
                  { provide: SfdcContactService, useValue: mockSfdcContactService },
                  { provide: SfdcBaseService, useValue: mockSfdcService}
                  ]

    }).compile();

    service = module.get<AddressService>(AddressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  // create address success case
  it('should create address', async () => {
    const request : CreateAddressReqDTO = {
      "address":{
          "accountId" :"001VA000003XJqEYAW",
          "street": "Brookline, MA,02446, US",
          "siteName" : "Site first",
          "country": "US",
          "city": "Brookline",
          "zipcode": "02446",
          "state": "MA",
          "startTime": "10:33:00.125Z",
          "endTime": "15:33:00.125Z",
          "shipToAddress" : true,
          "billToAddress" : false,
          "instructions":"near gate 1" ,
          "contactExist" : false,
          "contactId" : "003VA000005236SYAQ",
          "parentRefId" : "a8xVA000000Dnu9YAC"
      },
      "contact" :{
          "firstName":"Arati 1",
          "lastName" : "Gadgil ",
          "email": "arati.gadgil@zingworks.in",
          "phone" : "919763373464",
          "accountId" : "001VA000003XJqEYAW"
      }
    };
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "addressId": "a8xVA000000E2WbYAK"
      }
    }
    mockSfdcContactService.insertContacts.mockReturnValue([{id: '003VA000005236SYAQ', success: true, errors: []}]);
    mockSfdcAddressService.createAddress.mockReturnValue({id: 'a8xVA000000E2WbYAK', success: true, errors: []});
    const result = await service.createAddress(request);
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });
  // create address fail case
  // it('should create address', async () => {
  //   const request : CreateAddressReqDTO = {
  //     "address":{
  //         "accountId" :"",
  //         "street": "Brookline, MA,02446, US",
  //         "siteName" : "Site first",
  //         "country": "US",
  //         "city": "Brookline",
  //         "zipcode": "02446",
  //         "state": "MA",
  //         "startTime": "10:33:00.125Z",
  //         "endTime": "15:33:00.125Z",
  //         "shipToAddress" : true,
  //         "billToAddress" : false,
  //         "instructions":"near gate 1" ,
  //         "contactExist" : false,
  //         "contactId" : "003VA000005236SYAQ",
  //         "parentRefId" : "a8xVA000000Dnu9YAC"
  //     },
  //     "contact" :{
  //         "firstName":"Arati 1",
  //         "lastName" : "Gadgil ",
  //         "email": "arati.gadgil@zingworks.in",
  //         "phone" : "919763373464",
  //         "accountId" : ""
  //     }
  //   };
  //   const response = {
  //     "success": true,
  //     "status": 1000,
  //     "message": "Success",
  //     "data": {
  //         "addressId": "a8xVA000000E2WbYAK"
  //     }
  //   }
  //   mockSfdcContactService.insertContacts.mockReturnValue([{id: '003VA000005236SYAQ', success: true, errors: []}]);
  //   mockSfdcAddressService.createAddress.mockReturnValue({id: 'a8xVA000000E2WbYAK', success: true, errors: []});
  //   const result = await service.createAddress(request);
  //   expect(result).toBeDefined();
  //   expect(result).toEqual(response);
  // });
  // update address success case
  it('should update address', async () => {
    const request : CreateAddressReqDTO = {
      "address":{
          "accountId" :"001VA000003XJqEYAW",
          "street": "Brookline, MA,02446, US",
          "siteName" : "Site first",
          "country": "US",
          "city": "Brookline",
          "zipcode": "02446",
          "state": "MA",
          "startTime": "10:33:00.125Z",
          "endTime": "15:33:00.125Z",
          "shipToAddress" : true,
          "billToAddress" : false,
          "instructions":"near gate 1" ,
          "contactExist" : false,
          "contactId" : "003VA000005236SYAQ",
          "parentRefId" : "a8xVA000000Dnu9YAC"
      },
      "contact" :{
          "firstName":"Arati 1",
          "lastName" : "Gadgil ",
          "email": "arati.gadgil@zingworks.in",
          "phone" : "919763373464",
          "accountId" : "001VA000003XJqEYAW"
      }
    };
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": {
          "addressId": "a8xVA000000E2WbYAK"
      }
    }
    mockSfdcContactService.insertContacts.mockReturnValue([{id: '003VA000005236SYAQ', success: true, errors: []}]);
    mockSfdcAddressService.updateAddress.mockReturnValue({id: 'a8xVA000000E2WbYAK', success: true, errors: []});
    const result = await service.updateAddress('a8xVA000000E2efYAC',request);
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });
  // update address fail case
  it('should update address', async () => {
    const request : CreateAddressReqDTO = {
      "address":{
          "accountId" :"001VA000003XJqEYAW",
          "street": "Brookline, MA,02446, US",
          "siteName" : "Site first",
          "country": "US",
          "city": "Brookline",
          "zipcode": "02446",
          "state": "MA",
          "startTime": "10:33:00.125Z",
          "endTime": "15:33:00.125Z",
          "shipToAddress" : true,
          "billToAddress" : false,
          "instructions":"near gate 1" ,
          "contactExist" : false,
          "contactId" : "003VA000005236SYAQ",
          "parentRefId" : "a8xVA000000Dnu9YAC"
      },
      "contact" :{
          "firstName":"Arati 1",
          "lastName" : "Gadgil ",
          "email": "arati.gadgil@zingworks.in",
          "phone" : "919763373464",
          "accountId" : "001VA000003XJqEYAW"
      }
    };
    const response = {
      "success": false,
      "status": 1028,
      "message": "Could not update location details. Please try again.",
      "data": {
          "name": "NOT_FOUND",
          "errorCode": "NOT_FOUND"
      }
  }
    mockSfdcContactService.insertContacts.mockReturnValue([{id: '003VA000005236SYAQ', success: true, errors: []}]);
    mockSfdcAddressService.updateAddress.mockReturnValue({
      success: false,
      id: null,
      errors: {
        name: "NOT_FOUND",
        errorCode: "NOT_FOUND",
      },
    });
    const result = await service.updateAddress('',request);
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });

  // get parent address success case
  it('should get parent address', async () => {
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": [
          {
              "addressId": "a8xVA000000Dnu9YAC",
              "account": "001VA000003XJqEYAW",
              "street": ", Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": true,
              "isParentAddress": true,
              "isBillingAddress": false
          }
      ]
  }
    const sfdcRespone = [
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Dnu9YAC",
        },
        Id: "a8xVA000000Dnu9YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: ", Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: true,
        NF_Is_Parent__c: true,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: ", Brookline, MA,02446, US",
        NF_Site_Hours_Start_Time__c: "02:00:00.125Z",
        NF_Site_Hours_End_Time__c: "08:00:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: "G123",
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: null,
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
    ]
    mockSfdcAddressService.getAddressesForAccount.mockReturnValue(sfdcRespone)
    const result = await service.getAddressesForAccount('001VA000003XJqEYAW','parent');
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });
  // get all address success case
  it('should get child address', async () => {
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": [
          {
              "addressId": "a8xVA000000Dnu9YAC",
              "account": "001VA000003XJqEYAW",
              "street": ", Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": true,
              "isParentAddress": true,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Do2DYAS",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Do3pYAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Do73YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Drw9YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Dxn3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2WbYAK",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2d3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": null,
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2efYAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "1",
              "latitude": 42.33512,
              "longitude": -71.11127,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          }
      ]
  }
    const sfdcRespone = [
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Dnu9YAC",
        },
        Id: "a8xVA000000Dnu9YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: ", Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: true,
        NF_Is_Parent__c: true,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: ", Brookline, MA,02446, US",
        NF_Site_Hours_Start_Time__c: "02:00:00.125Z",
        NF_Site_Hours_End_Time__c: "08:00:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: "G123",
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: null,
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do2DYAS",
        },
        Id: "a8xVA000000Do2DYAS",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "03:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do3pYAC",
        },
        Id: "a8xVA000000Do3pYAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "03:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do73YAC",
        },
        Id: "a8xVA000000Do73YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Drw9YAC",
        },
        Id: "a8xVA000000Drw9YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Dxn3YAC",
        },
        Id: "a8xVA000000Dxn3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2WbYAK",
        },
        Id: "a8xVA000000E2WbYAK",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2d3YAC",
        },
        Id: "a8xVA000000E2d3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: null,
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2efYAC",
        },
        Id: "a8xVA000000E2efYAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "1",
        Address_Latitude_Longitude__c: {
          latitude: 42.33512,
          longitude: -71.11127,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Street",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.33512,
        Address_Latitude_Longitude__Longitude__s: -71.11127,
      },
    ]
    mockSfdcAddressService.getAddressesForAccount.mockReturnValue(sfdcRespone)
    const result = await service.getAddressesForAccount('001VA000003XJqEYAW','parent');
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });
  // get child address success case
  it('should get child address', async () => {
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": [
          {
              "addressId": "a8xVA000000Do2DYAS",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Do3pYAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Do73YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Drw9YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Dxn3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2WbYAK",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2d3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": null,
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2efYAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "1",
              "latitude": 42.33512,
              "longitude": -71.11127,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          }
      ]
  }
    const sfdcRespone = [
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do2DYAS",
        },
        Id: "a8xVA000000Do2DYAS",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "03:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do3pYAC",
        },
        Id: "a8xVA000000Do3pYAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "03:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do73YAC",
        },
        Id: "a8xVA000000Do73YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Drw9YAC",
        },
        Id: "a8xVA000000Drw9YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Dxn3YAC",
        },
        Id: "a8xVA000000Dxn3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2WbYAK",
        },
        Id: "a8xVA000000E2WbYAK",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2d3YAC",
        },
        Id: "a8xVA000000E2d3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: null,
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2efYAC",
        },
        Id: "a8xVA000000E2efYAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "1",
        Address_Latitude_Longitude__c: {
          latitude: 42.33512,
          longitude: -71.11127,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Street",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.33512,
        Address_Latitude_Longitude__Longitude__s: -71.11127,
      },
    ]
    mockSfdcAddressService.getAddressesForAccount.mockReturnValue(sfdcRespone)
    const result = await service.getAddressesForAccount('001VA000003XJqEYAW','parent');
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });

  //get sub site address success case
  it('should get sub site address', async () => {
    const response = {
      "success": true,
      "status": 1000,
      "message": "Success",
      "data": [
          {
              "addressId": "a8xVA000000Do73YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Drw9YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000Dxn3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2WbYAK",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "02446",
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2d3YAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": null,
              "latitude": 42.34748,
              "longitude": -71.11888,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          },
          {
              "addressId": "a8xVA000000E2efYAC",
              "account": "001VA000003XJqEYAW",
              "street": "Brookline, MA,02446, US",
              "city": "Brookline",
              "state": "MA",
              "zipcode": "1",
              "latitude": 42.33512,
              "longitude": -71.11127,
              "serviceable": false,
              "isParentAddress": false,
              "isBillingAddress": false
          }
      ]
  }
    const sfdcResponse = [
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Do73YAC",
        },
        Id: "a8xVA000000Do73YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Drw9YAC",
        },
        Id: "a8xVA000000Drw9YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "04:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 2",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000Dxn3YAC",
        },
        Id: "a8xVA000000Dxn3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2WbYAK",
        },
        Id: "a8xVA000000E2WbYAK",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "02446",
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2d3YAC",
        },
        Id: "a8xVA000000E2d3YAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: null,
        Address_Latitude_Longitude__c: {
          latitude: 42.34748,
          longitude: -71.11888,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Neighborhood",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.34748,
        Address_Latitude_Longitude__Longitude__s: -71.11888,
      },
      {
        attributes: {
          type: "USF_Address__c",
          url: "/services/data/v58.0/sobjects/USF_Address__c/a8xVA000000E2efYAC",
        },
        Id: "a8xVA000000E2efYAC",
        USF_Account__c: "001VA000003XJqEYAW",
        USF_Street__c: "Brookline, MA,02446, US",
        USF_City__c: "Brookline",
        USF_State__c: "MA",
        USF_Zip_Code__c: "1",
        Address_Latitude_Longitude__c: {
          latitude: 42.33512,
          longitude: -71.11127,
        },
        Is_Primary__c: false,
        USF_Bill_To_Address__c: false,
        USF_Ship_To_Address__c: false,
        NF_Is_Parent__c: false,
        GeoCode_Accuracy__c: "Street",
        Address_Validated__c: true,
        Site_Name__c: "Site first",
        NF_Site_Hours_Start_Time__c: "10:33:00.125Z",
        NF_Site_Hours_End_Time__c: "15:33:00.125Z",
        NF_Arrival_Start_Time__c: null,
        NF_Arrival_End_Time__c: null,
        NF_Gate_Code__c: null,
        NF_Access_instructions__c: null,
        NF_Key_Instructions__c: null,
        NF_Other_Instructions__c: null,
        NF_Placement__c: "near gate 1",
        Address_Latitude_Longitude__Latitude__s: 42.33512,
        Address_Latitude_Longitude__Longitude__s: -71.11127,
      },
    ]
    mockSfdcAddressService.getChildAddress.mockReturnValue(sfdcResponse);
    const result = await service.getChildAddress('001VA000003XJqEYAW','a8xVA000000Dnu9YAC');
    expect(result).toBeDefined();
    expect(result).toEqual(response);
  });
    
});
