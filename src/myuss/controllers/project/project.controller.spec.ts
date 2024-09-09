import { Test, TestingModule } from '@nestjs/testing';
import { QuoteService } from '../../services/quote/quote.service';
import { UserService } from '../../services/user/user.service';
import { LoggerService } from '../../../core/logger/logger.service';
jest.mock('../../../core/logger/logger.service');
import { CacheService } from '../../../core/cache/cache.service';
jest.mock('../../../core/cache/cache.service');
import { SfdcBaseService } from '../../../backend/sfdc/services/sfdc-base/sfdc-base.service';
import { SfdcRFQService } from '../../../backend/sfdc/services/sfdc-rfq/sfdc-rfq.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { HttpService } from '@nestjs/axios';
import { ProductsService } from '../../services/products/products.service';
import { SfdcServiceableZipCodeService } from '../../../backend/sfdc/services/sfdc-serviceable-zip-code/sfdc-serviceable-zip-code.service';
import { SfdcQuoteService } from '../../../backend/sfdc/services/sfdc-quote/sfdc-quote.service';
import { AddressDTO, ContactDTO } from '../../../common/dto/address.req_res_dto';
import { ProjectController } from './project.controller';

describe('ProjectController', () => {
  let controller: ProjectController;

  let mockUserService = {
    getContacts: jest.fn(),
    getAddresses: jest.fn(),
    fetchProfile: jest.fn(),
    fetchQuotes: jest.fn(),
    getProducts: jest.fn(),
  };
  let mockQuoteService = {
    createInitialQuote: jest.fn(),
    addProductAndCalculate: jest.fn(),
    createAndSaveQuoteDocument: jest.fn(),
    getQuoteDocumentBody: jest.fn(),
    getQuoteDetails: jest.fn(),
    updateQuoteStatus: jest.fn(),
    saveSiteDetails: jest.fn(),
    saveBillingDetails: jest.fn(),
    confirmQuote: jest.fn(),
    getQuote: jest.fn(),
    saveUnitServicesDraft: jest.fn(),
    updateQuoteStatusDraft: jest.fn(),
    saveSiteDetailsDraft: jest.fn(),
    getBillingDetails: jest.fn(),
    addPaymentMethod: jest.fn(),
    getQuoteStatus: jest.fn(),
    createCartLevelQuoteLines: jest.fn(),
    createShortTermQuoteLineIfNeeded: jest.fn(),
    updateSiteDetails: jest.fn(),
    addProductAndSave: jest.fn(),
    handleCache: jest.fn(),
    getQuoteDetailsById: jest.fn(),
    updateBillingAddress: jest.fn(),
    approveQuote:jest.fn(),
  };
  let mockLoggerService = {
    get: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  let mockSfdcBaseService = {
    get: jest.fn(),
    getQuery: jest.fn(),
  };
  let mockSfdcRfqService = {
    getRFQ: jest.fn(),
    getRFQbyGUID: jest.fn(),
    createRFQ: jest.fn(),
    updateRFQByGUID: jest.fn(),
    updateSiteContact: jest.fn(),
  };
  let mockAuth0MachineToMachineService = {
    get: jest.fn(),
  };
  let mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };
  let mockProductsService = {
    getProducts: jest.fn(),
    getStandardPricebook: jest.fn(),
  };
  let mockSfdcServiceableZipCodeService = {
    checkServiceableZipcode: jest.fn(),
  };
  let mockSfdcQuoteService = {
    createQuote: jest.fn(),
    getQuoteStatus: jest.fn(),
    createOpportunity: jest.fn(),
    getQuoteLineIds: jest.fn(),
    deleteQuoteLinesByIds: jest.fn(),
    getQuoteDetails: jest.fn(),
    updateQuoteStatus: jest.fn(),
    updateSiteContact: jest.fn(),
    updateSiteAddress: jest.fn(),
    updateBillingAddress: jest.fn(),
    confirmQuote: jest.fn(),
  };

  //mock Cache Service
  let mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    allKeys: jest.fn(),
  };

 
});
