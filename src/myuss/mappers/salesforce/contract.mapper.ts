import { AssetLocations } from '../../../myuss/models/asset-location.model';
import { Contract } from '../../../backend/sfdc/model/Contract';
import { Manual_Payment_Message } from '../../services/quote/constants';

import { WorkOrder as SFDC_WorkOrder, WorkOrder } from '../../../backend/sfdc/model/WorkOrder';
import {
  AncillaryService,
  Asset,
  BankDetails,
  BillingDetail,
  Card,
  ContractModel,
  GetPaymentMethodsResObj,
  GetWorkOrder,
  PAndD,
  PlacementNotes,
  QuoteSummary,
  Service,
  SiteDetail,
  WorkOrders,
} from '../../models/contract.model';
import { SBQQ__QuoteLine__c } from '../../../backend/sfdc/model/SBQQ__QuoteLine__c';
import { SBQQ__Subscription__c } from '../../../backend/sfdc/model/SBQQ__Subscription__c';
import { SFDC_ProjectMapper } from './project.mapper';
import { QuoteModel } from 'src/myuss/models';
import { JobSite } from 'src/uss-web/models/order-info.model';

export class SFDC_ContractMapper {
  static getStartDateForWorkOrder(workOrder: SFDC_WorkOrder): Date {
    // assign the dates progressively if they are populated
    // if the actual start is populated, use that, otherwise scheduled, otherwise start
    let startDate = null;
    startDate = workOrder.StartDate ? workOrder.StartDate : startDate;
    startDate = workOrder.Schedule_Start__c ? workOrder.Schedule_Start__c : startDate;
    startDate = workOrder.Actual_Start__c ? workOrder.Actual_Start__c : startDate;
    return startDate;
  }

  static getEndDateForWorkOrder(workOrder: SFDC_WorkOrder): Date {
    // assign the dates progressively if they are populated
    // if the actual end is populated, use that, otherwise scheduled, otherwise end
    let endDate = null;
    endDate = workOrder.EndDate ? workOrder.EndDate : endDate;
    endDate = workOrder.Scheduled_End__c ? workOrder.Scheduled_End__c : endDate;
    endDate = workOrder.Actual_End__c ? workOrder.Actual_End__c : endDate;
    return endDate;
  }

  static getStatusForWorkOrder(workOrder: SFDC_WorkOrder): string {
    // there should always be one SA
    if (
      workOrder.Service_Appointments__r &&
      workOrder.Service_Appointments__r['records'] &&
      workOrder.Service_Appointments__r['records'].length > 0
    ) {
      const serviceAppointment = workOrder.Service_Appointments__r['records'][0];
      // if the Work Order is marked to be canceled, return canceled
      if (workOrder.Cancel__c == true) {
        return 'Canceled';
      } else {
        return workOrder.Status;
      }
    }
    // fallback to work order status
    return workOrder.Status;
  }

