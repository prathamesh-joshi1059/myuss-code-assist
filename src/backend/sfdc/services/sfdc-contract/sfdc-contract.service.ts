import { Case_Order_Relationship__c } from 'src/backend/sfdc/model/Case_Order_Relationship__c';
import { Injectable } from '@nestjs/common';
import { Contract } from '../../model/Contract';
import { SfdcBaseService } from '../sfdc-base/sfdc-base.service';
import { LoggerService } from '../../../../core/logger/logger.service';
import { NF_Asset_Location__c } from '../../model/NF_Asset_Location__c';
import { AssetLocations } from '../../../../myuss/models/asset-location.model';
import { SFDC_AssetLocation } from '../../../../myuss/mappers/salesforce/asset-location.mapper';
import {
  ChangeQuantityOrderModel,
  CancelContractReqDto,
  ChangeQuantityReqDto,
  ConfirmEasyPayReqDto,
  EditQuantityReqDto,
} from '../../../../myuss/controllers/contract/dto/contract-req.dto';
import { API_VERSION } from '../../../../myuss/services/quote/constants';
import { SBQQ__Quote__c } from '../../model/SBQQ__Quote__c';
import { TrackUserActionService } from '../../../../core/track-user-action/track-user-action-service';
import { WorkOrder } from '../../model/WorkOrder';
import { SFDC_ContractMapper } from '../../../../myuss/mappers/salesforce/contract.mapper';
import { SBQQ__Subscription__c } from '../../model/SBQQ__Subscription__c';
import jsforce from 'jsforce';

@Injectable()
export class SfdcContractService {
  constructor(
    private sfdcBaseService: SfdcBaseService,
    private logger: LoggerService,
    private trackUserActionService: TrackUserActionService,
  ) {}

  async getContractDetails(id: string): Promise<Contract> {
    const promises = [
      this.getContractDetailsByContractId(id),
      this.getDocumentDetails(id),
    ];
    
    const promiseResp = await Promise.all(promises);
    let contract = new Contract();
    // TODO: Add error handling
    Object.assign(contract, promiseResp[0][0]);
    contract.contractDocumnetId = promiseResp[1]?.SBQQ__DocumentId__c;
    contract.contractDocumentName = promiseResp[1]?.Name;
    contract.Work_Orders__r = await this.fetchWorkOrders(id);
    return contract;
  }

  async getDocumentDetails(id: string): Promise<string> {
    const documentIdResp = await this.sfdcBaseService
      .getQuery(`select Name,SBQQ__DocumentId__c from SBQQ__QuoteDocument__c where SBQQ__Quote__c in 
            (select SBQQ__Quote__c from Contract where Id = '${id}') and SBQQ__QuoteTemplate__c in 
            (select id from SBQQ__QuoteTemplate__c where name like '%Order%')`);
    return documentIdResp.records[0];
  }

  async getContractByOrderIdAndZIP(orderId: string, zipCode: string): Promise<Contract | null> {
    const safeOrderId = this.sfdcBaseService.escapeSOQLString(orderId);
    const safeZipCode = this.sfdcBaseService.escapeSOQLString(zipCode);
    const soql = `SELECT Id, Status, Ship_To_Street__c, Ship_To_City__c, Ship_To_State__c, Ship_To_Zip_Code__c, StartDate,
          Purchase_Order__r.Name,
          (SELECT Id, Cancel__c, WorkType.Name, Status, StartDate, Schedule_Start__c, Actual_Start__c, Actual_End__c, Product_Information__c,
            Site_Address__c, Site_Address__r.Site_Name__c, Site_Address__r.NF_Placement__c, Site_Address__r.USF_Street__c,
            Site_Address__r.USF_City__c, Site_Address__r.USF_State__c, Site_Address__r.USF_Zip_Code__c,
            Site_Address__r.Address_Latitude_Longitude__Latitude__s, Site_Address__r.Address_Latitude_Longitude__Longitude__s, 
          (SELECT Id, Status, TimeZone__c FROM Service_Appointments__r) 
          FROM Work_Orders__r WHERE StartDate >= LAST_90_DAYS AND StartDate <= NEXT_90_DAYS) 
          FROM Contract WHERE Reference_Number__c = '${safeOrderId}' AND Ship_To_Zip_Code__c = '${safeZipCode}'`;
    const contracts = await this.sfdcBaseService.conn.query<Contract>(soql);
    return contracts?.records?.[0] ?? null;
  }

