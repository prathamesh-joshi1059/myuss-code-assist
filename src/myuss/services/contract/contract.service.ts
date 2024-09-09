import { Injectable } from '@nestjs/common';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { PaymentMethodsService } from '../payment/payment-methods.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { AssetLocations } from '../../../myuss/models/asset-location.model';
import {
  CancelContractReqDto,
  ConfirmEasyPayReqDto,
  EditQuantityReqDto,
} from '../../../myuss/controllers/contract/dto/contract-req.dto';
import { SFDC_ContractMapper } from '../../mappers/salesforce/contract.mapper';
import { ContractModel, SearchByUnitNumber } from '../../models/contract.model';
import { TrackUserActionService } from '../../../core/track-user-action/track-user-action-service';
import { DateUtils } from '../../../core/utils/date-utils';
import { USS_CUSTOMERCARE_MESSAGE } from '../../../core/utils/constants';
import { Contract } from '../../../backend/sfdc/model/Contract';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { QuoteModel } from '../../../myuss/models';
import { SFDC_QuoteMapper } from '../../../myuss/mappers/salesforce/quote.mapper';
import { QuoteService } from '../quote/quote.service';
import { CPQ_QuoteModel } from '../../../backend/sfdc/model/cpq/QuoteModel';

@Injectable()
export class ContractService {
  constructor(
    private sfdcContractService: SfdcContractService,
    private logger: LoggerService,
    private paymentMethodsService: PaymentMethodsService,
    private trackUserActionService: TrackUserActionService,
    private sfdcQuoteService: SfdcQuoteService,
    private readonly quoteService: QuoteService,
  ) {}

  async fetchContracts(
    accountIds: string[],
    statusArr: string[],
    accountNumber: string,
    projectId: string,
  ): Promise<ApiRespDTO<object>> {
    const contractsRespObj = new ApiRespDTO<object>();
    try {
      const contractsResp = await this.sfdcContractService.fetchContracts(accountIds, statusArr, projectId);
      const stripeCustomerId = await this.paymentMethodsService.getStripeCustomer(accountNumber);
      const paymentMethodsOfCustomer = await this.paymentMethodsService.getPaymentMethods(
        stripeCustomerId?.data[0]?.id,
      );
      const contractArray = contractsResp.map((contract: Contract) => {
        if (contract.billingEffectiveDateCombined__c == null) {
          contract.billingEffectiveDateCombined__c = DateUtils.getDateInMyUssDashboardFormat(
            DateUtils.addDays(contract.StartDate, 28),
          ).split('T')[0];
        }
        return SFDC_ContractMapper.getContracts(contract, paymentMethodsOfCustomer);
      });
      const uniqueOrders = this.getUniqueContractFormOrderAndContract(contractArray);
      Object.assign(contractsRespObj, {
        success: true,
        status: 1000,
        message: 'Success',
        data: { contracts: uniqueOrders },
      });
    } catch (error) {
      this.logger.error(`catch block for fetch contracts: ${error.message}`);
      Object.assign(contractsRespObj, {
        success: false,
        status: 1029,
        message: 'Error in fetching Contracts',
        data: {},
      });
    }
    return contractsRespObj;
  }

  async getActiveOrderCount(accountIds: string[]): Promise<object> {
    return await this.sfdcContractService.getActiveOrderCount(accountIds);
  }

  async getContractDetails(accountId: string, id: string, auth0Id: string): Promise<ApiRespDTO<object>> {
    const respObj = new ApiRespDTO<object>();
    try {
      const contract: Contract = await this.sfdcContractService.getContractDetails(id);
      const assetLocations: AssetLocations[] = await this.sfdcContractService.getAssetLocations(id);
      const paymentDetailResponse = await this.paymentMethodsService.getPaymentDetails(contract.Payment_Method_ID__c);
      const quoteModel: QuoteModel = await this.quoteService.getQuoteHtmlModel(
        contract.SBQQ__Quote__r?.Id,
        new CPQ_QuoteModel(),
      );
      this.logger.log('quoteModel', JSON.stringify(quoteModel));
      const contractModel: ContractModel = await SFDC_ContractMapper.getContractsDetailsMapper(
        contract,
        assetLocations,
        paymentDetailResponse,
        quoteModel,
      );
      Object.assign(respObj, {
        success: true,
        status: 1000,
        message: 'Success',
        data: contractModel,
      });
      return respObj;
    } catch (error) {
      this.logger.error('Error in contract service ..', error);
      Object.assign(respObj, {
        success: false,
        status: 1008,
        message: USS_CUSTOMERCARE_MESSAGE,
        data: {},
      });
      if (error?.errorCode?.toUpperCase().includes('INVALID_QUERY_FILTER_OPERATOR')) {
        respObj.message = 'Invalid Request';
        respObj.status = 1020;
      }
      return respObj;
    }
  }