  static getContracts(contract: Contract,paymentMethodsOfCustomer:Object): ContractModel {
      let contractModel = new ContractModel();
      contractModel.quoteId =  contract.SBQQ__Quote__r ? contract.SBQQ__Quote__r.Id : '';
      contractModel.contractId =contract?.ContractNumber ? contract.Id:"";
      contractModel.name = 'O-' + contract.Reference_Number__c;
      contractModel.lastModifiedDate = contract.LastModifiedDate;
      contractModel.startDate = contract.StartDate;
      contractModel.endDate = contract.EndDate;
      contractModel.orderType = contract.Order_Type__c;
      contractModel.shippingAddress = contract.Ship_To__c||contract?.Shipping_Address__r?.Name;
      contractModel.zipcode = contract.Ship_To_Zip_Code__c;
      contractModel.billAddress = {
          lat: contract.Bill_To_Address__r ? contract.Bill_To_Address__r.Address_Latitude_Longitude__Latitude__s : 0,
          lng: contract.Bill_To_Address__r ? contract.Bill_To_Address__r.Address_Latitude_Longitude__Longitude__s : 0,
        };
      contractModel.shippingAddressLat = contract.SBQQ__Quote__r
          ? contract.SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Latitude__s
          : 0;
      contractModel.shippingAddressLng = contract.SBQQ__Quote__r
          ? contract.SBQQ__Quote__r.Shipping_Address__r.Address_Latitude_Longitude__Longitude__s
          : 0;
      contractModel.paymentMethodId = contract.Payment_Method_ID__c;
      contractModel.recurringSubtotal = contract.SBQQ__Quote__r ? contract.SBQQ__Quote__r.Recurring_Subtotal__c : 0;
      contractModel.nextInvoiceDate = contract.billingEffectiveDateCombined__c;
      contractModel.isAutoPay = contract.AutoPay__c; 
      contractModel.projectDetails = contract.SBQQ__Quote__r?.SBQQ__Opportunity2__r?.USF_Project__r ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(contract.SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r, [] , contract.AccountId) : null;
      if (contractModel.paymentMethodId !== null) {
        let paymentMethodResp: GetPaymentMethodsResObj = paymentMethodsOfCustomer['data'].find(
          (paymentObj) => paymentObj.paymentMethodId == contractModel.paymentMethodId,
        );
        if (paymentMethodResp?.paymentMethodId) {
          contractModel.easyPayDetails = paymentMethodResp.card ? paymentMethodResp.card : paymentMethodResp.bank,
          contractModel.easyPayMode = paymentMethodResp.card ? 'card' : 'bank'
        } else {
          contractModel.easyPayDetails = new BankDetails(),
          contractModel.easyPayMode = ''
        }
      } else {
        (contractModel.easyPayDetails = new BankDetails()), (contractModel.easyPayMode = '');
      }
      if(contract.Status === 'Draft'){
        contractModel.status = 'Pending Delivery';
      }else{
        contractModel.status = contract.Status;
      }
      contractModel.contractNumber= contract?.ContractNumber ||"";
      contractModel.casesCount = contract.CaseOrderRelationships__r ? contract.CaseOrderRelationships__r.totalSize : 0;
      contractModel.caseTypeWiseCasesCount = contract.Case_Order_Relationship__c ? contract.Case_Order_Relationship__c : null;
     
      return contractModel;
  }

  //card mapper
  static getCardDetails(data: Object, isExpired?: boolean): Card {
    return {
      cardBrand: data['card']['brand'],
      cardNo: data['card']['last4'],
      cardExpMonth: data['card']['exp_month'],
      cardExpYear: data['card']['exp_year'],
      cardCvc: data['card']['cvc'],
      country: data['billing_details']['address']['country'],
      displayBrand: data['card']['display_brand'],
      expired: isExpired,
    };
  }
  //bank mapper
  static getBankDetails(data: Object): BankDetails {
    return {
      accountHolderType: data['us_bank_account']['account_holder_type']
        ? data['us_bank_account']['account_holder_type']
        : '',
      accountType: data['us_bank_account']['account_type'],
      bankName: data['us_bank_account']['bank_name'],
      cardNo: data['us_bank_account']['last4'],
      email: data['billing_details']['email'],
    };
  }

  static getWorkOrderFromSFDCWorkOrder(sfdcWorkOrder: SFDC_WorkOrder) {
    const workOrder = new GetWorkOrder();
    workOrder.id = sfdcWorkOrder.Id;
    workOrder.type = sfdcWorkOrder.WorkType.Name;
    workOrder.status = sfdcWorkOrder.Status;
    workOrder.startDate = this.getStartDateForWorkOrder(sfdcWorkOrder);
    workOrder.endDate = this.getEndDateForWorkOrder(sfdcWorkOrder);
    return workOrder;
  }

