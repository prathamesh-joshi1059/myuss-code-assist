import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Headers,
  VERSION_NEUTRAL,
  UseFilters,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RFQService } from '../../services/rfq/rfq.service';
import { CreateWebRFQResponseDto } from './dto/create-web-rfq-response.dto';
import { RequestForQuote } from '../../models/request-for-quote.model';
import { ErrorResponse } from '../../models/error-response.model';
import { RFQAuthGuard } from '../../../auth/rfq-auth/rfq-auth.guard';
import { UnauthorizedError } from 'express-jwt';
import { LeadsService } from '../../services/leads/leads.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { RecaptchaService } from '../../../backend/google/recaptcha/recaptcha.service';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { LeadScoringService } from '../../services/lead-scoring/lead-scoring.service';
import { UserService } from '../../../myuss/services/user/user.service';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';

@UseFilters(ThrottlerExceptionFilter)
@Controller({
  path: 'rfq',
  version: [VERSION_NEUTRAL, '1'],
})
export class RFQController {
  constructor(
    private rfqService: RFQService,
    private leadService: LeadsService,
    private recaptchaService: RecaptchaService,
    private leadScoringService: LeadScoringService,
    private logger: LoggerService,
    private auth0UserService: Auth0UserService,
    private userService: UserService,
  ) {}

  // Security on this endpoint is handled using reCaptcha
  // TODO: add rate limiting
  @Post()
  async createRFQ(
    @Body() rfq: RequestForQuote,
  ): Promise<CreateWebRFQResponseDto | ErrorResponse> {
    // Check the reCaptcha
    const recaptchaResult = await this.recaptchaService.verifyRecaptcha(rfq.recaptchaToken, 'submit_rfq');
    if (!recaptchaResult.success) {
      this.logger.error('reCaptchaFailed', recaptchaResult);
      return { error: 'reCaptchaFailed', message: recaptchaResult.failureReason };
    }
    // Add the UUID if it doesn't exist
    rfq.id = rfq.id || uuidv4();
    // Store the RFQ in Firestore async
    this.rfqService.storeRawRFQData(rfq).then(() => {
      this.logger.info('RFQ stored in Firestore');
    }).catch((err) => {
      this.logger.error(err);
    });
    // Filter out irrelevant products
    rfq = this.rfqService.filterIrrelevantProducts(rfq);
    // Get the eligibility
    this.logger.info('Getting eligibility started', new Date());
    const eligibility = await this.rfqService.getEligibilityWrapper(rfq);
    this.logger.info('Getting eligibility finished', new Date());
    // Score the RFQ and create the Lead
    this.logger.info('Creating lead started', new Date());
    rfq.leadId = await this.leadService.createOrUpdateLeadForRfq(rfq);
    this.logger.info('Creating lead finished', new Date());
    // Create the RFQ in Salesforce and SFMC if appropriate
    const response = await this.rfqService.createOrUpdateWebRFQ(rfq, eligibility, 'create');
    return response;
  }

  @Get(':id')
  @UseGuards(RFQAuthGuard)
  async getRFQ(
    @Param('id') id: string,
    @Request() req: Request,
  ): Promise<ApiRespDTO<RequestForQuote> | UnauthorizedError> {
    // Confirm that the RFQ ID in the JWT matches the RFQ ID in the request body
    const rfqIdFromJWT = req['rfq_id'];
    if (rfqIdFromJWT !== id) {
      Logger.error(`RFQ ID in JWT (${rfqIdFromJWT}) does not match RFQ ID in request body (${id})`);
      return new UnauthorizedError('invalid_token', {
        message: 'RFQ ID in JWT does not match RFQ ID in request body',
      });
    }
    return await this.rfqService.getRFQbyId(id);
  }

  @Put(':id')
  @UseGuards(RFQAuthGuard)
  async updateRFQ(
    @Param('id') id: string,
    @Body() rfq: RequestForQuote,
    @Request() req: Request,
  ): Promise<CreateWebRFQResponseDto | ErrorResponse | UnauthorizedError> {
    this.logger.info('RFQController.updateRFQ()', id, rfq);
    rfq.id = id;
    // Confirm that the RFQ ID in the JWT matches the RFQ ID in the request body
    const rfqIdFromJWT = req['rfq_id'];
    if (rfqIdFromJWT !== id) {
      Logger.error(`RFQ ID in JWT (${rfqIdFromJWT}) does not match RFQ ID in request body (${id})`);
      return new UnauthorizedError('invalid_token', {
        message: 'RFQ ID in JWT does not match RFQ ID in request body',
      });
    }
    try {
      // Store the RFQ in Firestore
      this.rfqService.storeRawRFQData(rfq).then(() => {
        this.logger.info('RFQ stored in Firestore');
      });
      // Filter out irrelevant products
      rfq = this.rfqService.filterIrrelevantProducts(rfq);
      // Score the RFQ and create the Lead
      rfq.leadId = await this.leadService.createOrUpdateLeadForRfq(rfq);
      // Get the eligibility
      const eligibility = await this.rfqService.getEligibilityWrapper(rfq);
      // Create the RFQ in Salesforce and SFMC if appropriate
      const response = await this.rfqService.createOrUpdateWebRFQ(rfq, eligibility, 'update');
      // Delete any irrelevant CampaignMembers async
      const priorityGroup = rfq.priorityGroup;
      this.leadScoringService.deleteIrrelevantCampaignMembers(rfq.leadId, priorityGroup).then((resp) => {
        this.logger.info('Irrelevant CampaignMembers deleted', resp);
      });
      // If prod then remove the probability and priority
      if (process.env.ENVIRONMENT === 'production' && response['rfq'] !== undefined) {
        delete response['rfq']?.probabilityModel;
        delete response['rfq']?.winProbability;
        delete response['rfq']?.priorityGroup;
      }
      return response;
    } catch (err) {
      Logger.error(err);
      const errorResponse = new ErrorResponse();
      errorResponse.error = 'error';
      errorResponse.message = err.message;
      return errorResponse;
    }
  }

  @Post('create_user')
  @UseGuards(RFQAuthGuard)
  async createUser(@Headers() headers: any, @Body() user: any): Promise<object> {
    try {
      const resp = await this.auth0UserService.createUser(user);
      this.logger.info('user: ' + user.auth0Id);
      if (!user.auth0Id) {
        return {
          status: 409,
          message: 'User already exists.',
          data: { error: 'error in auth0' },
        };
      } else {
        const signupResp = await this.userService.createUser(user);
        const changePasswordResp = await this.auth0UserService.changePasswordInteractive(user.email);
        return {
          ...signupResp,
          changePasswordMessage: changePasswordResp,
        };
      }
    } catch (err) {
      this.logger.error('error in createUser controller', err);
      return {
        status: 200,
        message: 'Fail',
        data: { error: err },
      };
    }
  }
}