  async cancelContract(
    cancelContractReqDto: CancelContractReqDto,
    auth0Id: string,
    accountId: string,
  ): Promise<ApiRespDTO<object>> {
    const contractsResp = await this.sfdcContractService.cancelContract(cancelContractReqDto, auth0Id, accountId);
    return contractsResp
      ? {
          success: true,
          status: 1000,
          message: 'Success',
          data: {},
        }
      : {
          success: false,
          status: 1021,
          message: 'Fail',
          data: {},
        };
  }

  async confirmEasyPay(
    confirmEasyPayReqDto: ConfirmEasyPayReqDto,
    auth0Id: string,
    accountId: string,
  ): Promise<ApiRespDTO<object>> {
    const confirmEasyPayResp = await this.sfdcContractService.confirmEasyPay(confirmEasyPayReqDto, auth0Id, accountId);
    return confirmEasyPayResp
      ? {
          success: true,
          status: 1000,
          message: 'Success',
          data: {},
        }
      : {
          success: false,
          status: 1025,
          message: 'Fail',
          data: {},
        };
  }

  async editQuantity(
    editQuantityReqDto: EditQuantityReqDto,
    auth0Id: string,
    accountId: string,
  ): Promise<ApiRespDTO<object>> {
    const editQuantiyResp = await this.sfdcContractService.editQuantiy(editQuantityReqDto, auth0Id, accountId);
    return editQuantiyResp
      ? {
          success: true,
          status: 1000,
          message: 'Success',
          data: {},
        }
      : {
          success: false,
          status: 1025,
          message: 'Fail',
          data: {},
        };
  }

  async searchByUnitNumber(unitNumber: string, accountId: string): Promise<ApiRespDTO<object>> {
    const assetDetailsRes = await this.sfdcContractService.searchByUnitNumber(unitNumber, accountId);
    if (assetDetailsRes == null) {
      return {
        success: true,
        status: 1000,
        message: 'record not found',
        data: null,
      };
    }
    
    const searchByUnitNumberRes: SearchByUnitNumber = {
      assetDetails: assetDetailsRes,
      completedServices: [],
      upcomingServices: [],
    };

    const completedServices = await this.sfdcContractService.getCompletedServiceForAsset(
      searchByUnitNumberRes.assetDetails.assetId,
      accountId,
    );
    searchByUnitNumberRes.completedServices = completedServices;

    const upcomingServices = await this.sfdcContractService.getUpcomingServiceForAsset(
      searchByUnitNumberRes.assetDetails.subscriptionProductId,
      searchByUnitNumberRes.assetDetails.siteAddressId,
      accountId,
    );
    searchByUnitNumberRes.upcomingServices = upcomingServices;

    const additionalServices = await this.sfdcContractService.getAdditionalServicesForAsset(
      searchByUnitNumberRes.assetDetails.subscriptionProductId,
    );
    searchByUnitNumberRes.assetDetails.ancillaryServiceList = additionalServices;

    return {
      success: true,
      status: 1000,
      message: 'Success',
      data: searchByUnitNumberRes,
    };
  }

  getUniqueContractFormOrderAndContract(contract: ContractModel[]): ContractModel[] {
    const uniqueMap = new Map<string, ContractModel>();
    contract.forEach((contract: ContractModel) => {
      uniqueMap.set(contract.name, contract);
    });
    return Array.from(uniqueMap.values());
  }
}