  static async getContractsDetailsMapper(
    contract: Contract,
    assetLocations: AssetLocations[],
    paymentDetailResponse,
    quoteModelResponse,
  ): Promise<ContractModel> {
    let contractObj = new ContractModel();
    let workOrderArr = [];
    // if the work orders are stored in the records array, then assign the records array to work orders
    if (contract.Work_Orders__r['records']) {
      contract.Work_Orders__r = contract.Work_Orders__r['records'];
    }
    if (contract.Work_Orders__r) {
      contract.Work_Orders__r.map((workOrder: WorkOrder) => {
        if (workOrder.Product_Information__c != null) {
          let workOrderObj = new WorkOrders();
          (workOrderObj.type = workOrder.WorkType.Name),
            (workOrderObj.status = SFDC_ContractMapper.getStatusForWorkOrder(workOrder)),
            (workOrderObj.startDate = SFDC_ContractMapper.getStartDateForWorkOrder(workOrder)),
            (workOrderObj.endDate = SFDC_ContractMapper.getEndDateForWorkOrder(workOrder)),
            (workOrderObj.id = workOrder.Id),
            (workOrderObj.productInfo = workOrder.Product_Information__c),
            (workOrderObj.originalStatus = workOrder.NF_Origin__c);

          workOrderArr.push(workOrderObj);
        }
      });
    }

    let quoteSummaryArr = [];
    if (contract.SBQQ__Subscriptions__r != null) {
      let quoteSummary = contract.SBQQ__Subscriptions__r['records'].reduce(function (
        r: SBQQ__Subscription__c,
        a: SBQQ__Subscription__c,
      ) {
        r[a.SBQQ__RequiredById__c || 'bundles'] = r[a.SBQQ__RequiredById__c || 'bundles'] || [];
        r[a.SBQQ__RequiredById__c || 'bundles'].push(a);
        return r;
      },
      Object.create(null));

      let bundleArr = quoteSummary.bundles.filter((a: SBQQ__QuoteLine__c) => a.Product_Type__c == 'Bundle');
      bundleArr.map((bundle: SBQQ__QuoteLine__c) => {
        let assets = quoteSummary[bundle.Id].filter((a: SBQQ__QuoteLine__c) => a.Product_Type__c == 'Asset');
        let assetArr = [];

        assets.map((asset: SBQQ__QuoteLine__c) => {
          let assetObj = new Asset();
          assetObj.assetId = asset.Id;
          assetObj.assetOptionalId = asset.SBQQ__Product__c;
          assetObj.assetQty = asset.SBQQ__Quantity__c;
          assetObj.assetName = asset.SBQQ__Product__r.Description;

          assetArr.push(assetObj);
        });
        let ancillaryServices = quoteSummary[bundle.Id].filter(
          (a: SBQQ__QuoteLine__c) =>
            a.Product_Type__c == 'Ancillary Services' || a.Product_Type__c == 'Ancillary Asset',
        );
        let ancillaryServicesArr = [];

        ancillaryServices.map((ancillaryService: SBQQ__QuoteLine__c) => {
          let ancillaryServiceObj = new AncillaryService();
          ancillaryServiceObj.ancillaryServiceId = ancillaryService.Id;
          ancillaryServiceObj.ancillaryServiceOptionalId = ancillaryService.SBQQ__Product__c;
          ancillaryServiceObj.ancillaryServiceQty = ancillaryService.SBQQ__Quantity__c;
          ancillaryServiceObj.ancillaryServiceName = ancillaryService.SBQQ__Product__r.Description;

          ancillaryServicesArr.push(ancillaryServiceObj);
        });
        let services = quoteSummary[bundle.Id].filter((a: SBQQ__QuoteLine__c) => a.Product_Type__c == 'Service');
        let servicesArr = [];

        services.map((service: SBQQ__QuoteLine__c) => {
          let serviceObj = new Service();
          serviceObj.serviceId = service.Id;
          serviceObj.serviceOptionalId = service.SBQQ__Product__c;
          serviceObj.serviceQty = service.SBQQ__Quantity__c;
          serviceObj.serviceName = service.SBQQ__Product__r.Description;
          serviceObj.numberOfServices = service.SBQQ__Product__r.Number_of_Services__c;
          serviceObj.servicePrice = service.Price_Override__c;
          servicesArr.push(serviceObj);
        });
        let pAndDs = quoteSummary[bundle.Id].filter((a: SBQQ__QuoteLine__c) => a.Product_Type__c == 'P n D');
        let pAndDsArr = [];

        pAndDs.map((aAndD: SBQQ__QuoteLine__c) => {
          let pAndDObj = new PAndD();
          pAndDObj.aAndDId = aAndD.Id;
          pAndDObj.aAndDOptionalId = aAndD.SBQQ__Product__c;
          pAndDObj.aAndDQty = aAndD.SBQQ__Quantity__c;
          pAndDObj.aAndDName = aAndD.SBQQ__Product__r.Description;

          pAndDsArr.push(pAndDObj);
        });

        let quoteSummaryObj = new QuoteSummary();
        quoteSummaryObj.bundleId = bundle.Id;
        quoteSummaryObj.bundleOptionalId = bundle.SBQQ__Product__c;
        quoteSummaryObj.bundleQty = bundle.SBQQ__Quantity__c;
        quoteSummaryObj.bundleName = bundle.SBQQ__Product__r.Name;
        quoteSummaryObj.asset = assetArr;
        quoteSummaryObj.service = servicesArr;
        quoteSummaryObj.ancillaryServices = ancillaryServicesArr;
        quoteSummaryObj.pAndD = pAndDsArr;

        quoteSummaryArr.push(quoteSummaryObj);
      });
    }

    let mergedAssetLocations = await this.groupByAssetLocation(assetLocations, 'jobsiteId');
    const mergedAssetLocationsKeys = Object.keys(mergedAssetLocations);
    let productDetailsArr = [];
    const hasQuantityChangeResult = workOrderArr.some((order) => order.originalStatus === 'Quantity Change');

    mergedAssetLocationsKeys.map(async (mergedAssetLocationsKey) => {
      const assetLocationsArr = mergedAssetLocations[mergedAssetLocationsKey];
      const mergeSameAsset = await this.mergeDataWithAssetId(assetLocationsArr, quoteSummaryArr);
      const resultArray: AssetLocations[] = [];
      for (const mergeSameAssetKeys in mergeSameAsset) {
        if (Object.prototype.hasOwnProperty.call(mergeSameAsset, mergeSameAssetKeys)) {
          const mergeSameAssetObj = mergeSameAsset[mergeSameAssetKeys];
          resultArray.push(...mergeSameAssetObj);
        }
      }
      const productDetailsObj = {
        addressId: mergedAssetLocations[mergedAssetLocationsKey][0]['jobsiteId'],
        placementNotes: mergedAssetLocations[mergedAssetLocationsKey][0]['placementNote'],
        siteName: mergedAssetLocations[mergedAssetLocationsKey][0]['siteAddress'],
        bundles: resultArray,
        isEdited: hasQuantityChangeResult,
      };
      productDetailsArr.push(productDetailsObj);
    });
    if (quoteModelResponse) {
      quoteModelResponse.jobSites.filter((site) => {
        quoteModelResponse.quoteLines.some((quoteLine) => {
          if (site.quoteLineId == quoteLine.quoteLineId) {
            let bundleId = quoteLine.product.id;
            let productArr = quoteModelResponse.quoteLines.filter((line) => line.requiredBy == quoteLine.quoteLineId);
            let serviceDetails = productArr.filter((line) => line.productType == 'Service');
            let assetDetails = productArr.filter((line) => line.productType == 'Asset');
            let ancillaryServiceDetails = productArr.filter(
              (line) => line.productType == 'Ancillary Services' || line.productType == 'Ancillary Asset',
            );
            let filteresAsset = assetLocations.find(
              (assetLocation) =>
                assetLocation.jobsiteId == site.address.id && assetLocation.assetId == assetDetails[0].product.id,
            );
           
            site.productDetails = {
              bundleId: bundleId,
              assetId: assetDetails[0].product.id,
              serviceId: serviceDetails[0].product.id,
              bundleName: quoteLine.product.description,
              assetName: assetDetails[0].product.description,
              serviceName: serviceDetails[0].product.description,
              ancillaryServiceList: ancillaryServiceDetails.map((ancillaryService) => {
                return {
                  ancillaryServiceId: ancillaryService.product.id,
                  ancillaryServiceName: ancillaryService.product.description,
                };
              }),

              quantity: quoteLine.quantity,
              subscriptionProductId: filteresAsset && filteresAsset.subscriptionProductId ? filteresAsset.subscriptionProductId : '',
              serviceProductId: filteresAsset && filteresAsset.serviceProductId ? filteresAsset.serviceProductId : '',
              serviceSubscriptionId: filteresAsset && filteresAsset.serviceSubscriptionId ? filteresAsset.serviceSubscriptionId : '',
              servicePrice: filteresAsset && filteresAsset.servicePrice ? filteresAsset.servicePrice : '',
              unitNumber: filteresAsset && filteresAsset.unitNumber ? filteresAsset.unitNumber : '',
            };
            site.contact = site.address.shipToContact;
            site.isEdited = hasQuantityChangeResult;
          }
        });
      });
    }

    contractObj.contractId = contract.Id;
    contractObj.status = contract.Status == 'Draft' ? 'Pending Delivery' : contract.Status;
    contractObj.quoteName = 'O-' + contract.Reference_Number__c;
    contractObj.quoteId = contract.SBQQ__Quote__r.Id;
    contractObj.startDate = contract.StartDate;
    contractObj.endDate = contract.EndDate;
    contractObj.contractDocumnetId = contract.contractDocumnetId;
    contractObj.contractDocumentName = contract.contractDocumentName;
    contractObj.quoteSummary = quoteSummaryArr;
    contractObj.quoteModel = quoteModelResponse;
    const siteDetails = new SiteDetail();
    siteDetails.firstName = contract.SBQQ__Quote__r?.SBQQ__PrimaryContact__r?.FirstName;
    siteDetails.lastName = contract.SBQQ__Quote__r?.SBQQ__PrimaryContact__r?.LastName;
    siteDetails.email = contract.SBQQ__Quote__r?.SBQQ__PrimaryContact__r?.Email;
    siteDetails.phone = contract.SBQQ__Quote__r?.SBQQ__PrimaryContact__r?.Phone;
    siteDetails.address = contract.Ship_To__c;
    siteDetails.state = contract.Ship_To_State__c;
    siteDetails.street = contract.Ship_To_Street__c;
    siteDetails.zipcode = contract.Ship_To_Zip_Code__c;
    siteDetails.city = contract.Ship_To_City__c;
    siteDetails.latitude = contract.SBQQ__Quote__r?.Shipping_Address__r?.Address_Latitude_Longitude__Latitude__s;
    siteDetails.longitude = contract.SBQQ__Quote__r?.Shipping_Address__r?.Address_Latitude_Longitude__Longitude__s;
    siteDetails.siteStartTime = contract.SBQQ__Quote__r.Shipping_Address__r.NF_Site_Hours_Start_Time__c;
    siteDetails.siteEndTime = contract.SBQQ__Quote__r.Shipping_Address__r.NF_Site_Hours_End_Time__c;

    const placementNotes = new PlacementNotes();
    placementNotes.siteInstruction = contract.SBQQ__Quote__r.Shipping_Address__r.Additional_Information__c;
    placementNotes.placementInstruction = contract.SBQQ__Quote__r.Shipping_Address__r.NF_Placement__c;
    siteDetails.placementNotes = placementNotes;
    contractObj.siteDetails = siteDetails;

    const billingDetails = new BillingDetail();
    billingDetails.firstName = contract.Bill_To_Contact_Name__c;
    billingDetails.lastName = '';
    const secondaryBillingContact = new BillingDetail();
    secondaryBillingContact.firstName = contract.SBQQ__Quote__r?.SecondaryBillToContact__r?.FirstName;
    secondaryBillingContact.lastName = contract.SBQQ__Quote__r?.SecondaryBillToContact__r?.LastName;
    secondaryBillingContact.email = contract.SBQQ__Quote__r?.SecondaryBillToContact__r?.Email;
    secondaryBillingContact.phone = contract.SBQQ__Quote__r?.SecondaryBillToContact__r?.Phone;
    billingDetails.secondaryBillingContact = secondaryBillingContact;
    billingDetails.phone = '';
    billingDetails.cardDetails = paymentDetailResponse.data.cardDetails ? paymentDetailResponse.data.cardDetails : {};
    billingDetails.bankDetails = paymentDetailResponse.data.bankDetails ? paymentDetailResponse.data.bankDetails : {};
    billingDetails.manualPaymentDetails = Manual_Payment_Message;
    contractObj.billingDetails = billingDetails;

    contractObj.workOrder = workOrderArr;
    contractObj.assetLocations = assetLocations;
    contractObj.productDetails = productDetailsArr;
    contractObj.projectDetails = contract.SBQQ__Quote__r?.SBQQ__Opportunity2__r?.USF_Project__r
      ? SFDC_ProjectMapper.getMyUSSProjectFromSFDCProject(
          contract.SBQQ__Quote__r.SBQQ__Opportunity2__r.USF_Project__r,
          [],
          contract.AccountId,
        )
      : null;
    return contractObj;
  }