  // fetch contract details by Id
  async getContractDetailsByContractId(id: string): Promise<Contract> {
    const contract = await this.sfdcBaseService.conn
      .sobject('Contract')
      .select(
        `Id,
       SBQQ__Quote__r.Id,
       SBQQ__Quote__r.PrimarySiteContact__r.FirstName,
       SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s,
       SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,
       SBQQ__Quote__r.PrimarySiteContact__r.LastName,
       SBQQ__Quote__r.PrimarySiteContact__r.Email,
       SBQQ__Quote__r.PrimarySiteContact__r.Phone,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__c,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name, 
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.USF_Project_Type__c,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Project_ID_SF__c,
       SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c,
       Name, 
       Reference_Number__c, 
       BillCycleDay__c, 
       Billing_Period__c, 
       NF_EEC_Percent__c, 
       NF_ESF_Percent__c, 
       Fuel_Surcharge_Percent__c,      
       InvoiceDeliveryMethod__c, 
       LastBillingDate__c,
       Location_Code__c, 
       Status, 
       Order_Type__c, 
       Facility_Name__c,
       Bill_To_Contact_Name__c, 
       Bill_To_Contact_Email__c, 
       Subdivision_Name__c, 
       AutoPay__c, 
       Payment_Method_ID__c, 
       StartDate, 
       EndDate,
       AccountId,
       CreatedDate, 
       LastModifiedDate, 
       Purchase_Order__r.Id, 
       Purchase_Order__r.Name, 
       Purchase_Order__r.Amount__c, 
       Purchase_Order__r.Expiration_Date__c,
       Ship_To__c, Ship_To_Street__c, 
       Ship_To_City__c, 
       Ship_To_State__c, 
       Ship_To_Zip_Code__c,   
       SBQQ__Quote__r.Primary_Contact__c, 
       SBQQ__Quote__r.SBQQ__PrimaryContact__r.FirstName, 
       SBQQ__Quote__r.SBQQ__PrimaryContact__r.LastName, 
       SBQQ__Quote__r.SBQQ__PrimaryContact__r.Email, 
       SBQQ__Quote__r.SBQQ__PrimaryContact__r.Phone,
       SBQQ__Quote__r.SecondaryBillToContact__r.Id,
       SBQQ__Quote__r.SecondaryBillToContact__r.FirstName,
       SBQQ__Quote__r.SecondaryBillToContact__r.LastName,
       SBQQ__Quote__r.SecondaryBillToContact__r.Phone,
       SBQQ__Quote__r.SecondaryBillToContact__r.Email`,
      )
      .include('Asset_Locations__r')
      .select(
        `Id, 
        Name, 
        NF_USS_Order__c, 
        NF_End_Date__c, 
        NF_Start_Date__c, 
        NF_Service_Product__r.Id, 
        Service_Start_Date__c, 
        Service_End_Date__c,
        NF_Placed_Jobsite__r.Id,
        NF_Placed_Jobsite__r.USF_Account__c,
        NF_Placed_Jobsite__r.Name,
        NF_Placed_Jobsite__r.NF_Parent_USF_Address__c,
        NF_Placed_Jobsite__r.USF_Street__c,
        NF_Placed_Jobsite__r.USF_City__c,
        NF_Placed_Jobsite__r.USF_State__c,
        NF_Placed_Jobsite__r.USF_Zip_Code__c,
        NF_Placed_Jobsite__r.USF_Country__c,
        NF_Placed_Jobsite__r.Address_Latitude_Longitude__Latitude__s,
        NF_Placed_Jobsite__r.Address_Latitude_Longitude__Longitude__s,
        NF_Placed_Jobsite__r.Is_Primary__c,
        NF_Placed_Jobsite__r.USF_Ship_To_Address__c,
        NF_Placed_Jobsite__r.USF_Bill_To_Address__c,
        NF_Placed_Jobsite__r.NF_Is_Parent__c,
        NF_Placed_Jobsite__r.Address_Validated__c,
        NF_Placed_Jobsite__r.GeoCode_Accuracy__c,
        NF_Placed_Jobsite__r.Site_Name__c,
        NF_Placed_Jobsite__r.NF_Site_Hours_Start_Time__c,
        NF_Placed_Jobsite__r.NF_Site_Hours_End_Time__c,
        NF_Placed_Jobsite__r.NF_Arrival_Start_Time__c,
        NF_Placed_Jobsite__r.NF_Arrival_End_Time__c,
        NF_Placed_Jobsite__r.NF_Gate_Code__c,
        NF_Placed_Jobsite__r.NF_Access_instructions__c,
        NF_Placed_Jobsite__r.NF_Key_Instructions__c,
        NF_Placed_Jobsite__r.NF_Other_Instructions__c,
        NF_Placed_Jobsite__r.NF_Placement__c,
        NF_Placed_Jobsite__r.NF_Ship_To_Contact__r.Id,
        NF_Placed_Jobsite__r.NF_Ship_To_Contact__r.FirstName,
        NF_Placed_Jobsite__r.NF_Ship_To_Contact__r.LastName,
        NF_Placed_Jobsite__r.NF_Ship_To_Contact__r.Email,
        NF_Placed_Jobsite__r.NF_Ship_To_Contact__r.Phone`,
      )
      .end()
      .include('SBQQ__Subscriptions__r')
      .select(
        `Id,
        SBQQ__Product__c, 
        SBQQ__RequiredById__c, 
        SBQQ__StartDate__c, 
        SBQQ__EndDate__c, 
        NF_Service_Start_Date__c, 
        NF_Service_End_Date__c, 
        Price_Override__c, 
        Product_Type__c, 
        SBQQ__ChargeType__c, 
        SBQQ__Product__r.Id, 
        SBQQ__Product__r.ProductCode, 
        SBQQ__Product__r.Name,
        SBQQ__Product__r.Number_of_Services__c,
        SBQQ__Product__r.Description, 
        SBQQ__Product__r.SBQQ__Taxable__c,
        SBQQ__Quantity__c, 
       AVA_SFCPQ__TaxAmount__c
        `,
      )
      .end()
      .where({ Id: id })
      .execute();
    return contract;
  }

