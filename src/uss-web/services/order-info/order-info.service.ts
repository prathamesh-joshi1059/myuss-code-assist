import { Injectable } from '@nestjs/common';
import { OrderInfo } from '../../models/order-info.model';
import { SfdcContractService } from '../../../backend/sfdc/services/sfdc-contract/sfdc-contract.service';
import { SFDC_ContractMapper } from '../../mappers/salesforce/contract.mapper';

@Injectable()
export class OrderInfoService {
  constructor(private sfdcContractService: SfdcContractService) {}

  async getOrderInfoByOrderIdAndZIP(orderId: string, zipCode: string): Promise<OrderInfo | null> {
    // remove leading O- or Q- from orderId
    orderId = orderId.replace(/^[OQ]-/g, '');
    if (!orderId) {
      return null;
    }

    // ensure zipCode is 5 digits
    zipCode = zipCode.replace(/\D/g, '').substring(0, 5);
    if (zipCode.length !== 5) {
      return null;
    }

    const contract = await this.sfdcContractService.getContractByOrderIdAndZIP(orderId, zipCode);
    return contract ? SFDC_ContractMapper.mapSFDCContractToOrderInfo(contract) : null;
  }
}