  private static groupByAssetLocation(assetLocation: AssetLocations[], objectKey1: string) {
    const groupedDataByAssetLocation = assetLocation.reduce((acc, assetLocation) => {
      const key1 = assetLocation[objectKey1] || '-';
      acc[key1] = acc[key1] || [];
      // Group by key2 within each key2 group
      acc[key1].push(assetLocation);
      return acc;
    }, {});
    return groupedDataByAssetLocation;
  }

  private static mergeDataWithAssetId(assetLocationsArr: AssetLocations[], quoteSummaryArr) {
    // console.log("quoteSummaryArr--"+JSON.stringify(quoteSummaryArr));
    const groupedDataWithSameAssetId = {};

    assetLocationsArr.forEach((assetLocation) => {
      const subscriptionId = assetLocation.subscriptionProductId;
      const assetName = assetLocation.assetName;
      const quantity = assetLocation.quantity;

      if (!(subscriptionId in groupedDataWithSameAssetId)) {
        groupedDataWithSameAssetId[subscriptionId] = [];
      }

      // Check if an item with the same assetName already exists
      const existingItem = groupedDataWithSameAssetId[subscriptionId].find(
        (element: AssetLocations) => element.assetName === assetName,
      );
      if (existingItem) {
        // If the item exists, add the quantity to the existing quantity
        existingItem.quantity += quantity;
      } else {
        // If the item doesn't exist, add it to the array with the aggregated quantity
        const assetMatchWithQuntity = quoteSummaryArr.find((quoteSummary) =>
          quoteSummary.asset.some((asset) => asset.assetOptionalId === assetLocation.subscriptionProductId),
        );
        const { bundleId, bundleName, ancillaryServices, service } = assetMatchWithQuntity;
        assetLocation.bundleId = bundleId || null;
        assetLocation.bundleName = bundleName || null;
        assetLocation.ancillaryServiceList = ancillaryServices || null;
        assetLocation.serviceSubscriptionId = service[0].serviceId;

        groupedDataWithSameAssetId[subscriptionId].push({ ...assetLocation });
      }
    });
    return groupedDataWithSameAssetId;
  }
}