  async fetchWorkOrders(contractId: string): Promise<WorkOrder[]> {
    const workOrders = await this.sfdcBaseService.conn
      .sobject('WorkOrder')
      .select(
        `Id, WorkType.Name, Site_Address__c, Status, NF_Origin__c, StartDate, EndDate, Actual_Start__c, Actual_End__c, Duration, DurationInMinutes,
          Product_Information__c, ShipTo_Information__c, Special_Instructions__c, Count_of_WOLI__c, Completed_WOLI__c,
          Pickup_Reason_Code__c, Cancel__c`,
      )
      .include('Service_Appointments__r')
      .select(
        `Id, Status, EarliestStartTime, DueDate, SchedStartTime, SchedEndTime, Canceled_Reason__c, ActualStartTime, ActualEndTime,   
          FSL__InternalSLRGeolocation__Latitude__s, FSL__InternalSLRGeolocation__Longitude__s,
          (
            SELECT Id, ServiceResource.Id, ServiceResource.Name FROM ServiceResources
          )`,
      )
      .end()
      .where({ Contract__c: contractId })
      .execute({ autoFetch: true, maxFetch: 100000 });
    return workOrders;
  }

  // fetch contracts - all/by project Id
  async fetchContracts(accountIds: string[], statusArr: string[], projectId: string): Promise<Object[]> {
    let contracts: Contract[];
    let orderObjectResult: Contract[];

    const caseOrderRelation: Case_Order_Relationship__c[] = await this.sfdcBaseService.getQuery(
      `select count(id) caseCount, Case__r.MyUSS_Case_Type__c, USS_Order__c from Case_Order_Relationship__c where Case__r.AccountId IN ('${accountIds.join(
        "','",
      )}') group by Case__r.MyUSS_Case_Type__c, USS_Order__c
      order by USS_Order__c`,
    );

    const soqlForContracts = `Id,AccountId,SBQQ__Quote__r.Id,SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s ,
        SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s,Payment_Method_Id__c, Status,Reference_Number__c, Ship_To__c,
        Ship_To_Zip_Code__c,LastModifiedDate ,Bill_To_Address__r.Name, Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s,Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s,
        SBQQ__Quote__r.Recurring_Subtotal__c , billingEffectiveDateCombined__c, StartDate, AutoPay__c, EndDate, SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id ,
        SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Name, SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Project_ID_SF__c,
        SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.USF_USS_Project_Status__c,ContractNumber`;

    if (!projectId) {
      contracts = await this.sfdcBaseService.conn
        .sobject('Contract')
        .select(soqlForContracts)
        .include('CaseOrderRelationships__r')
        .select('id')
        .where({ Case_Status__c: { $ne: 'Closed' } })
        .end()
        .where({
          status: { $in: statusArr },
          AccountId: { $in: accountIds },
        })
        .execute({ autoFetch: true, maxFetch: 100000 });

      orderObjectResult = await this.sfdcBaseService.conn
        .sobject('Order')
        .select(`id, SBQQ__Quote__r.id, SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s , SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s, 
        Payment_Method_ID__c, Status, Reference_Number__c, SBQQ__Quote__r.Recurring_Subtotal__c, AutoPay__c, Shipping_Address__r.Name,
        USS_Order__c`)
        .where({
          status: { $in: statusArr },
          AccountId: { $in: accountIds },
          CreatedDate: { $gte: jsforce.Date.LAST_N_DAYS(7) },
        })
        .execute({ autoFetch: true, maxFetch: 100000 });
    } else {
      contracts = await this.sfdcBaseService.conn
        .sobject('Contract')
        .select(soqlForContracts)
        .include('CaseOrderRelationships__r')
        .select('id')
        .where({ Case_Status__c: { $ne: 'Closed' } })
        .end()
        .where({
          status: { $in: statusArr },
          AccountId: { $in: accountIds },
          'SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r.Id': projectId,
        })
        .execute({ autoFetch: true, maxFetch: 100000 });

      orderObjectResult = await this.sfdcBaseService.conn
        .sobject('Order')
        .select(`id, SBQQ__Quote__r.id, SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s , SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s, 
        Payment_Method_ID__c, Status, Reference_Number__c, SBQQ__Quote__r.Recurring_Subtotal__c, AutoPay__c, Shipping_Address__r.Name,
        USS_Order__c`)
        .where({
          status: { $in: statusArr },
          AccountId: { $in: accountIds },
          'Opportunity.USF_Project__c': projectId,
          CreatedDate: { $gte: jsforce.Date.LAST_N_DAYS(7) },
        })
        .execute({ autoFetch: true, maxFetch: 100000 });
    }

    const contractsResult: Contract[] = orderObjectResult.concat(contracts);
    contractsResult.forEach((contract: Contract) => {
      const mapcaseTypesCount = caseOrderRelation.filter(
        (cr: Case_Order_Relationship__c) => cr.USS_Order__c === contract.Id,
      );
      contract.Case_Order_Relationship__c = mapcaseTypesCount;
    });
    return contractsResult;
  }

  async getActiveOrderCount(accountIds: string[]): Promise<number> {
    const query = `SELECT count(Id) FROM Contract WHERE status IN ('Activated','Suspended','Draft') AND AccountId IN ('${accountIds.join(
      "','",
    )}')`;
    const activeOrderedResp = await this.sfdcBaseService.getQuery(query);
    return activeOrderedResp.records?.[0]?.expr0 ?? 0;
  }

  async fetchContractIds(accountIds: string[]): Promise<string[]> {
    const soql = `SELECT Id, AccountId FROM Contract where AccountId IN ('${accountIds.join("','")}')`;
    const quoteIdsResp = (await this.sfdcBaseService.getQuery(soql)).records.map((contract) => contract.Id);
    return quoteIdsResp;
  }

  async fetchNotification(userId: string) {
    const query = `SELECT Id, Product_Information__c, WorkType.Name, Status, Contract__r.Reference_Number__c, StartDate, Schedule_Start__c, Site_Address__r.USF_Street__c, Site_Address__r.USF_City__c, Site_Address__r.USF_State__c, Site_Address__r.USF_Zip_Code__c, Site_Address__r.Address_Latitude_Longitude__c
      FROM WorkOrder
      WHERE AccountId IN ('${userId}')
      AND (Status NOT IN ('Canceled', 'Completed') ) AND StartDate >= TODAY AND StartDate <= NEXT_N_DAYS:90`;
    const notificationResp = await this.sfdcBaseService.getQuery(query);
    return notificationResp;
  }

  //Asset Locations soql
  getAssetLocationsSoql(contractId: string): string {
    const soql = `select Id,Name,NF_Placed_Jobsite__r.NF_Parent_USF_Address__r.Site_Name__c,NF_Asset_Serial_Number__c, NF_Placed_Jobsite__r.NF_Site_Name_Address__c,NF_Subscription_Product__r.Id,NF_Subscription_Product__r.Name,NF_Subscription_Product__r.Description, NF_Service_Product__r.Number_of_Services__c,NF_Service_Subscription__r.Price_Override__c,NF_Service_Product__r.Id, NF_Service_Product__r.Name,NF_Service_Product__r.Description, NF_Quantity__c, NF_Start_Date__c, NF_End_Date__c, NF_Placed_Jobsite__r.NF_Placement__c,NF_Placed_Jobsite__r.Id,NF_Service_Subscription__r.SBQQ__QuoteLine__r.IS2PContractedPrice__c from NF_Asset_Location__c  where NF_USS_Order__r.id = '${contractId}' and NF_Status__c = 'Active'`;
    return soql;
  }

  // get asset locations by contract id
  async getAssetLocations(contractId: string): Promise<AssetLocations[]> {
    try {
      const soql = this.getAssetLocationsSoql(contractId);
      const resp = await this.sfdcBaseService.getQuery(soql);
      return resp?.records?.map((assetLocation: NF_Asset_Location__c) => {
        assetLocation.NF_Start_Date__c = assetLocation.NF_Start_Date__c ? new Date(assetLocation.NF_Start_Date__c) : assetLocation.NF_Start_Date__c;
        assetLocation.NF_End_Date__c = assetLocation.NF_End_Date__c ? new Date(assetLocation.NF_End_Date__c) : assetLocation.NF_End_Date__c;
        return SFDC_AssetLocation.getMyUSSAssetLocationFromSFDCAssetLocation(assetLocation);
      }) || [];
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async cancelContract(
    cancelContractReqDto: CancelContractReqDto,
    auth0Id: string,
    accountId: string,
  ): Promise<boolean> {
    this.logger.info('cancelContract', cancelContractReqDto);
    if (cancelContractReqDto.id) {
      const ussOrders = await this.sfdcBaseService.getSObjectById('Contract', cancelContractReqDto.id);
      if (ussOrders.Status === 'Draft') {
        const flsOrders = await this.sfdcBaseService.getSObjectRecordsByField(
          'Order',
          'USS_Order__c',
          cancelContractReqDto.id,
        );
        const quoteId = flsOrders[0].SBQQ__Quote__c;
        this.trackUserActionService.setPortalActions(
          accountId,
          auth0Id,
          ORDER_DETAILS_SCREEN,
          CANCELED_ORDER,
          quoteId,
          cancelContractReqDto.id,
        );

        const endpoint = `/services/data/v${API_VERSION}/actions/custom/flow/MYUSS_Cancel_Order_For_Non_Delivered_Items`;
        const cancelContractRequest = { inputs: [{ recordId: quoteId }] };
        const cancelContractResponse = await this.sfdcBaseService.makeCpqAPICall(
          'POST',
          endpoint,
          cancelContractRequest,
        );
        this.logger.info('cancelContractResponse', cancelContractResponse);
        return cancelContractResponse[0]?.isSuccess ?? false;
      } else {
        const endpoint = `/services/apexrest/changeDateForActivatedContractsAPI/changeEndDate`;
        const cancelContractRequest = {
          contractId: cancelContractReqDto.id,
          endDate: cancelContractReqDto.endDate,
          isChanged: true,
          PickupReasonCode: cancelContractReqDto.pickupReasonCode,
          RequestType: 'None',
          Notes: cancelContractReqDto.note,
        };
        this.trackUserActionService.setPortalActions(
          accountId,
          auth0Id,
          ORDER_DETAILS_SCREEN,
          CHANGE_ORDER_END_DATE,
          '',
          cancelContractReqDto.id,
        );

        const cancelContractResponse = await this.sfdcBaseService.makeCpqAPICall(
          'POST',
          endpoint,
          cancelContractRequest,
        );
        this.logger.info('cancelContractResponse', cancelContractResponse);
        return cancelContractResponse[0]?.isSuccess ?? false;
      }
    }
    return false;
  }

  async confirmEasyPay(
    confirmEasyPayReqDto: ConfirmEasyPayReqDto,
    auth0Id: string,
    accountId: string,
  ): Promise<boolean> {
    const quoteRecordsToUpdate: SBQQ__Quote__c[] = [];
    const contractRecordsToUpdate: Contract[] = [];
    const fslOrderRecordsToUpdate: Contract[] = [];

    const quoteFromContractIds = await this.sfdcBaseService.getSObjectByIds(
      'Contract',
      confirmEasyPayReqDto.contractIds,
    );

    if (quoteFromContractIds.length) {
      quoteFromContractIds.forEach((quoteFromContractId: Contract) => {
        this.trackUserActionService.setPortalActions(
          accountId,
          auth0Id,
          EASY_PAY_SCREEN,
          UPDATED_EASY_PAY,
          quoteFromContractId.SBQQ__Quote__c,
          quoteFromContractId.Id,
        );

        quoteRecordsToUpdate.push({
          Id: quoteFromContractId.SBQQ__Quote__c,
          Payment_Method_Id__c: confirmEasyPayReqDto.paymentMethodId,
          AutoPay__c: true,
        });

        contractRecordsToUpdate.push({
          Id: quoteFromContractId.Id,
          Payment_Method_ID__c: confirmEasyPayReqDto.paymentMethodId,
          AutoPay__c: true,
        });

        fslOrderRecordsToUpdate.push({
          Id: quoteFromContractId.SBQQ__Order__c,
          Payment_Method_ID__c: confirmEasyPayReqDto.paymentMethodId,
          AutoPay__c: true,
        });
      });

      const promises = [
        this.sfdcBaseService.updateSObjectByIds('SBQQ__Quote__c', quoteRecordsToUpdate),
        this.sfdcBaseService.updateSObjectByIds('Contract', contractRecordsToUpdate),
        this.sfdcBaseService.updateSObjectByIds('Order', fslOrderRecordsToUpdate),
      ];

      return Promise.all(promises)
        .then((results) => results.every(result => !result.every(response => response.success === false)))
        .catch(() => false);
    } 
    return false;
  }

  async editQuantiy(editQuantityReqDto: EditQuantityReqDto, auth0Id: string, accountId: string): Promise<boolean> {
    const endpoint = `/services/apexrest/changeQuantityApi/changeQty`;
    const editQuantityArray = editQuantityReqDto.quantityChange.map((editQuantityObj: ChangeQuantityReqDto) => new ChangeQuantityOrderModel(editQuantityObj));

    const editQuantityRequest = { QtyChange: editQuantityArray };

    this.trackUserActionService.setPortalActions(
      accountId,
      auth0Id,
      ORDER_DETAILS_SCREEN,
      CHANGE_QUANTITY,
      '',
      editQuantityReqDto.quantityChange[0].orderId,
    );

    const editQuantityResponse = await this.sfdcBaseService.makeCpqAPICall('POST', endpoint, editQuantityRequest);
    this.logger.info('editQuantityResponse', editQuantityResponse);
    return editQuantityResponse[0]?.isSuccess ?? false;
  }

  getCompletedServiceForAssetSoql(assetId: string, accounId: string) {
    return `SELECT Id,WorkOrder.Id, WorkOrder.Actual_Start__c,WorkOrder.Actual_End__c, WorkOrder.Type__c, WorkOrder.Status, WorkOrder.Schedule_Start__c, WorkOrder.Scheduled_End__c,WorkOrder.WorkType.Name, WorkOrder.StartDate, WorkOrder.EndDate 
    FROM WorkOrderLineItem WHERE AssetId = '${assetId}' AND WorkOrder.AccountId = '${accounId}' and ( (WorkOrder.Actual_End__c >= LAST_90_DAYS) OR (EndDate >= LAST_90_DAYS) OR (WorkOrder.Scheduled_End__c >= LAST_90_DAYS))`;
  }

  async getCompletedServiceForAsset(assetId: string, accounId: string) {
    try {
      const soql = this.getCompletedServiceForAssetSoql(assetId, accounId);
      const resp = await this.sfdcBaseService.getQuery(soql);
      return resp?.records?.map((record) => {
        return SFDC_ContractMapper.getWorkOrderFromSFDCWorkOrder(record.WorkOrder);
      }) || [];
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  getUpcomingServiceForAssetSoql(subscriptionId: string, addressId: string, accounId: string) {
    return `SELECT Id,WorkOrderNumber, Contract__c, Contract__r.Global_Order_Number__c, Status, StartDate, EndDate,WorkType.name,Schedule_Start__c, Scheduled_End__c, Actual_Start__c,Actual_End__c
    FROM WorkOrder WHERE  Site_Address__c = '${addressId}' AND AccountId = '${accounId}'  and status='New'   
    and id in ( SELECT WorkOrderId FROM WorkOrderLineItem where Subscription__r.SBQQ__RootId__c = '${subscriptionId}')
    and ((WorkOrder.Actual_End__c >= TODAY
      AND WorkOrder.Actual_End__c <= NEXT_90_DAYS) OR (EndDate >= TODAY AND EndDate <= NEXT_90_DAYS) OR (WorkOrder.Scheduled_End__c >= TODAY AND WorkOrder.Scheduled_End__c <= NEXT_90_DAYS))
      ORDER BY StartDate ASC`;
  }

  async getUpcomingServiceForAsset(subscriptionId: string, addressId: string, accounId: string) {
    try {
      const soql = this.getUpcomingServiceForAssetSoql(subscriptionId, addressId, accounId);
      const resp = await this.sfdcBaseService.getQuery(soql);
      return resp?.records?.map((workOrder: WorkOrder) => {
        return SFDC_ContractMapper.getWorkOrderFromSFDCWorkOrder(workOrder);
      }) || [];
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  getAdditionalServicesForAssetSoql(subscriptionId: string) {
    return `select id, SBQQ__Product__r.Name from SBQQ__Subscription__c where SBQQ__RootId__c = '${subscriptionId}'  and (Product_Type__c  = 'Ancillary Services' OR Product_Type__c = 'Ancillary Asset')`;
  }

  async getAdditionalServicesForAsset(subscriptionId: string) {
    try {
      const soql = this.getAdditionalServicesForAssetSoql(subscriptionId);
      const resp = await this.sfdcBaseService.getQuery(soql);
      return resp?.records?.map((record: SBQQ__Subscription__c) => ({
        id: record.Id,
        ancillaryServiceName: record.SBQQ__Product__r.Name,
      })) || [];
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  getSearchByUnitNumberSoql(unitNumber: string, accountId: string): string {
    return `SELECT Id, NF_Asset__c, NF_USS_Order__r.StartDate, NF_USS_Order__r.EndDate, NF_USS_Order__r.AccountId, NF_USS_Order__r.Global_Order_Number__c,
    NF_USS_Order__r.Status, NF_USS_Order__r.Ship_To__c, NF_USS_Order__r.Id,NF_Placed_Jobsite__r.Name, NF_Placed_Jobsite__r.NF_Placement__c,
    NF_Placed_Jobsite__r.Id, NF_Asset_Serial_Number__c, NF_Bundle_Subscription_Original__r.SBQQ__Product__r.Name,NF_Subscription_Product__r.Description, NF_Service_Product__r.Name, NF_Bundle_Subscription_Original__r.Id,
     NF_Service_Product__r.Number_of_Services__c,NF_Service_Subscription__r.Price_Override__c
    FROM NF_Asset_Location__c WHERE NF_Asset_Serial_Number__c = '${unitNumber}' AND NF_USS_Order__r.Account.Id = '${accountId}' and NF_Status__c = 'Active'`;
  }

  async searchByUnitNumber(unitNumber: string, accountId: string) {
    try {
      const soql = this.getSearchByUnitNumberSoql(unitNumber, accountId);
      const resp = await this.sfdcBaseService.getQuery(soql);
      return resp?.records?.length ? SFDC_AssetLocation.getMyUSSAssetLocationBySerialNumberFromSFDCAssetLocation(resp.records[0]) : null;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async getContractIdByName(contractName: string): Promise<Contract> {
    const contractIdResp = await this.sfdcBaseService.conn
      .sobject('Contract')
      .find({ Reference_Number__c: contractName });

    const contract = new Contract();
    if (contractIdResp.length) {
      contract.Id = contractIdResp[0].Id;
      contract.Ship_To__c = contractIdResp[0].Ship_To__c;
    }
    return contract;
  }
}